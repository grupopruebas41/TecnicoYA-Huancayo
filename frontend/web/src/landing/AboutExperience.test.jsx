import React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import About from "./About";

vi.mock("./Shared", () => ({
  Zones: () => <section data-testid="zones" />,
  FinalCTA: () => <section><h2>Empieza ahora.</h2><a href="#cuenta">Pedir un técnico ↗</a><a href="#cuenta">Soy técnico</a></section>,
}));
vi.mock("../ServiceCarousel", () => ({
  SpecialtyCards: () => <div data-testid="specialties" />,
  CarouselDeck: () => <div data-testid="old-testimonials" />,
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

const catalog = { data: { districts: [], specialties: [], subcategories: [] } };

test("S02-TC-089 Nosotros: navegación y portada presentan la propuesta renovada", () => {
  render(<About catalog={catalog} />);
  const nav = screen.getByRole("navigation", { name: "Acerca de TécnicoYa" });
  expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual([
    "Quiénes somos",
    "Cómo verificamos",
    "Tu seguridad",
    "Testimonios",
    "Equipo",
    "Contacto",
  ]);
  expect(screen.getByRole("heading", { name: /Conectamos talento técnico local con quien lo necesita/ })).toBeInTheDocument();
  expect(screen.getByText("SOMOS TÉCNICOYA")).toBeInTheDocument();
});

test("S02-TC-089 Nosotros: el mapa interactivo cambia de misión a visión y valores", () => {
  render(<About catalog={catalog} />);
  const map = screen.getByRole("region", { name: "Nuestro propósito" });
  expect(within(map).getByRole("heading", { name: "Misión" })).toBeInTheDocument();
  expect(within(map).getByText("Conectar a hogares y MYPES con talento técnico local mediante información clara y atención trazable.")).toBeInTheDocument();
  fireEvent.click(within(map).getByRole("button", { name: "Siguiente propósito" }));
  expect(within(map).getByRole("heading", { name: "Visión" })).toBeInTheDocument();
  expect(within(map).getByText("2 de 3" )).toBeInTheDocument();
  fireEvent.click(within(map).getByRole("button", { name: /Valores/ }));
  expect(within(map).getByRole("heading", { name: "Valores" })).toBeInTheDocument();
  expect(within(map).getByText("Confianza, transparencia y reconocimiento del talento local.")).toBeInTheDocument();
});

test("S02-TC-089 Nosotros: testimonios identifican su carácter ficticio y permiten recorrerlos", () => {
  render(<About catalog={catalog} />);
  const section = screen.getByRole("region", { name: "Testimonios" });
  expect(within(section).getByRole("heading", { name: "Testimonios" })).toBeInTheDocument();
  expect(within(section).getByText("Historias ilustrativas con personajes ficticios.")).toBeInTheDocument();
  expect(within(section).getByText("Valoración ficticia")).toBeInTheDocument();
  expect(within(section).getByRole("button", { name: "Testimonio siguiente" })).toBeInTheDocument();
  fireEvent.click(within(section).getByRole("button", { name: "Testimonio siguiente" }));
  expect(within(section).getByRole("status")).toHaveTextContent("2 de 3");
  expect(within(section).getByText("Mateo")).toBeInTheDocument();
  expect(within(section).getByText("El Tambo · Cómputo")).toBeInTheDocument();
});

test("S02-TC-089 Nosotros: omite la invitación comercial Empieza ahora", () => {
  render(<About catalog={catalog} />);
  expect(screen.queryByRole("heading", { name: /Empieza ahora/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Pedir un técnico ↗" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Soy técnico" })).not.toBeInTheDocument();
});

test("S02-TC-089 Nosotros: testimonios avanzan cada cinco segundos y paran con hover y foco", () => {
  vi.useFakeTimers();
  render(<About catalog={catalog} />);
  const section = screen.getByRole("region", { name: "Testimonios" });
  const deck = section.querySelector(".ty-coverflow");
  act(() => vi.advanceTimersByTime(5000));
  expect(within(section).getByRole("status")).toHaveTextContent("2 de 3");
  fireEvent.mouseEnter(deck);
  act(() => vi.advanceTimersByTime(5000));
  expect(within(section).getByRole("status")).toHaveTextContent("2 de 3");
  fireEvent.mouseLeave(deck);
  const previous = within(section).getByRole("button", { name: "Testimonio anterior" });
  fireEvent.focus(previous);
  act(() => vi.advanceTimersByTime(5000));
  expect(within(section).getByRole("status")).toHaveTextContent("2 de 3");
  fireEvent.blur(previous, { relatedTarget: document.body });
  act(() => vi.advanceTimersByTime(5000));
  expect(within(section).getByRole("status")).toHaveTextContent("3 de 3");
});

test("S02-TC-089 Nosotros: el carrusel respeta movimiento reducido", () => {
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  render(<About catalog={catalog} />);
  expect(screen.getByRole("button", { name: "Rotación automática desactivada por movimiento reducido" })).toBeDisabled();
});
