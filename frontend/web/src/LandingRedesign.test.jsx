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
  window.history.replaceState(null, "", "/");
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
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
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  sessionStorage.clear();
  window.history.replaceState(null, "", "/");
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
  window.history.replaceState(null, "", "/nosotros");
  const { container } = render(<App />);
  await act(async () => {});
  expect(container.querySelectorAll("[data-about]")).toHaveLength(11);
  expect(
    screen.getByRole("heading", { name: "Testimonios" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Historias ilustrativas con personajes ficticios.")).toBeInTheDocument();
  expect(
    screen.getByText(/Proyecto académico – Universidad Continental/),
  ).toBeInTheDocument();
  expect(screen.getByText(/Valores de referencia/)).toBeInTheDocument();
});
test("S02-TC-090 navegar a Nosotros usa la ruta propia y empieza arriba", async () => {
  render(<App />);
  await act(async () => {});
  fireEvent.click(
    within(screen.getByRole("navigation", { name: "Principal" })).getByRole(
      "link",
      { name: "Nosotros" },
    ),
  );
  await act(async () => {});
  expect(window.location.pathname).toBe("/nosotros");
  expect(window.location.hash).toBe("");
  expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  expect(screen.getByRole("heading", { name: /Conectamos talento técnico local/ })).toBeInTheDocument();
});
test("S02-TC-090 desde Nosotros el menú vuelve a servicios sin hash", async () => {
  window.history.replaceState(null, "", "/nosotros");
  render(<App />);
  await act(async () => {});
  fireEvent.click(
    within(screen.getByRole("navigation", { name: "Principal" })).getByRole(
      "link",
      { name: "Servicios" },
    ),
  );
  await act(async () => {});
  expect(window.location.pathname).toBe("/");
  expect(window.location.hash).toBe("");
  expect(screen.getByRole("heading", { name: /¿Qué necesitas resolver/ })).toHaveFocus();
});
test("S02-TC-090 submenú de Nosotros desplaza y enfoca su sección sin hash", async () => {
  window.history.replaceState(null, "", "/nosotros");
  render(<App />);
  await act(async () => {});
  const section = document.getElementById("seguridad");
  section.scrollIntoView = vi.fn();
  fireEvent.click(
    within(screen.getByRole("navigation", { name: "Acerca de TécnicoYa" })).getByRole(
      "link",
      { name: "Tu seguridad" },
    ),
  );
  expect(section.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
  expect(section.querySelector("h2")).toHaveFocus();
  expect(window.location.hash).toBe("");
});
test("S02-TC-091 abrir un hash de sección antiguo limpia la URL y muestra el inicio", async () => {
  window.history.replaceState(null, "", "/#servicios");
  render(<App />);
  await act(async () => {});
  expect(window.location.pathname).toBe("/");
  expect(window.location.hash).toBe("");
  expect(window.history.scrollRestoration).toBe("manual");
  expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  expect(screen.getByRole("heading", { name: /El técnico indicado/ })).toBeInTheDocument();
});
test("S02-TC-089 rediseño: contacto sin destinatario no simula envío", async () => {
  window.history.replaceState(null, "", "/nosotros");
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
test("S02-TC-089 rediseño: Especialidades no presenta un formulario de búsqueda", async () => {
  render(<App />);
  await act(async () => {});
  expect(document.querySelector("#servicios form")).toBeNull();
  expect(screen.queryByLabelText("¿Qué necesitas?")).toBeNull();
  expect(screen.queryByLabelText("¿Dónde?")).toBeNull();
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
  const { CatalogSearch } = await import("./landing/Home");
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
    <CatalogSearch
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
  const { CatalogSearch } = await import("./landing/Home");
  window.history.replaceState(null, "", "/");
  request.mockRejectedValue({ status: 0 });
  render(
    <CatalogSearch
      catalog={{ data: { specialties: [], districts: [], subcategories: [] } }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Encontrar técnico" }));
  await act(async () => {});
  expect(screen.getByRole("alert")).toHaveTextContent(
    "No pudimos comprobar tu sesión",
  );
  expect(window.location.hash).toBe("");
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

test("S02-TC-089 hero centrado sin buscador, con dos líneas amplias y accesos", async () => {
  const { container } = render(<App />);
  await act(async () => {});
  const hero = container.querySelector("#inicio");
  expect(hero).toHaveClass("ty-hero-centered");
  expect(
    within(hero).getByText("Para tu hogar. Para tu negocio. Para Huancayo."),
  ).toBeInTheDocument();
  expect(
    [...hero.querySelectorAll("h1 span")].map((x) => x.textContent),
  ).toEqual(["El técnico indicado.", "Aquí, en Huancayo."]);
  expect(
    within(hero).getByText(
      "Conectamos hogares y MYPES con técnicos independientes verificados.",
    ),
  ).toBeInTheDocument();
  expect(
    within(hero).getByText(
      "Cuéntanos la falla y encuentra a quien puede resolverla.",
    ),
  ).toBeInTheDocument();
  expect(
    within(hero).getByRole("link", { name: "Encontrar un técnico ↗" }),
  ).toHaveAttribute("href", "#servicios");
  const register = within(hero).getByRole("link", { name: "Crear mi cuenta" });
  expect(register).toHaveAttribute("href", "#cuenta");
  register.addEventListener("click", (event) => event.preventDefault(), {
    once: true,
  });
  fireEvent.click(register);
  const { takeAuthIntent } = await import("./landing/config");
  expect(takeAuthIntent()).toEqual({ mode: "register", role: "client" });
  expect(hero.querySelector("form")).toBeNull();
  expect(hero.querySelector('[role="status"]')).toBeNull();
  expect(container.querySelector("#servicios form")).toBeNull();
});
test("S02-TC-089 cabecera con cinco enlaces y único acceso de sesión fuera del menú", async () => {
  render(<App />);
  await act(async () => {});
  const header = screen.getByRole("banner");
  const menu = within(header).getByRole("navigation", { name: "Principal" });
  expect(
    within(menu)
      .getAllByRole("link")
      .map((x) => x.textContent),
  ).toEqual([
    "Servicios",
    "Cómo funciona",
    "Para técnicos",
    "Nosotros",
    "Preguntas",
  ]);
  const login = within(header).getByRole("link", { name: "Iniciar sesión" });
  expect(menu.contains(login)).toBe(false);
  expect(within(header).queryByRole("link", { name: /Crear/ })).toBeNull();
  expect(login).toHaveClass("ty-button");
});
test("S02-TC-089 fondo fijo conserva poster con movimiento reducido", async () => {
  const { container } = render(<App />);
  await act(async () => {});
  const background = container.querySelector(".ty-fixed-background");
  expect(background).toHaveStyle({ position: "fixed", zIndex: "-1" });
  expect(background.querySelector("img")).toHaveAttribute("alt", "");
  expect(background.querySelector("img")).toHaveAttribute(
    "src",
    "/media/landing/habitacion-estatica.webp",
  );
  expect(container.querySelector("video")).toHaveAttribute("hidden");
  expect(container.querySelector("video")).toHaveAttribute(
    "poster",
    "/media/landing/habitacion-estatica.webp",
  );
});
