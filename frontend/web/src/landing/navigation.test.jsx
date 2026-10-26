import React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { Header } from "./Shared";
import { calculateScrollTarget, scrollToSection, useScrollToTopOnLoad } from "./navigation";

beforeEach(() => {
  window.history.replaceState(null, "", "/#servicios");
  vi.stubGlobal("scrollTo", vi.fn());
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

test("S02-TC-090 navegar a una sección desplaza con suavidad y no conserva el hash", () => {
  const section = document.createElement("section");
  section.id = "servicios";
  section.innerHTML = "<h2>Servicios disponibles</h2>";
  document.body.append(section);

  scrollToSection("servicios");

  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  expect(section.querySelector("h2")).toHaveFocus();
  expect(section.querySelector("h2")).toHaveAttribute("tabindex", "-1");
  expect(window.location.hash).toBe("");
  section.remove();
});

test("S02-TC-090 movimiento reducido usa desplazamiento inmediato", () => {
  const section = document.createElement("section");
  section.id = "preguntas";
  document.body.append(section);
  vi.stubGlobal("matchMedia", () => ({ matches: true }));

  scrollToSection("preguntas");

  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  section.remove();
});

test("S02-TC-091 al montar limpia hashes de sección y vuelve al inicio en modo manual", () => {
  function Harness() {
    useScrollToTopOnLoad("/");
    return <div />;
  }

  render(<Harness />);

  expect(window.history.scrollRestoration).toBe("manual");
  expect(window.location.hash).toBe("");
  expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
});

test("S02-TC-092 el menú móvil se cierra después de navegar a una sección", () => {
  const section = document.createElement("section");
  section.id = "servicios";
  section.innerHTML = "<h2>Servicios disponibles</h2>";
  document.body.append(section);

  render(<Header />);
  fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
  expect(screen.getByRole("button", { name: "Cerrar menú" })).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(screen.getByRole("link", { name: "Servicios" }));

  expect(window.scrollTo).toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Abrir menú" })).toHaveAttribute("aria-expanded", "false");
  expect(window.location.hash).toBe("");
  section.remove();
});

test("S02-TC-092 complemento: una sección corta ya no se centra, alinea su borde bajo cabecera y submenú", () => {
  const target = calculateScrollTarget({
    sectionRect: { top: 900, height: 360 },
    headerRect: { top: 0, bottom: 72, height: 72 },
    subnavRect: { top: 80, bottom: 120, height: 40 },
    viewportHeight: 800,
    scrollY: 300,
  });

  expect(target).toBe(1080);
});

test("S02-TC-092 complemento: una sección alta alinea su borde bajo cabecera y submenú sin margen extra", () => {
  const target = calculateScrollTarget({
    sectionRect: { top: 900, height: 700 },
    headerRect: { top: 0, bottom: 72, height: 72 },
    subnavRect: { top: 80, bottom: 120, height: 40 },
    viewportHeight: 800,
    scrollY: 300,
  });

  expect(target).toBe(1080);
});
