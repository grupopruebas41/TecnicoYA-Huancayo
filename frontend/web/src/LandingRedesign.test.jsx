import React from "react";
import { test, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
  within,
} from "@testing-library/react";
import App from "./App";
import { request } from "./features/administration/http";
vi.mock("./features/administration/http", () => ({ request: vi.fn() }));
beforeEach(() => {
  vi.stubGlobal("scrollTo", vi.fn());
  window.location.hash = "#inicio";
  sessionStorage.clear();
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb) {
        this.cb = cb;
      }
      observe(target) {
        this.cb([{ isIntersecting: true, target }]);
      }
      disconnect() {}
    },
  );
  request.mockImplementation(async (path) => {
    if (path === "/me") throw { status: 401 };
    return {
      data:
        path === "/catalog/specialties"
          ? [{ id: 1, name: "Cómputo" }]
          : path === "/catalog/districts"
            ? [
                { id: 1, name: "Huancayo" },
                { id: 2, name: "Chilca" },
              ]
            : path.startsWith("/catalog/subcategories")
              ? [
                  { id: 1, name: "Laptops", specialty_id: 1 },
                  { id: 2, name: "Redes", specialty_id: 1 },
                ]
              : [],
    };
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});
test("S02-TC-089 rediseño: menú móvil atrapa foco y cierra con Escape", async () => {
  render(<App />);
  await act(async () => {});
  const toggle = screen.getByRole("button", { name: "Abrir menú" });
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  const menu = screen.getByRole("navigation", { name: "Principal" });
  const links = within(menu).getAllByRole("link");
  links.at(-1).focus();
  fireEvent.keyDown(menu, { key: "Tab" });
  expect(links[0]).toHaveFocus();
  fireEvent.keyDown(menu, { key: "Escape" });
  expect(toggle).toHaveFocus();
  expect(toggle).toHaveAttribute("aria-expanded", "false");
});
test("S02-TC-089 rediseño: Nosotros completo y testimonios rotulados", async () => {
  window.location.hash = "#nosotros";
  const { container } = render(<App />);
  await act(async () => {});
  expect(container.querySelectorAll("[data-about]")).toHaveLength(12);
  expect(
    screen.getByRole("heading", { name: "Testimonios de ejemplo" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/Proyecto académico – Universidad Continental/),
  ).toBeInTheDocument();
  expect(screen.getByText(/Valores de referencia/)).toBeInTheDocument();
});
test("S02-TC-089 rediseño: contacto sin destinatario no simula envío", async () => {
  window.location.hash = "#nosotros";
  render(<App />);
  await act(async () => {});
  fireEvent.change(screen.getByLabelText("Tu mensaje"), {
    target: { value: "Necesito información" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preparar correo" }));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "contacto aún no está configurado",
  );
  expect(screen.queryByText(/mensaje enviado/i)).not.toBeInTheDocument();
});
test("S02-TC-089 rediseño: cifras reales completas con movimiento reducido", async () => {
  render(<App />);
  await act(async () => {});
  expect(screen.getByLabelText("Especialidades activas")).toHaveTextContent(
    "1",
  );
  expect(screen.getByLabelText("Subcategorías activas")).toHaveTextContent("2");
  expect(screen.getByLabelText("Distritos activos")).toHaveTextContent("2");
  expect(screen.queryByText(/técnicos registrados/i)).not.toBeInTheDocument();
});
test("S02-TC-085 rediseño: catálogo vacío expresa cero sin inventar servicios", async () => {
  request.mockResolvedValue({ data: [] });
  render(<App />);
  await act(async () => {});
  expect(screen.getByLabelText("Especialidades activas")).toHaveTextContent(
    "0",
  );
  expect(
    screen.getByText("No hay especialidades activas disponibles."),
  ).toBeInTheDocument();
});
test("S02-TC-089 rediseño: acceso conserva solo filtros no sensibles", async () => {
  render(<App />);
  await act(async () => {});
  fireEvent.change(screen.getByLabelText("¿Qué necesitas?"), {
    target: { value: "1" },
  });
  fireEvent.change(screen.getByLabelText("¿Dónde?"), {
    target: { value: "2" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Encontrar técnico" }));
  await act(async () => {});
  expect(JSON.parse(sessionStorage.getItem("tecnicoya.searchIntent"))).toEqual({
    specialty_id: "1",
    district_id: "2",
  });
  expect(window.location.hash).toBe("#cuenta");
});

test("S02-TC-089 rediseño: iniciar sesión y registro técnico seleccionan el formulario correcto", async () => {
  const { setAuthIntent } = await import("./landing/config");
  const { default: SessionForm } = await import(
    "./features/administration/SessionForm"
  );
  setAuthIntent("register", "technician");
  render(<SessionForm onLogin={vi.fn()} />);
  expect(
    screen.getByRole("heading", { name: "Crea tu cuenta" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Tipo de cuenta")).toHaveValue("technician");
  expect(
    screen.getByText(/quedará pendiente de verificación/),
  ).toBeInTheDocument();
});
test("S02-TC-089 rediseño: un cliente con sesión conserva filtros y abre su búsqueda", async () => {
  const { Hero } = await import("./landing/Home");
  const { default: ClientPortal } = await import(
    "./features/requests/ClientPortal"
  );
  request.mockImplementation(async (path) =>
    path === "/me"
      ? { data: { role: { code: "client" } } }
      : path.startsWith("/technicians?")
        ? { data: { items: [], pagination: { page: 1, last_page: 1 } } }
        : { data: [] },
  );
  const view = render(
    <Hero
      catalog={{
        data: {
          specialties: [{ id: 1, name: "Cómputo" }],
          districts: [{ id: 2, name: "Chilca" }],
          subcategories: [],
        },
      }}
    />,
  );
  fireEvent.change(screen.getByLabelText("¿Qué necesitas?"), {
    target: { value: "1" },
  });
  fireEvent.change(screen.getByLabelText("¿Dónde?"), {
    target: { value: "2" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Encontrar técnico" }));
  await act(async () => {});
  expect(window.location.hash).toBe("#cuenta/cliente");
  view.unmount();
  render(<ClientPortal />);
  await act(async () => {});
  expect(request).toHaveBeenCalledWith(
    "/technicians?specialty_id=1&district_id=2&page=1",
  );
  expect(
    screen.getByText("No hay técnicos que coincidan con los filtros elegidos."),
  ).toBeInTheDocument();
  expect(sessionStorage.getItem("tecnicoya.searchIntent")).toBeNull();
});
test("S02-TC-089 rediseño: fallo de red no redirige ni declara sesión iniciada", async () => {
  const { Hero } = await import("./landing/Home");
  request.mockRejectedValue({ status: 0 });
  render(
    <Hero
      catalog={{ data: { specialties: [], districts: [], subcategories: [] } }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Encontrar técnico" }));
  await act(async () => {});
  expect(screen.getByRole("alert")).toHaveTextContent(
    "No pudimos comprobar tu sesión",
  );
  expect(window.location.hash).toBe("#inicio");
});
test("S02-TC-085 rediseño: tarifas solo presentes cuando el catálogo las proporciona", async () => {
  const { CarouselDeck } = await import("./ServiceCarousel");
  const view = render(
    <CarouselDeck
      items={[{ id: 1, name: "Servicio", reference_fee: "0.00" }]}
    />,
  );
  expect(screen.getByText("desde S/ 0.00, referencial")).toBeInTheDocument();
  view.rerender(<CarouselDeck items={[{ id: 1, name: "Servicio" }]} />);
  expect(screen.queryByText(/desde S\//)).not.toBeInTheDocument();
});
