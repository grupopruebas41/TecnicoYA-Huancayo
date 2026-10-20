import React from "react";
import { test, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import ServiceCarousel from "./ServiceCarousel";
import App from "./App";
import { request } from "./features/administration/http";
vi.mock("./features/administration/http", () => ({ request: vi.fn() }));
const items = [
  {
    subcategory_id: 1,
    specialty_id: 1,
    specialty_name: "Cómputo",
    name: "Primero",
    image_url: "/uno.png",
  },
  {
    subcategory_id: 2,
    specialty_id: 1,
    specialty_name: "Cómputo",
    name: "Segundo",
    image_url: "/dos.png",
  },
];
let observe;
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.stubGlobal("scrollTo", vi.fn());
  request.mockImplementation(async (path) => ({
    data:
      path === "/catalog/specialties"
        ? [{ id: 1, name: "Cómputo", description: "Equipos informáticos" }]
        : path.startsWith("/catalog/subcategories")
          ? items.map((x) => ({ ...x, id: x.subcategory_id }))
          : path === "/catalog/carousel"
            ? items
            : [],
  }));
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb) {
        observe = cb;
      }
      observe() {
        observe([{ isIntersecting: true }]);
      }
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
test("S02-TC-084 carrusel reducido y teclado", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  const { container } = render(<ServiceCarousel />);
  await act(async () => {});
  act(() => vi.advanceTimersByTime(5000));
  expect(container.querySelector(".current h4")).toHaveTextContent("Primero");
  fireEvent.keyDown(
    screen.getByRole("button", { name: "Subcategoría siguiente" }),
    { key: "ArrowRight" },
  );
  expect(container.querySelector(".current h4")).toHaveTextContent("Segundo");
});
test("S02-TC-085 carrusel 2500 ms y pausas", async () => {
  vi.useFakeTimers();
  const { container } = render(<ServiceCarousel />);
  await act(async () => {});
  const title = () => container.querySelector(".current h4").textContent;
  act(() => vi.advanceTimersByTime(2499));
  expect(title()).toBe("Primero");
  act(() => vi.advanceTimersByTime(1));
  expect(title()).toBe("Segundo");
  fireEvent.focus(
    screen.getByRole("button", { name: "Subcategoría siguiente" }),
  );
  act(() => vi.advanceTimersByTime(5000));
  expect(title()).toBe("Segundo");
  fireEvent.blur(
    screen.getByRole("button", { name: "Subcategoría siguiente" }),
  );
  act(() => observe([{ isIntersecting: false }]));
  act(() => vi.advanceTimersByTime(5000));
  expect(title()).toBe("Segundo");
});
test("S02-TC-089 diez secciones de landing en orden", async () => {
  window.location.hash = "#inicio";
  const { container } = render(<App />);
  await act(async () => {});
  expect(
    [...container.querySelectorAll("[data-landing]")].map(
      (n) => n.dataset.landing,
    ),
  ).toEqual([
    "Header",
    "Hero",
    "Especialidades",
    "Cómo funciona",
    "Confianza",
    "CTA técnicos",
    "Zonas",
    "FAQ",
    "CTA final",
    "Footer",
  ]);
  expect([...container.querySelectorAll("#principal a")].map(a=>a.getAttribute("href"))).toEqual(["#servicios","#proceso","#tecnicos","#nosotros","#preguntas"]);
  expect(
    screen.getByRole("link", { name: /Conoce más sobre nosotros/ }),
  ).toHaveAttribute("href", "#nosotros");
  for (const section of container.querySelectorAll("[data-landing]")) {
    expect(section.id).toBeTruthy();
    expect(section).toBeVisible();
  }
});

test("S02-TC-089 complemento RETIRO-01: el enlace antiguo abre la landing sin demo", async () => {
  window.location.hash = "#demo";
  const { container } = render(<App />);
  await act(async () => {});
  expect(container.querySelector('[data-landing="Hero"]')).toBeInTheDocument();
  expect(container.querySelectorAll("[data-landing]")).toHaveLength(10);
  expect(
    screen.queryByText(/Demostración interactiva/),
  ).not.toBeInTheDocument();
});

test("S02-TC-084 complemento: especialidades sin subcategorías con foto siguen disponibles", async () => {
  request.mockImplementation(async (path) => ({
    data:
      path === "/catalog/specialties"
        ? [
            { id: 1, name: "Cómputo" },
            { id: 2, name: "Refrigeración comercial" },
            { id: 3, name: "Electricidad" },
          ]
        : [],
  }));
  render(<ServiceCarousel />);
  await act(async () => {});
  expect(
    screen.getByRole("button", { name: "Electricidad" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Cómputo" })).toBeInTheDocument();
  expect(
    screen.getAllByText("Imagen de la especialidad no disponible."),
  ).toHaveLength(3);
  expect(
    screen.getByText(
      "No hay subcategorías con imágenes publicadas para esta especialidad.",
    ),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Electricidad" }));
  expect(
    screen.getByRole("heading", { name: "Electricidad" }),
  ).toBeInTheDocument();
});
test("S02-TC-084 complemento: foto principal pertenece a la especialidad y no a su primer servicio", async () => {
  request.mockImplementation(async (path) => ({
    data:
      path === "/catalog/specialties"
        ? [{ id: 1, name: "Cómputo", image_url: "/principal.png" }]
        : path.startsWith("/catalog/subcategories")
          ? items.map((x) => ({ ...x, id: x.subcategory_id }))
          : path === "/catalog/carousel"
            ? items
            : [],
  }));
  render(<ServiceCarousel />);
  await act(async () => {});
  expect(screen.getByRole("img", { name: "Cómputo" })).toHaveAttribute(
    "src",
    "/principal.png",
  );
});
test("S02-TC-085 complemento: catálogo vacío no inventa especialidades", async () => {
  request.mockResolvedValue({ data: [] });
  render(<ServiceCarousel />);
  await act(async () => {});
  expect(
    screen.getByText("No hay especialidades activas disponibles."),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Subcategoría siguiente" }),
  ).not.toBeInTheDocument();
});

test("S02-TC-085 complemento: pausa al pasar el mouse y retoma a 2500 ms", async () => {
  vi.useFakeTimers();
  const { container } = render(<ServiceCarousel />);
  await act(async () => {});
  const deck = container.querySelector(".subcategory-deck");
  fireEvent.mouseEnter(deck);
  act(() => vi.advanceTimersByTime(5000));
  expect(container.querySelector(".current h4")).toHaveTextContent("Primero");
  fireEvent.mouseLeave(deck);
  act(() => vi.advanceTimersByTime(2499));
  expect(container.querySelector(".current h4")).toHaveTextContent("Primero");
  act(() => vi.advanceTimersByTime(1));
  expect(container.querySelector(".current h4")).toHaveTextContent("Segundo");
});
