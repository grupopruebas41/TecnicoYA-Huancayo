import React from "react";
import { test, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import OfferCountdown from "./OfferCountdown";
import CandidateCard from "./CandidateCard";
import CandidateList from "./CandidateList";
import SelectionDialog from "./SelectionDialog";
import { OfferError } from "./offerErrors";
import RequestPhase from "../requests/RequestPhase";
import { createEventDedupe } from "../realtime/eventDedupe";
import { subscribeRealtime } from "../realtime/connection";
import { createRegistrationAttempt } from "../requests/requestsApi";
import EvidencePicker from "../requests/EvidencePicker";
import { request } from "../administration/http";
vi.mock("../administration/http", () => ({ request: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});
const start = "2030-01-01T10:00:00Z",
  end = "2030-01-01T10:10:00Z";
const candidate = {
  offer_id: 1,
  technician: { id: 1, display_name: "Técnico de prueba" },
  reference_fee: { amount: "80.00" },
  distance: { km: "3.500" },
  estimate: { status: "new" },
};
test("S04-TC-101 cronómetro del servidor vence una sola vez", () => {
  vi.useFakeTimers();
  const expire = vi.fn();
  render(
    <OfferCountdown expiresAt={end} serverTime={start} onExpire={expire} />,
  );
  expect(screen.getByText("10:00")).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.getByText("09:59")).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(599000));
  expect(screen.getByText("00:00")).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(3000));
  expect(expire).toHaveBeenCalledTimes(1);
});
test("S04-TC-102 desfase local no amplía el plazo", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2020-01-01"));
  const expire = vi.fn();
  render(
    <OfferCountdown expiresAt={start} serverTime={end} onExpire={expire} />,
  );
  expect(screen.getByText("00:00")).toBeInTheDocument();
  expect(expire).toHaveBeenCalledOnce();
});
test("S04-TC-103 deduplica por evento y versión", () => {
  const accept = createEventDedupe();
  expect(accept({ event_id: "e1", request_id: 1, version: 5 }, 4)).toBe(true);
  expect(accept({ event_id: "e1", request_id: 1, version: 5 }, 5)).toBe(false);
  expect(accept({ event_id: "e2", request_id: 1, version: 3 }, 5)).toBe(false);
});
test("S04-TC-104 reconexión pide recurso una vez", () => {
  const handlers = {};
  const refresh = vi.fn();
  const connection = {
    bind: (key, fn) => (handlers[key] = fn),
    unbind: vi.fn(),
  };
  const channel = { listen: vi.fn().mockReturnThis(), stopListening: vi.fn() };
  const echo = {
    connector: { pusher: { connection } },
    private: () => channel,
    leave: vi.fn(),
  };
  const stop = subscribeRealtime(
    echo,
    "requests.1",
    ["request.updated"],
    vi.fn(),
    refresh,
    vi.fn(),
  );
  handlers.state_change({ current: "disconnected" });
  handlers.state_change({ current: "connected" });
  handlers.state_change({ current: "connected" });
  expect(refresh).toHaveBeenCalledOnce();
  stop();
  expect(connection.unbind).toHaveBeenCalled();
});
test("S04-TC-105 distancia aproximada y ausente", () => {
  const { rerender } = render(<CandidateCard candidate={candidate} />);
  expect(
    screen.getByText("≈ 3,5 km · aproximada por zona"),
  ).toBeInTheDocument();
  rerender(<CandidateCard candidate={{ ...candidate, distance: null }} />);
  expect(screen.getByText("Distancia no disponible")).toBeInTheDocument();
});
test("S04-TC-106 estimaciones declaradas", () => {
  const { rerender } = render(<CandidateCard candidate={candidate} />);
  expect(screen.getByText("Nuevo · sin estimación")).toBeInTheDocument();
  rerender(
    <CandidateCard
      candidate={{
        ...candidate,
        estimate: { status: "estimated", minutes: 90 },
      }}
    />,
  );
  expect(screen.getByText("Tiempo estimado: 1 h 30 min")).toBeInTheDocument();
});
test("S04-TC-107 fases en español", () => {
  const phases = {
    matching: "Buscando técnicos",
    awaiting_responses: "Esperando respuestas",
    awaiting_choice: "Elige a tu técnico",
    direct_declined: "Tu técnico no respondió",
    pending_availability: "Pendiente de disponibilidad",
    assigned: "Asignada",
    expired: "Expirada",
  };
  const { rerender } = render(<RequestPhase />);
  for (const [phase, text] of Object.entries(phases)) {
    rerender(<RequestPhase phase={phase} />);
    expect(screen.getByText(text)).toBeInTheDocument();
  }
});
test("S04-TC-108 elección bloquea doble clic y genera una clave", async () => {
  let resolve;
  request.mockImplementation(() => new Promise((r) => (resolve = r)));
  render(
    <SelectionDialog
      requestId={1}
      version={6}
      candidate={candidate}
      onCancel={() => {}}
      onComplete={() => {}}
    />,
  );
  const button = screen.getByRole("button", { name: "Confirmar" });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(request).toHaveBeenCalledTimes(1);
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
  expect(request.mock.calls[0][3].headers["Idempotency-Key"]).toMatch(
    /^[0-9a-f-]{36}$/,
  );
  await act(async () => resolve({ data: { request: { status: "assigned" } } }));
});
test("S04-TC-109 errores conocidos y genérico seguro", () => {
  const cases = {
    OFFER_EXPIRED: "La oferta venció. Ya no puedes responderla.",
    SCHEDULE_CONFLICT:
      "El técnico ya no tiene disponible esa franja. Elige otra opción.",
    TECHNICIAN_UNAVAILABLE:
      "El técnico ya no está disponible. Elige otra opción.",
    ROUND_NOT_CLOSED: "Espera a que respondan todos o venza el plazo.",
    STALE_VERSION: "La información cambió. Actualiza y vuelve a intentarlo.",
  };
  const { rerender } = render(
    <OfferError error={{ code: "UNKNOWN", message: "SQL secreto" }} />,
  );
  expect(screen.getByRole("alert")).not.toHaveTextContent("SQL");
  for (const [code, text] of Object.entries(cases)) {
    rerender(<OfferError error={{ code }} />);
    expect(screen.getByRole("alert")).toHaveTextContent(text);
  }
});
test("S04-TC-110 tarifa peruana referencial", () => {
  const { rerender } = render(<CandidateCard candidate={candidate} />);
  expect(screen.getByText("S/ 80,00 (referencial)")).toBeInTheDocument();
  rerender(
    <CandidateCard
      candidate={{ ...candidate, reference_fee: { amount: "1250.50" } }}
    />,
  );
  expect(screen.getByText("S/ 1 250,50 (referencial)")).toBeInTheDocument();
});
test("S04-TC-111 empate sin numeración", () => {
  const { container } = render(
    <CandidateList
      candidates={[
        { ...candidate, tie_group: "a" },
        { ...candidate, offer_id: 2, tie_group: "a" },
      ]}
    />,
  );
  expect(screen.getAllByText("Empate")).toHaveLength(2);
  expect(container.querySelector("ol")).toBeNull();
});
test("S04-TC-112 creación reutiliza clave ante red y renueva por intento", async () => {
  request
    .mockRejectedValueOnce({ status: 0 })
    .mockResolvedValue({ data: { id: 1 } });
  await createRegistrationAttempt().send({ description: "Falla" });
  expect(request.mock.calls[0][3].headers).toEqual(
    request.mock.calls[1][3].headers,
  );
  await createRegistrationAttempt().send({ description: "Otra falla" });
  expect(request.mock.calls[2][3].headers).not.toEqual(
    request.mock.calls[0][3].headers,
  );
});
test("S04-TC-113 cancelar retiro no borra y conflicto conserva miniatura", async () => {
  request.mockRejectedValue({ status: 409, code: "MEDIA_LINKED" });
  const setMedia = vi.fn();
  render(
    <EvidencePicker
      media={[{ id: 88, url: "/foto.png" }]}
      setMedia={setMedia}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Retirar foto 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(request).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Retirar foto 1" }));
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" })),
  );
  expect(request).toHaveBeenCalledWith("/media/88", undefined, "DELETE");
  expect(screen.getByRole("alert")).toHaveTextContent(
    "La foto está adjunta a una solicitud. Quítala primero de la solicitud.",
  );
  expect(screen.getByAltText("Evidencia 1")).toBeInTheDocument();
  expect(setMedia).not.toHaveBeenCalled();
});

test("S04-TC-112 complemento: validación definitiva permite corregir con nueva clave", async () => {
  request
    .mockRejectedValueOnce({ status: 422 })
    .mockResolvedValue({ data: { id: 2 } });
  const attempt = createRegistrationAttempt();
  await expect(attempt.send({ description: "Inválido" })).rejects.toMatchObject(
    { status: 422 },
  );
  await attempt.send({ description: "Corregido" });
  expect(request.mock.calls[1][1]).toEqual({ description: "Corregido" });
  expect(request.mock.calls[1][3].headers).not.toEqual(
    request.mock.calls[0][3].headers,
  );
});
