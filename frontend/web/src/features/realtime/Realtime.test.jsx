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
  });
  expect(refresh).toHaveBeenCalledTimes(2);
  unmount();
  expect(echo.disconnect).toHaveBeenCalledOnce();
  expect(echo.leave).toHaveBeenCalledWith("requests.31");
});
