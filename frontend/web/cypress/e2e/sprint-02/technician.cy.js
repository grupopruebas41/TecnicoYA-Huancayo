import { login } from "../sprint-04/helpers";
import { observe } from "./helpers";

// S02-TC-071 a 075 · Reescritas en el cierre común S4-S5 (pedido de Pimentel, 2026-11-18) sobre las pantallas nuevas del
// panel del técnico (Fases T3 y T4). Mantienen lo que probaban: portafolio con foto y publicación, retiro con confirmación,
// disponibilidad con validación y persistencia, tarifa inválida y actualizada, y zonas con persistencia.
// Cambios de objetivo, explicados:
// - S02-TC-073: la semana es una cuadrícula de franjas fijas (Mañana, Tarde y Noche), así que ya no hay franjas que se
//   solapen; la validación que queda es «al menos una franja».
// - S02-TC-075: la pausa se retiró del panel (D-104, sin pausa por ahora); la prueba cubre ahora las zonas, la otra
//   mitad del mismo formulario, con su validación y su persistencia.
const nav = () => cy.get('nav[aria-label="Gestión del técnico"]');
const go = (section) => nav().contains("button", section).click();

describe("Técnico S2 sobre el panel nuevo", () => {
  beforeEach(() => login("e2e-technician-active"));

  it("S02-TC-071 sube una foto y publica un trabajo nuevo en el portafolio", () => {
    const title = `Trabajo E2E ${Date.now() % 100000}`;
    go("Portafolio");
    cy.contains("button", "Añadir trabajo").click();
    cy.get(".tech-dialog").should("be.visible").within(() => {
      cy.contains("label", "Título del trabajo").find("input").type(title);
      cy.contains("label", "Fecha del trabajo").find("input").type("2026-10-01");
      cy.contains("label", "Subcategoría del trabajo").find("select option").eq(1).then((option) =>
        cy.contains("label", "Subcategoría del trabajo").find("select").select(option.val()));
      cy.contains("button", "Publicado").click().should("have.attr", "aria-pressed", "true");
    });
    observe("POST", "/media", "media");
    cy.get(".tech-dialog .tech-drop").selectFile("cypress/fixtures/evidencia.png", { action: "drag-drop" });
    cy.wait("@media").its("response.statusCode").should("eq", 201);
    cy.contains(".tech-dialog label", "Texto alternativo de la foto 1").find("input").type("Vitrina antes de la reparación");
    observe("POST", "/technicians/me/portfolio", "work");
    cy.contains(".tech-dialog button", "Guardar trabajo").click();
    cy.wait("@work").its("response.statusCode").should("eq", 201);
    cy.contains(`Añadimos «${title}» a tu portafolio.`).should("be.visible");
    cy.contains(".tech-works li", title).should("contain", "Publicado");
  });

  it("S02-TC-072 cancelar no retira el trabajo y confirmar lo quita con su alerta", () => {
    let calls = 0;
    cy.intercept("DELETE", "**/api/v1/technicians/me/portfolio/*", () => { calls += 1; }).as("retire");
    go("Portafolio");
    cy.get('.tech-works button[aria-label^="Quitar «"]').first().then(($button) => {
      const title = $button.attr("aria-label").replace(/^Quitar «/, "").replace(/»$/, "");
      cy.wrap($button).click();
      cy.get("dialog[open]").should("be.visible").contains("button", "Cancelar").click();
      cy.get("dialog[open]").should("not.exist").then(() => expect(calls).to.eq(0));
      cy.wrap($button).click();
      cy.get("dialog[open]").contains("button", "Confirmar").click();
      cy.wait("@retire").its("response.statusCode").should("eq", 204);
      cy.contains(`Quitamos «${title}» de tu portafolio.`).should("be.visible").then(() => expect(calls).to.eq(1));
    });
  });

  it("S02-TC-073 la disponibilidad pide al menos una franja y lo guardado se mantiene al recargar", () => {
    let calls = 0;
    cy.intercept("PUT", "**/api/v1/technicians/me/availability", () => { calls += 1; }).as("availability");
    go("Zonas y disponibilidad");
    const cells = () => cy.get('[aria-label="Disponibilidad por franja"] .tech-week-cell');
    cells().should("have.length", 21);
    // Sin ninguna franja activa, el cliente no deja guardar.
    cy.get('[aria-label="Disponibilidad por franja"] .tech-week-cell[aria-pressed="true"]').each(($cell) => cy.wrap($cell).click());
    cy.contains("button", "Guardar disponibilidad").click();
    cy.contains('[role="alert"]', "Marca al menos una franja").should("be.visible").then(() => expect(calls).to.eq(0));
    // Lunes y martes en la mañana: se guardan y vuelven al recargar.
    cells().eq(0).click().should("have.attr", "aria-pressed", "true");
    cells().eq(1).click().should("have.attr", "aria-pressed", "true");
    cy.contains("button", "Guardar disponibilidad").click();
    cy.wait("@availability").its("response.statusCode").should("eq", 200);
    cy.contains("Guardamos tu disponibilidad y tus zonas.").should("be.visible");
    cy.reload();
    go("Zonas y disponibilidad");
    cells().eq(0).should("have.attr", "aria-pressed", "true");
    cells().eq(1).should("have.attr", "aria-pressed", "true");
    cells().eq(2).should("have.attr", "aria-pressed", "false");
  });

  it("S02-TC-074 una tarifa inválida no se envía y la tarifa corregida se guarda con su formato", () => {
    let calls = 0;
    cy.intercept("PUT", "**/api/v1/technicians/me/services", () => { calls += 1; }).as("services");
    go("Servicios y tarifas");
    cy.get('.tech-svc-list button[aria-label^="Editar "]').first().click();
    cy.contains("label", "Tarifa referencial").find("input").clear().type("-1");
    cy.contains("button", "Guardar servicio").click();
    cy.get(".tech-service-form .error").should("be.visible").then(() => expect(calls).to.eq(0));
    cy.contains("label", "Tarifa referencial").find("input").clear().type("60,00");
    cy.contains("button", "Guardar servicio").click();
    cy.wait("@services").its("response.statusCode").should("eq", 200);
    cy.contains(/^Actualizamos «.+»\.$/).should("be.visible");
    cy.get(".tech-svc-list").should("contain", "S/ 60,00");
  });

  it("S02-TC-075 las zonas piden al menos un distrito y lo guardado se mantiene al recargar", () => {
    let calls = 0;
    cy.intercept("PUT", "**/api/v1/technicians/me/availability", () => { calls += 1; }).as("zones");
    go("Zonas y disponibilidad");
    cy.get('.tech-district[aria-pressed="true"]').each(($chip) => cy.wrap($chip).click());
    cy.contains("button", "Guardar disponibilidad").click();
    cy.contains('[role="alert"]', "Elige al menos un distrito").should("be.visible").then(() => expect(calls).to.eq(0));
    cy.get(".tech-district").first().then(($chip) => {
      const name = $chip.text().trim();
      cy.wrap($chip).click().should("have.attr", "aria-pressed", "true");
      cy.contains("button", "Guardar disponibilidad").click();
      cy.wait("@zones").then(({ request, response }) => {
        expect(response.statusCode).to.eq(200);
        expect(request.body.pause).to.eq(null);
      });
      cy.reload();
      go("Zonas y disponibilidad");
      cy.contains(".tech-district", name).should("have.attr", "aria-pressed", "true");
    });
  });
});
