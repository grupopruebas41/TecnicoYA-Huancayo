import React from "react";
import { test, expect, vi, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import {
  RealtimeProvider,
  useRealtimeResource,
  ConnectionStatus,
} from "./Realtime";
import { makeEcho } from "./connection";
vi.mock("./connection", async (importOriginal) => ({
  ...(await importOriginal()),
  makeEcho: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
function View({ refresh, version = 4 }) {
  const connected = useRealtimeResource(
    "requests.31",
    ["request.updated"],
    refresh,
    version,
  );
  return <ConnectionStatus connected={connected} />;
}
test("S04-TC-104 complemento: hook recupera recurso y desconecta al salir", async () => {
  const handlers = {},
    events = {};
  const channel = {
    listen: vi.fn((name, fn) => {
      events[name] = fn;
      return channel;
    }),
    stopListening: vi.fn(),
    error: vi.fn(),
    subscribed: vi.fn((fn) => {
      handlers.subscribed = fn;
      return channel;
    }),
  };
  const echo = {
    private: () => channel,
    leave: vi.fn(),
    disconnect: vi.fn(),
    connector: {
      pusher: {
        connection: {
          state: "connected",
          bind: (key, fn) => (handlers[key] = fn),
          unbind: vi.fn(),
        },
      },
    },
  };
  makeEcho.mockReturnValue(echo);
  const refresh = vi.fn().mockResolvedValue(undefined);
  const { unmount } = render(
    <RealtimeProvider>
      <View refresh={refresh} />
    </RealtimeProvider>,
  );
  await act(async () => handlers.subscribed());
  expect(
    await screen.findByText("Conexión en tiempo real activa."),
  ).toBeInTheDocument();
  await act(async () => {
    events[".request.updated"]({ event_id: "e1", request_id: 31, version: 5 });
    events[".request.updated"]({ event_id: "e1", request_id: 31, version: 5 });
    events[".request.updated"]({ event_id: "old", request_id: 31, version: 3 });
  });
  expect(refresh).toHaveBeenCalledTimes(1);
  await act(async () => {
    handlers.state_change({ current: "disconnected" });
    handlers.state_change({ current: "connected" });
    handlers.state_change({ current: "connected" });
    handlers.subscribed();
  });
  expect(refresh).toHaveBeenCalledTimes(2);
  unmount();
  expect(echo.disconnect).toHaveBeenCalledOnce();
  expect(echo.leave).toHaveBeenCalledWith("requests.31");
});
function fakeEcho({ alreadySubscribed = false } = {}) {
  const handlers = {};
  const channel = {
    subscription: { subscribed: alreadySubscribed },
    listen: vi.fn(() => channel),
    stopListening: vi.fn(),
    error: vi.fn((fn) => {
      handlers.error = fn;
      return channel;
    }),
    subscribed: vi.fn((fn) => {
      handlers.subscribed = fn;
      return channel;
    }),
  };
  const echo = {
    private: () => channel,
    leave: vi.fn(),
    disconnect: vi.fn(),
    connector: { pusher: { connection: { state: "connected", bind: (key, fn) => (handlers[key] = fn), unbind: vi.fn() } } },
  };
  return { echo, handlers };
}
const ACTIVE = "Conexión en tiempo real activa.";
const LOST = "Sin conexión en tiempo real. Actualiza para ver cambios.";
test("S04-TC-145 solo dice «activa» con el canal suscrito y recupera cuando vuelve a suscribirse, no al reconectar el socket [DEF-60]", async () => {
  const { echo, handlers } = fakeEcho();
  makeEcho.mockReturnValue(echo);
  const refresh = vi.fn().mockResolvedValue(undefined);
  render(
    <RealtimeProvider>
      <View refresh={refresh} />
    </RealtimeProvider>,
  );

  // Socket conectado, autorización del canal todavía pendiente: los eventos aún no llegarían.
  expect(await screen.findByText(LOST)).toBeInTheDocument();
  await act(async () => handlers.subscribed());
  expect(screen.getByText(ACTIVE)).toBeInTheDocument();
  expect(refresh).not.toHaveBeenCalled();

  await act(async () => handlers.state_change({ current: "unavailable" }));
  expect(screen.getByText(LOST)).toBeInTheDocument();
  await act(async () => handlers.state_change({ current: "connected" }));
  expect(screen.getByText(LOST)).toBeInTheDocument();
  expect(refresh).not.toHaveBeenCalled();

  await act(async () => handlers.subscribed());
  expect(screen.getByText(ACTIVE)).toBeInTheDocument();
  expect(refresh).toHaveBeenCalledTimes(1);

  await act(async () => handlers.error(new Error("sin autorización")));
  expect(screen.getByText(LOST)).toBeInTheDocument();
  cleanup();

  // Otro componente ya había suscrito el mismo canal: no volverá a llegar el aviso de suscripción.
  const shared = fakeEcho({ alreadySubscribed: true });
  makeEcho.mockReturnValue(shared.echo);
  render(
    <RealtimeProvider>
      <View refresh={refresh} />
    </RealtimeProvider>,
  );
  expect(await screen.findByText(ACTIVE)).toBeInTheDocument();
});
test("S04-TC-146 una caída que pasa por «connecting» también recupera lo perdido al volver; el primer «connecting» no [DEF-60]", async () => {
  const { echo, handlers } = fakeEcho();
  echo.connector.pusher.connection.state = "connecting";
  makeEcho.mockReturnValue(echo);
  const refresh = vi.fn().mockResolvedValue(undefined);
  render(
    <RealtimeProvider>
      <View refresh={refresh} />
    </RealtimeProvider>,
  );
  await screen.findByText(LOST);

  // Primera conexión de la pantalla: acaba de leer, no hay nada que recuperar.
  await act(async () => handlers.state_change({ current: "connecting" }));
  await act(async () => handlers.state_change({ current: "connected" }));
  await act(async () => handlers.subscribed());
  expect(screen.getByText(ACTIVE)).toBeInTheDocument();
  expect(refresh).not.toHaveBeenCalled();

  // Se vence la espera de respuesta: pusher-js pasa directo a connecting, sin unavailable.
  await act(async () => handlers.state_change({ current: "connecting" }));
  expect(screen.getByText(LOST)).toBeInTheDocument();
  await act(async () => handlers.state_change({ current: "connected" }));
  await act(async () => handlers.subscribed());
  expect(screen.getByText(ACTIVE)).toBeInTheDocument();
  expect(refresh).toHaveBeenCalledTimes(1);
});
