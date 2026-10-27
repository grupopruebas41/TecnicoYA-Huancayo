import React from "react";
import { test, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  within,
} from "@testing-library/react";
import RequestWizard from "./RequestWizard";
import RequestSummary from "./RequestSummary";
import EvidencePicker from "./EvidencePicker";
import MyRequests from "./MyRequests";
import ClientPanel from "../client/ClientPanel";
import TechnicianSearch from "../matching/TechnicianSearch";
import { request } from "../administration/http";
import { registrationPayload, stateFromRecord } from "./wizardState";
vi.mock("../administration/http", () => ({
  request: vi.fn(),
  serverNow: () => Date.now(),
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const doc = {
  id: 31,
  status: "registered",
  version: 1,
  description: "Falla sintética del computador",
  address: "Calle sintética 123",
  mode: "asap",
  source: "automatic",
  subcategory: { id: 4, name: "Hardware" },
  district: { id: 1, name: "Huancayo" },
  attachments: [],
  reference_fee: { amount: "80.00" },
};
function catalogs(path) {
  if (path === "/catalog/specialties")
    return { data: [{ id: 1, name: "Cómputo" }] };
  if (path === "/catalog/districts")
    return { data: [{ id: 1, name: "Huancayo" }] };
  if (path.startsWith("/catalog/subcategories"))
    return { data: [{ id: 4, name: "Hardware" }] };
  throw new Error("Ruta inesperada " + path);
}
async function stepFour() {
  await screen.findByRole("option", { name: "Cómputo" });
  fireEvent.change(screen.getByLabelText("Especialidad"), {
    target: { value: "1" },
  });
  fireEvent.click(screen.getByText("Siguiente"));
  await screen.findByRole("option", { name: "Hardware" });
  fireEvent.change(screen.getByLabelText("Subcategoría"), {
    target: { value: "4" },
  });
  fireEvent.click(screen.getByText("Siguiente"));
  fireEvent.change(screen.getByLabelText("Descripción de la falla"), {
    target: { value: doc.description },
  });
  fireEvent.click(screen.getByText("Siguiente"));
  fireEvent.change(screen.getByLabelText("Distrito"), {
    target: { value: "1" },
  });
  fireEvent.change(screen.getByLabelText("Dirección o referencia"), {
    target: { value: doc.address },
  });
}
function StatefulSummary() {
  const [record, set] = React.useState(doc);
  return <RequestSummary record={record} onUpdate={set} />;
}
test("S03-TC-074 complemento: registra una vez, corrige con PATCH y conserva el servicio", async () => {
  let current = doc;
  request.mockImplementation(async (path, body, method) => {
    if (path === "/requests") return { data: current };
    if (path === "/requests/31" && method === "PATCH") {
      current = { ...current, ...body, version: 2 };
      return { data: current };
    }
    return catalogs(path);
  });
  render(<RequestWizard />);
  await stepFour();
  fireEvent.click(screen.getByText("Siguiente"));
  await screen.findByText("Resumen · Solicitud #31");
  expect(screen.getByText("Solicitud registrada. Revisa el resumen antes de enviarla.").tagName).toBe("OUTPUT");
  fireEvent.click(screen.getByText("Atrás"));
  fireEvent.click(screen.getByText("Atrás"));
  fireEvent.change(screen.getByLabelText("Descripción de la falla"), {
    target: { value: "Descripción corregida del computador" },
  });
  fireEvent.click(screen.getByText("Siguiente"));
  fireEvent.click(screen.getByText("Siguiente"));
  await screen.findByText("Descripción corregida del computador");
  expect(screen.getByText("Solicitud actualizada.").tagName).toBe("OUTPUT");
  expect(request.mock.calls.filter(([p]) => p === "/requests")).toHaveLength(1);
  expect(request).toHaveBeenCalledWith(
    "/requests/31",
    expect.objectContaining({
      description: "Descripción corregida del computador",
      expected_version: 1,
    }),
    "PATCH",
  );
});
test("S03-TC-069 complemento: validación enfoca el campo y no registra", async () => {
  request.mockImplementation(async (p) => catalogs(p));
  render(<RequestWizard />);
  fireEvent.click(screen.getByText("Siguiente"));
  expect(screen.getByLabelText("Especialidad")).toHaveFocus();
  expect(screen.getByText("Selecciona una especialidad.")).toBeVisible();
  expect(request.mock.calls.some(([p]) => p === "/requests")).toBe(false);
});
test("S03-TC-074 complemento D-60: creación incierta reintenta con la misma clave", async () => {
  const exit = vi.fn();
  request.mockImplementation(async (p) => {
    if (p === "/requests")
      throw { status: 0, message: "No pudimos confirmar el resultado." };
    return catalogs(p);
  });
  render(<RequestWizard onExit={exit} />);
  await stepFour();
  fireEvent.click(screen.getByText("Siguiente"));
  await screen.findByText("Consultar Mis solicitudes");
  expect(screen.getByText("Siguiente")).toBeDisabled();
  fireEvent.click(screen.getByText("Consultar Mis solicitudes"));
  expect(exit).toHaveBeenCalledOnce();
  const attempts = request.mock.calls.filter(([p]) => p === "/requests");
  expect(attempts).toHaveLength(2);
  expect(attempts[0][3].headers["Idempotency-Key"]).toBe(attempts[1][3].headers["Idempotency-Key"]);
});
test("S03-TC-076 complemento: incertidumbre, lectura registrada y reintento con misma clave", async () => {
  request
    .mockRejectedValueOnce({
      status: 0,
      message: "No pudimos confirmar el resultado.",
    })
    .mockResolvedValueOnce({ data: doc })
    .mockResolvedValueOnce({ data: { id: 31, status: "sent", version: 2 } });
  render(<StatefulSummary />);
  fireEvent.click(screen.getByLabelText("Confirmo que el resumen es correcto"));
  fireEvent.click(screen.getByText("Enviar solicitud"));
  await screen.findByRole("alert");
  await waitFor(() =>
    expect(screen.getByText("Enviar solicitud")).toBeEnabled(),
  );
  expect(screen.queryByText("Solicitud enviada correctamente.")).toBeNull();
  fireEvent.click(screen.getByText("Enviar solicitud"));
  await screen.findByText("Solicitud enviada correctamente.");
  expect(request.mock.calls[0]).toEqual(request.mock.calls[2]);
  expect(screen.queryByText("Enviar solicitud")).toBeNull();
});
test("S03-TC-076 complemento: lectura enviada confirma sin repetir POST", async () => {
  request
    .mockRejectedValueOnce({ status: 0, message: "Resultado incierto" })
    .mockResolvedValueOnce({ data: { ...doc, status: "sent" } });
  render(<StatefulSummary />);
  fireEvent.click(screen.getByLabelText("Confirmo que el resumen es correcto"));
  fireEvent.click(screen.getByText("Enviar solicitud"));
  await screen.findByText(
    "Solicitud enviada. Estado confirmado con el servidor.",
  );
  expect(request).toHaveBeenCalledTimes(2);
  expect(screen.queryByText("Enviar solicitud")).toBeNull();
});
test("S03-TC-077 complemento: límite del servidor y 500 no dan falso éxito", async () => {
  request
    .mockRejectedValueOnce({
      status: 409,
      code: "ACTIVE_REQUEST_LIMIT",
      message: "Alcanzaste el máximo de 3 solicitudes activas.",
    })
    .mockResolvedValueOnce({ data: doc })
    .mockRejectedValueOnce({
      status: 500,
      message: "Servicio no disponible. Referencia: prueba-500",
    });
  render(<StatefulSummary />);
  fireEvent.click(screen.getByLabelText("Confirmo que el resumen es correcto"));
  fireEvent.click(screen.getByText("Enviar solicitud"));
  await screen.findByText(/máximo de 3/);
  await waitFor(() =>
    expect(screen.getByText("Enviar solicitud")).toBeEnabled(),
  );
  fireEvent.click(screen.getByText("Enviar solicitud"));
  await screen.findByText(/prueba-500/);
  expect(screen.getByRole("alert")).toHaveTextContent("Solicitud #31");
  expect(screen.queryByText("Solicitud enviada correctamente.")).toBeNull();
});
test("S03-TC-072 complemento: cancela retiro sin DELETE y confirma con versión", async () => {
  const image = { media_id: 7, url: "/foto.png" },
    set = vi.fn(),
    record = { ...doc, attachments: [image] };
  request.mockResolvedValueOnce(null).mockResolvedValueOnce({ data: doc });
  render(
    <EvidencePicker record={record} media={[]} setMedia={set} onUpdate={set} />,
  );
  fireEvent.click(screen.getByText("Retirar foto 1"));
  fireEvent.click(screen.getByText("Cancelar"));
  expect(request).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Retirar foto 1"));
  fireEvent.click(screen.getByText("Confirmar"));
  await screen.findByText("Foto retirada de la solicitud.");
  expect(request).toHaveBeenCalledWith(
    "/requests/31/attachments/7",
    { expected_version: 1 },
    "DELETE",
  );
});
test("S03-TC-072 complemento: sube evidencia privada y adjunta antes de confirmar", async () => {
  const image = { id: 7, url: "/foto.png" };
  request
    .mockResolvedValueOnce({ data: image })
    .mockResolvedValueOnce({ data: { version: 2 } })
    .mockResolvedValueOnce({
      data: {
        ...doc,
        version: 2,
        attachments: [{ media_id: 7, url: image.url }],
      },
    });
  const update = vi.fn();
  render(
    <EvidencePicker
      record={doc}
      media={[]}
      setMedia={vi.fn()}
      onUpdate={update}
    />,
  );
  fireEvent.change(screen.getByLabelText("Subir evidencia"), {
    target: { files: [new File(["png"], "foto.png", { type: "image/png" })] },
  });
  await screen.findByText("Foto adjuntada.");
  expect(request.mock.calls[0][1].get("purpose")).toBe("evidence");
  expect(request).toHaveBeenCalledWith("/requests/31/attachments", {
    media_id: 7,
    expected_version: 1,
  });
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ version: 2 }));
});
test("S03-TC-072 complemento: archivo inválido no sale del navegador y quinta foto bloquea", () => {
  const view = render(
    <EvidencePicker media={[]} setMedia={vi.fn()} onUpdate={vi.fn()} />,
  );
  fireEvent.change(screen.getByLabelText("Subir evidencia"), {
    target: {
      files: [new File(["pdf"], "foto.pdf", { type: "application/pdf" })],
    },
  });
  expect(screen.getByRole("alert")).toHaveTextContent("JPG");
  expect(request).not.toHaveBeenCalled();
  view.rerender(
    <EvidencePicker
      media={Array.from({ length: 5 }, (_, i) => ({ id: i, url: "/foto.png" }))}
      setMedia={vi.fn()}
      onUpdate={vi.fn()}
    />,
  );
  expect(screen.getByLabelText("Subir evidencia")).toBeDisabled();
});
test("S03-TC-079 complemento: búsqueda, privacidad y solicitud dirigida", async () => {
  const person = {
    id: 12,
    display_name: "Técnico sintético",
    bio: "Experiencia sintética",
    services: [
      { subcategory_id: 4, subcategory_name: "Hardware", reference_fee: "80" },
    ],
    districts: [],
    rating: { average: null },
    portfolio: [
      {
        id: 1,
        title: "Trabajo publicado",
        images: [{ media_id: 3, url: "/foto.png" }],
      },
    ],
    phone: "DATO PRIVADO",
    documents: ["PRIVADO"],
    reviews: [],
  };
  request.mockImplementation(async (p) => {
    if (p === "/technicians/12") return { data: person };
    if (p.startsWith("/technicians?"))
      return {
        data: {
          items: p.includes("min_rating") ? [] : [person],
          pagination: { page: 1, last_page: 1 },
        },
      };
    return catalogs(p);
  });
  const choose = vi.fn();
  render(<TechnicianSearch onRequest={choose} />);
  fireEvent.click(await screen.findByText("Ver perfil de Técnico sintético"));
  await screen.findByText("Experiencia sintética");
  expect(screen.queryByText(/DATO PRIVADO/)).toBeNull();
  expect(screen.getByText("Sin reseñas publicadas todavía.")).toBeVisible();
  fireEvent.click(screen.getByText("Solicitar servicio"));
  expect(choose).toHaveBeenCalledWith(person);
  fireEvent.click(screen.getByText("Volver a la búsqueda"));
  fireEvent.change(screen.getByLabelText("Calificación mínima"), {
    target: { value: "5" },
  });
  expect(
    await screen.findByText(
      "No hay técnicos que coincidan con los filtros elegidos.",
    ),
  ).toBeVisible();
});
test("S03-TC-080 complemento: detalle enviado sin controles de edición", async () => {
  request
    .mockResolvedValueOnce({ data: [{ id: 31, status: "sent" }] })
    .mockResolvedValueOnce({ data: { ...doc, status: "sent" } });
  render(<MyRequests />);
  fireEvent.click(await screen.findByText("Ver solicitud #31"));
  await screen.findByText(doc.description);
  expect(screen.queryByText(/Continuar solicitud/)).toBeNull();
  expect(screen.queryByText("Enviar solicitud")).toBeNull();
  expect(screen.queryByText(/Retirar foto/)).toBeNull();
});
// D-87: el portal del cliente ahora es el panel (ClientPanel); la navegación conserva la etiqueta y los textos.
test("S03-TC-080 complemento: portal abre solicitud y retoma la registrada", async () => {
  request.mockImplementation(async (p) => {
    if (p === "/requests") return { data: [{ id: 31, status: "registered" }] };
    if (p === "/requests/31") return { data: doc };
    if (p.startsWith("/notifications")) return { data: { items: [], pagination: { page: 1, last_page: 1 }, unread_count: 0 } };
    if (p === "/announcements") return { data: [] };
    return catalogs(p);
  });
  render(<ClientPanel user={{ id: "5", name: "Cliente sintético", version: 1, role: { code: "client" }, permissions: [] }} roleLabel="Cliente" onLogout={() => {}} onUserChange={() => {}} onExpired={() => {}} />);
  fireEvent.click(within(screen.getByRole("navigation", { name: "Gestión del cliente" })).getByText("Mis solicitudes"));
  fireEvent.click(await screen.findByText("Ver solicitud #31"));
  fireEvent.click(await screen.findByText("Continuar solicitud #31"));
  expect(await screen.findByText("Paso 5: Resumen y envío")).toHaveFocus();
  const nav = screen.getByRole("navigation", { name: "Gestión del cliente" });
  fireEvent.click(within(nav).getByText("Nueva solicitud"));
  expect(await screen.findByLabelText("Especialidad")).toHaveValue("");
});
test("S03-TC-073 complemento: fechas de registro y reanudación", () => {
  const state = {
    subcategory_id: "4",
    district_id: "1",
    address: "  Calle sintética  ",
    description: "  Descripción sintética suficiente  ",
    mode: "scheduled",
    preferred_start_at: "2030-01-01T12:00Z",
    preferred_end_at: "2030-01-01T13:00Z",
    source: "profile",
    target_technician_id: 12,
  };
  expect(registrationPayload(state)).toMatchObject({
    address: "Calle sintética",
    preferred_start_at: "2030-01-01T12:00:00.000Z",
    target_technician_id: 12,
  });
  expect(stateFromRecord({ ...doc, ...state })).toMatchObject({
    step: 5,
    subcategory_id: "4",
    district_id: "1",
  });
});
