import React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { FinalCTA, Footer } from "./Shared";
import { takeAuthIntent } from "./config";
import About from "./About";
import { SpecialtyCards } from "../ServiceCarousel";
import { CONTACT, CONTACT_PENDING, contactItems, isContactConfigured } from "./contact";
import { calculateScrollTarget, scrollToSection } from "./navigation";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  vi.stubGlobal("scrollTo", vi.fn());
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

function rect(top, height) {
  return { top, bottom: top + height, height, width: 1366, left: 0, right: 1366 };
}

test("S02-TC-092 complemento: alinea el borde superior justo debajo de cabecera y submenú", () => {
  const target = calculateScrollTarget({
    sectionRect: { top: 900, height: 360 },
    headerRect: { top: 0, bottom: 77, height: 77 },
    subnavRect: { top: 77, bottom: 131, height: 54 },
    viewportHeight: 768,
    scrollY: 300,
  });

  expect(target).toBe(1069);
});

test("S02-TC-092 complemento: en la landing sin submenú alinea bajo la cabecera", () => {
  const target = calculateScrollTarget({
    sectionRect: { top: 900, height: 360 },
    headerRect: { top: 0, bottom: 77, height: 77 },
    viewportHeight: 768,
    scrollY: 300,
  });

  expect(target).toBe(1123);
});

test("S02-TC-092 complemento: el grupo centrado queda en medio del espacio bajo la cabecera", () => {
  const centered = calculateScrollTarget({
    sectionRect: { top: 900, height: 500 },
    headerRect: { top: 0, bottom: 77, height: 77 },
    viewportHeight: 768,
    scrollY: 300,
    mode: "center",
  });
  const tooTall = calculateScrollTarget({
    sectionRect: { top: 900, height: 800 },
    headerRect: { top: 0, bottom: 77, height: 77 },
    viewportHeight: 768,
    scrollY: 300,
    mode: "center",
  });

  expect(centered).toBe(1027.5);
  expect(tooTall).toBe(1123);
});

test("S02-TC-092 complemento: Cómo funciona encuadra juntos los pasos y la confianza", () => {
  document.body.innerHTML = `
    <header class="ty-header"></header>
    <div class="ty-frame-group" data-frame="center">
      <section id="proceso"><h2>Más simple, paso a paso.</h2></section>
      <section id="confianza"><h2>Técnicos verificados</h2></section>
    </div>`;
  document.querySelector(".ty-header").getBoundingClientRect = () => rect(0, 77);
  document.querySelector(".ty-frame-group").getBoundingClientRect = () => rect(1000, 600);
  document.getElementById("proceso").getBoundingClientRect = () => rect(1000, 300);

  scrollToSection("proceso");

  // Disponible 768 - 77 = 691; el grupo de 600 px queda a 77 + 45,5 px del borde.
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 877.5, behavior: "smooth" });
  expect(document.querySelector("#proceso h2")).toHaveFocus();
});

test("S02-TC-092 complemento: en Nosotros la sección empieza bajo la barra del submenú", () => {
  document.body.innerHTML = `
    <div class="landing-page about-page">
      <header class="ty-header"></header>
      <div class="ty-about-navbar"><nav class="ty-about-nav"></nav></div>
      <section id="testimonios"><h2>Testimonios</h2></section>
    </div>`;
  document.querySelector(".ty-header").getBoundingClientRect = () => rect(0, 77);
  document.querySelector(".ty-about-navbar").getBoundingClientRect = () => rect(77, 56);
  document.getElementById("testimonios").getBoundingClientRect = () => rect(2400, 640);

  scrollToSection("testimonios");

  expect(window.scrollTo).toHaveBeenCalledWith({ top: 2267, behavior: "smooth" });
});

test("S02-TC-089 complemento: el pie tiene cuatro columnas y la barra académica", () => {
  render(<Footer />);
  const footer = screen.getByRole("contentinfo");

  for (const title of ["Navegación", "Contacto", "Legal"]) {
    expect(within(footer).getByRole("heading", { name: title })).toBeInTheDocument();
  }
  expect(within(footer).getByText("Talento local. Soluciones cerca.")).toBeInTheDocument();
  expect(within(footer).getByText("Huancayo 2026")).toBeInTheDocument();
  expect(within(footer).getByText("© 2026 TécnicoYa · Proyecto académico – Universidad Continental")).toBeInTheDocument();
  expect(footer.querySelector("details")).toBeNull();
});

