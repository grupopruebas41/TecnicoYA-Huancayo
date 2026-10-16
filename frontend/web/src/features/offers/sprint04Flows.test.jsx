import React from "react";
import { test, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
  waitFor,
} from "@testing-library/react";
import OffersInbox from "./OffersInbox";
import RequestTracking from "./RequestTracking";
import Notifications from "../realtime/Notifications";
import { request } from "../administration/http";
vi.mock("../administration/http", () => ({ request: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const meta = { server_time: "2030-01-01T10:00:00Z" };
const offer = {
  id: 1,
  status: "pending",
  version: 1,
  expires_at: "2030-01-01T10:10:00Z",
  request: {
    id: 31,
    description: "Falla sintética",
    district: { name: "Huancayo" },
    subcategory: { name: "Cómputo" },
    evidence: [],
    address: null,
  },
};
const candidate = {
  offer_id: 1,
  technician: { id: 1, display_name: "Técnico sintético" },
  reference_fee: { amount: "80" },
  distance: null,
  estimate: { status: "new" },
};
test("S04-TC-102 complemento: aceptar no asigna y respuesta actualiza estado", async () => {
  request.mockImplementation(async (path, body) => {
    if (body) return { data: { status: "accepted" }, meta };
    if (path === "/offers/1")
      return { data: { ...offer, status: "accepted", version: 2 }, meta };
    return { data: { items: [offer] }, meta };
  });
  render(<OffersInbox technicianId={1} />);
  const button = await screen.findByText("Aceptar");
  fireEvent.click(button);
  await screen.findByText(
    "Aceptaste la oferta. El cliente elegirá cuando cierre la ronda.",
  );
  await screen.findByText("Aceptada");
  expect(screen.queryByText("Asignada")).not.toBeInTheDocument();
  expect(request).toHaveBeenCalledWith("/offers/1");
  expect(screen.getByText(/Sin conexión en tiempo real/)).toHaveAttribute(
    "role",
    "status",
  );
});
test("S04-TC-109 complemento: rechazo cancela y conflicto relee oferta vencida", async () => {
  request.mockImplementation(async (path, body) => {
    if (body) throw { status: 409, code: "OFFER_EXPIRED" };
    if (path === "/offers/1")
      return { data: { ...offer, status: "expired" }, meta };
    return { data: { items: [offer] }, meta };
  });
  render(<OffersInbox technicianId={1} />);
  fireEvent.click(await screen.findByText("Rechazar"));
  fireEvent.click(screen.getByText("Cancelar"));
  expect(request.mock.calls.some(([, b]) => b)).toBe(false);
  fireEvent.click(screen.getByText("Rechazar"));
  fireEvent.click(screen.getByText("Confirmar"));
  await screen.findByText("Vencida");
  expect(screen.getByRole("alert")).toHaveTextContent("La oferta venció");
  expect(screen.queryByText("Rechazaste la oferta.")).not.toBeInTheDocument();
});
test("S04-TC-109 complemento: red incierta recupera sin falso éxito", async () => {
  request.mockImplementation(async (path, body) => {
    if (body) throw { status: 0 };
    if (path === "/offers/1")
      return { data: { ...offer, status: "accepted" }, meta };
    return { data: { items: [offer] }, meta };
  });
  render(<OffersInbox technicianId={1} />);
  fireEvent.click(await screen.findByText("Aceptar"));
  await screen.findByText("Aceptada");
  expect(
    screen.queryByText(
      "Aceptaste la oferta. El cliente elegirá cuando cierre la ronda.",
    ),
  ).not.toBeInTheDocument();
  expect(request).toHaveBeenCalledWith("/offers/1");
});
function setupTracking(phase = "awaiting_choice", failure = null) {
  let version = 6;
  request.mockImplementation(async (path, body) => {
    if (body) {
      version++;
      if (failure) throw failure;
      return { data: { request: { status: "assigned" } }, meta };
    }
    if (path.endsWith("/candidates"))
      return {
        data: {
          phase: version === 6 ? phase : "assigned",
          request_version: version,
          accepted: version === 6 ? [candidate] : [],
          alternatives: [candidate],
        },
        meta,
      };
    return {
      data: {
        id: 31,
        phase: version === 6 ? phase : "assigned",
        version,
        search: { pending_expires_at: "2030-01-02T10:00:00Z" },
      },
      meta,
    };
  });
}
test("S04-TC-108 complemento: selección confirma estado servidor", async () => {
  setupTracking();
  render(<RequestTracking requestId={31} />);
  fireEvent.click(await screen.findByText("Elegir a Técnico sintético"));
  fireEvent.click(screen.getByText("Confirmar"));
  await screen.findByText("Asignaste a Técnico sintético.");
  await screen.findByText("Asignada");
  expect(
    screen.queryByRole("button", { name: "Elegir a Técnico sintético" }),
  ).not.toBeInTheDocument();
});
test("S04-TC-109 complemento: cualquier 409 recarga candidatos", async () => {
  setupTracking("awaiting_choice", { status: 409, code: "SCHEDULE_CONFLICT" });
  render(<RequestTracking requestId={31} />);
  fireEvent.click(await screen.findByText("Elegir a Técnico sintético"));
  fireEvent.click(screen.getByText("Confirmar"));
  await screen.findByText("Asignada");
  expect(screen.getByRole("alert")).toHaveTextContent(
    "El técnico ya no tiene disponible esa franja",
  );
  expect(
    request.mock.calls.filter(([p]) => p === "/requests/31/candidates"),
  ).toHaveLength(2);
  expect(
    screen.queryByText("Asignaste a Técnico sintético."),
  ).not.toBeInTheDocument();
});
test("S04-TC-107 complemento: pendiente muestra hora Lima y alternativa requiere autorización", async () => {
  setupTracking("pending_availability");
  const { unmount } = render(<RequestTracking requestId={31} />);
  await screen.findByText(/Buscaremos hasta el/);
  expect(screen.getByText(/hora de Lima/)).toHaveTextContent("5:00");
  unmount();
  setupTracking("direct_declined");
  render(<RequestTracking requestId={32} />);
  fireEvent.click(await screen.findByText("Buscar otros técnicos"));
  await screen.findByText("Autorizaste la búsqueda de otros técnicos.");
  expect(
    request.mock.calls.some(
      ([p, b, m, o]) =>
        p === "/requests/32/alternative-searches" &&
        b.expected_version === 6 &&
        o.headers["Idempotency-Key"],
    ),
  ).toBe(true);
});
test("S04-TC-104 complemento: notificaciones recupera after_id sin duplicar", async () => {
  request.mockResolvedValue({
    data: {
      items: [
        {
          id: 9,
          event_id: "e9",
          title: "Aviso sintético",
          body: "Revisa la oferta",
        },
      ],
      pagination: { last_page: 1 },
    },
    meta,
  });
  render(<Notifications userId={1} />);
  await screen.findByText("Aviso sintético");
  await act(async () =>
    fireEvent.click(screen.getByText("Actualizar notificaciones")),
  );
  expect(request).toHaveBeenCalledWith(
    "/notifications?after_id=9&page=1&per_page=50",
  );
  expect(screen.getAllByText("Aviso sintético")).toHaveLength(1);
});
test("S04-TC-109 complemento: lecturas fallidas permiten actualizar sin falso vacío", async () => {
  request.mockRejectedValue({ status: 500 });
  render(<OffersInbox technicianId={1} />);
  await screen.findByRole("alert");
  expect(
    screen.queryByText("No tienes ofertas pendientes ni aceptadas."),
  ).not.toBeInTheDocument();
  request.mockResolvedValue({ data: { items: [] }, meta });
  fireEvent.click(screen.getByText("Actualizar ofertas"));
  await screen.findByText("No tienes ofertas pendientes ni aceptadas.");
});

test("S04-TC-102 complemento: vencer deshabilita Aceptar con reloj local distinto", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2020-01-01"));
  request.mockResolvedValue({
    data: { items: [{ ...offer, expires_at: "2030-01-01T10:00:01Z" }] },
    meta,
  });
  render(<OffersInbox technicianId={1} />);
  await act(async () => {});
  expect(screen.getByText("Aceptar")).toBeEnabled();
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.getByText("Aceptar")).toBeDisabled();
  expect(screen.getByText("Plazo vencido")).toBeInTheDocument();
  vi.useRealTimers();
});
