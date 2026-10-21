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
test("S02-TC-085 carrusel 3000 ms y pausas", async () => {
  vi.useFakeTimers();
  const { container } = render(<ServiceCarousel />);
  await act(async () => {});
  const title = () => container.querySelector(".current h4").textContent;
  act(() => vi.advanceTimersByTime(2999));
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
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
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

test("S02-TC-084 complemento: especialidades sin foto siguen disponibles y declaran que no hay subcategorías", async () => {
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
    screen.getByText(
      "Aún no hay subespecialidades activas para esta especialidad.",
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
  expect(screen.getByRole("img", { name: "Servicio de Cómputo" })).toHaveAttribute(
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

test("S02-TC-085 complemento: pausa al pasar el mouse y retoma a 3000 ms", async () => {
  vi.useFakeTimers();
  const { container } = render(<ServiceCarousel />);
  await act(async () => {});
  const deck = container.querySelector(".ty-product-carousel");
  fireEvent.mouseEnter(deck);
  act(() => vi.advanceTimersByTime(5000));
  expect(container.querySelector(".current h4")).toHaveTextContent("Primero");
  fireEvent.mouseLeave(deck, { relatedTarget: document.body });
  act(() => vi.advanceTimersByTime(2999));
  expect(container.querySelector(".current h4")).toHaveTextContent("Primero");
  act(() => vi.advanceTimersByTime(1));
  expect(container.querySelector(".current h4")).toHaveTextContent("Segundo");
});

test("S02-TC-089 vitrina no muestra formularios de búsqueda", async () => {
 const {container}=render(<ServiceCarousel/>); await act(async()=>{});
 expect(container.querySelectorAll("select")).toHaveLength(0);
 expect(screen.queryByRole("button",{name:/Encontrar técnico/i})).toBeNull();
});
test("S02-TC-089 especialidad y subespecialidades vienen del API", async()=>{
 const {container}=render(<ServiceCarousel/>); await act(async()=>{});
 expect(screen.getByRole("heading",{name:"Cómputo"})).toBeInTheDocument();
 expect(container.querySelectorAll(".ty-product-card")).toHaveLength(2);
 expect(screen.getByText("Subespecialidades disponibles")).toBeInTheDocument();
 expect(container.querySelector(".service-main-photo img")).toHaveAttribute("src","/uno.png");
});
test("S02-TC-089 imagen local por categoría y subcategoría cuando el API no aporta foto",async()=>{
 request.mockImplementation(async(path)=>({data:path==="/catalog/specialties"?[{id:1,name:"Cómputo"}]:path.startsWith("/catalog/subcategories")?[{id:8,specialty_id:1,name:"Hardware"}]:[]}));
 const {container}=render(<ServiceCarousel/>);await act(async()=>{});
 expect(container.querySelector(".ty-vitrine-main img")).toHaveAttribute("src","/media/services/subcategorias/computo/hardware.png");
});
test("S02-TC-089 mini carrusel rota cada 3 segundos, pausa con hover y permite elegir tarjeta", async()=>{
 vi.useFakeTimers(); const {container}=render(<ServiceCarousel/>); await act(async()=>{});
 const stage=container.querySelector(".ty-product-stage");
 expect(stage.querySelector(".ty-product-card.is-center h3")).toHaveTextContent("Primero");
 act(()=>vi.advanceTimersByTime(3000));
 expect(stage.querySelector(".ty-product-card.is-center h3")).toHaveTextContent("Segundo");
 fireEvent.mouseEnter(stage); act(()=>vi.advanceTimersByTime(6000));
 expect(stage.querySelector(".ty-product-card.is-center h3")).toHaveTextContent("Segundo");
 fireEvent.mouseLeave(stage);
 const side=stage.querySelector(".ty-product-card.is-side"); fireEvent.click(side);
 expect(stage.querySelector(".ty-product-card.is-center h3")).toHaveTextContent(side.querySelector("h3").textContent);
});
test("S02-TC-089 botones y chips cambian de especialidad", async()=>{
 request.mockImplementation(async(path)=>({data:path==="/catalog/specialties"?[{id:1,name:"Cómputo"},{id:2,name:"Electricidad"}]:path.startsWith("/catalog/subcategories")?[{id:3,specialty_id:2,name:"Tableros"}]:[]}));
 render(<ServiceCarousel/>); await act(async()=>{});
 fireEvent.click(screen.getByRole("button",{name:"Siguiente especialidad"}));
 expect(screen.getByRole("heading",{name:"Electricidad"})).toBeInTheDocument();
 fireEvent.click(screen.getByRole("button",{name:"Cómputo",pressed:false}));
 expect(screen.getByRole("heading",{name:"Cómputo"})).toBeInTheDocument();
});
test("S02-TC-089 autoplay cambia de especialidad a los 9 segundos y se pausa al pasar el mouse",async()=>{
 vi.useFakeTimers();
 request.mockImplementation(async(path)=>({data:path==="/catalog/specialties"?[{id:1,name:"Cómputo"},{id:2,name:"Electricidad"}]:path.startsWith("/catalog/subcategories")?[{id:3,specialty_id:2,name:"Tableros"}]:[]}));
 const {container}=render(<ServiceCarousel/>);await act(async()=>{});
 act(()=>vi.advanceTimersByTime(8999));expect(screen.getByRole("heading",{name:"Cómputo"})).toBeInTheDocument();
 act(()=>vi.advanceTimersByTime(1));expect(screen.getByRole("heading",{name:"Electricidad"})).toBeInTheDocument();
 fireEvent.mouseEnter(container.querySelector(".ty-vitrine"));
 act(()=>vi.advanceTimersByTime(18000));expect(screen.getByRole("heading",{name:"Electricidad"})).toBeInTheDocument();
 fireEvent.mouseLeave(container.querySelector(".ty-vitrine"),{relatedTarget:document.body});
 act(()=>vi.advanceTimersByTime(9000));expect(screen.getByRole("heading",{name:"Cómputo"})).toBeInTheDocument();
});
test("S02-TC-089 reduced motion detiene rotación automática",async()=>{
 vi.useFakeTimers();vi.stubGlobal("matchMedia",()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
 const {container}=render(<ServiceCarousel/>);await act(async()=>{});
 act(()=>vi.advanceTimersByTime(30000));
 expect(container.querySelector(".ty-product-card.is-center h3")).toHaveTextContent("Primero");
});
test("S02-TC-089 carga error único con un mensaje y un reintento",async()=>{
 request.mockRejectedValue(new Error("El servicio no está disponible."));
 render(<ServiceCarousel/>);await act(async()=>{});
 expect(screen.getAllByRole("alert")).toHaveLength(1);
 expect(screen.getAllByText("El servicio no está disponible.")).toHaveLength(1);
 expect(screen.getAllByRole("button",{name:"Reintentar"})).toHaveLength(1);
});
test("S02-TC-089 zonas son enfocables y muestran zona activa",async()=>{
 const { Zones } = await import("./landing/Shared");
 const {container}=render(<Zones/>); await act(async()=>{});
 const zones=container.querySelectorAll(".ty-map-zone");
 expect(zones).toHaveLength(3); fireEvent.focus(zones[1]);
 expect(zones[1]).toHaveAttribute("aria-label","Zona Huancayo");
 expect(screen.getByRole("status")).toHaveTextContent("Huancayo");
});