test("S02-TC-089 complemento: Términos y Privacidad abren un panel modal que se cierra con Escape", () => {
  render(<Footer />);
  const terms = screen.getByRole("button", { name: "Términos" });

  fireEvent.click(terms);
  const dialog = screen.getByRole("dialog", { name: "Términos" });
  expect(dialog).toHaveAttribute("aria-modal", "true");
  expect(dialog).toHaveTextContent("Versión académica MVP");
  expect(within(dialog).getByRole("button", { name: "Cerrar" })).toHaveFocus();

  fireEvent.keyDown(dialog, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(terms).toHaveFocus();

  fireEvent.click(screen.getByRole("button", { name: "Privacidad" }));
  const privacy = screen.getByRole("dialog", { name: "Privacidad" });
  expect(privacy).toHaveTextContent("Las evidencias son privadas");
  fireEvent.click(within(privacy).getByRole("button", { name: "Cerrar" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("S02-TC-089 complemento: los datos de contacto viven en un solo archivo y se muestran por confirmar", () => {
  expect(CONTACT).toEqual({ whatsapp: null, email: null, hours: null });
  expect(Object.isFrozen(CONTACT)).toBe(true);
  expect(isContactConfigured()).toBe(false);
  expect(isContactConfigured({ whatsapp: "999 000 000", email: "equipo@example.org", hours: null })).toBe(true);
  expect(contactItems().map((item) => [item.label, item.value, item.pending])).toEqual([
    ["WhatsApp", CONTACT_PENDING, true],
    ["Correo", CONTACT_PENDING, true],
    ["Horario", CONTACT_PENDING, true],
  ]);
});

test("S02-TC-089 complemento: Nosotros y el pie no muestran datos de ejemplo REEMPLAZAR", () => {
  window.history.replaceState(null, "", "/nosotros");
  render(<><About catalog={{ data: { districts: [], specialties: [], subcategories: [] } }} /><Footer /></>);
  const contact = document.getElementById("contacto");

  expect(within(contact).getByText("Datos por confirmar")).toBeInTheDocument();
  expect(within(contact).getAllByText(CONTACT_PENDING)).toHaveLength(3);
  expect(document.body).not.toHaveTextContent(/REEMPLAZAR|example\.invalid/);
});

test("S02-TC-089 complemento: tarjetas de especialidad usan la imagen local por slug", () => {
  render(
    <SpecialtyCards
      specialties={[
        { id: 1, name: "Cómputo" },
        { id: 2, name: "Refrigeración comercial" },
        { id: 3, name: "Electricidad", image_url: "/api/media/electricidad.webp" },
        { id: 4, name: "Gasfitería" },
      ]}
      onSelect={vi.fn()}
    />,
  );

  expect(screen.getByRole("img", { name: "Cómputo" })).toHaveAttribute("src", "/media/services/computo.png");
  expect(screen.getByRole("img", { name: "Refrigeración comercial" })).toHaveAttribute("src", "/media/services/refrigeracion.png");
  expect(screen.getByRole("img", { name: "Electricidad" })).toHaveAttribute("src", "/api/media/electricidad.webp");
  expect(screen.queryByRole("img", { name: "Gasfitería" })).not.toBeInTheDocument();
  expect(screen.getAllByText("Imagen no disponible")).toHaveLength(1);
});

function controllableObserver() {
  const observers = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback, options) {
        this.callback = callback;
        this.options = options;
        this.targets = [];
        observers.push(this);
      }
      observe(target) {
        this.targets.push(target);
      }
      disconnect() {}
    },
  );
  return (selector, isIntersecting) => {
    for (const observer of observers) {
      const target = observer.targets.find((el) => el.matches(selector));
      if (target) act(() => observer.callback([{ target, isIntersecting }]));
    }
  };
}

test("S02-TC-089 complemento: el submenú de Nosotros se oculta sobre la portada y aparece al salir de ella", () => {
  const report = controllableObserver();
  render(<div className="landing-page about-page"><About catalog={{ data: { districts: [], specialties: [], subcategories: [] } }} /></div>);
  const bar = document.querySelector(".ty-about-navbar");

  report(".ty-about-hero", true);
  expect(bar).toHaveAttribute("aria-hidden", "true");
  expect(bar).toHaveAttribute("inert");
  expect(screen.queryByRole("navigation", { name: "Acerca de TécnicoYa" })).not.toBeInTheDocument();

  report(".ty-about-hero", false);
  expect(bar).not.toHaveAttribute("aria-hidden");
  expect(bar).not.toHaveAttribute("inert");
  expect(bar).toHaveClass("is-visible");
  expect(screen.getByRole("navigation", { name: "Acerca de TécnicoYa" })).toBeInTheDocument();

  report(".ty-about-hero", true);
  expect(bar).toHaveAttribute("aria-hidden", "true");
});

test("S02-TC-092 complemento: el encuadre cuenta el submenú aunque aún esté oculto sobre la portada", () => {
  document.body.innerHTML = `
    <div class="landing-page about-page">
      <header class="ty-header"></header>
      <div class="ty-about-navbar is-hidden" aria-hidden="true"><nav class="ty-about-nav"></nav></div>
      <section id="contacto"><h2>Estamos cerca.</h2></section>
    </div>`;
  document.querySelector(".ty-header").getBoundingClientRect = () => rect(0, 77);
  // Oculto se desplaza hacia arriba bajo la cabecera; su altura sigue siendo 56 px.
  document.querySelector(".ty-about-navbar").getBoundingClientRect = () => rect(21, 56);
  document.getElementById("contacto").getBoundingClientRect = () => rect(5000, 640);

  scrollToSection("contacto");

  expect(window.scrollTo).toHaveBeenCalledWith({ top: 4867, behavior: "smooth" });
});

test("S02-TC-089 complemento: Empieza ahora ofrece dos caminos con su registro correcto", () => {
  render(<FinalCTA />);
  const client = screen.getByRole("article", { name: "Necesito un técnico" });
  const technician = screen.getByRole("article", { name: "Soy técnico" });

  for (const text of ["Describe la falla", "Recibe recomendaciones", "Sigue la atención"]) {
    expect(within(client).getByText(text)).toBeInTheDocument();
  }
  for (const text of ["Clientes de tu zona", "Tú pones tu tarifa", "Construye reputación"]) {
    expect(within(technician).getByText(text)).toBeInTheDocument();
  }

  const ask = within(client).getByRole("link", { name: "Pedir un técnico ↗" });
  expect(ask).toHaveAttribute("href", "#cuenta");
  fireEvent.click(ask);
  expect(takeAuthIntent()).toEqual({ mode: "register", role: "client" });

  const join = within(technician).getByRole("link", { name: "Registrarme como técnico" });
  expect(join).toHaveAttribute("href", "#cuenta");
  fireEvent.click(join);
  expect(takeAuthIntent()).toEqual({ mode: "register", role: "technician" });
});
