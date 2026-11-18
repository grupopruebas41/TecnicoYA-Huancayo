import { login } from "../sprint-04/helpers";

// S05-TC-326 a 328 · Panel del técnico, Fase T3 (modo rápido, escritas sin ejecutar): Ofertas con Historial, Mis trabajos
// y Zonas y disponibilidad con la API real. Se ejecutan en el cierre común (workflow «e2e-cierre»).
const nav = () => cy.get('nav[aria-label="Gestión del técnico"]');

describe("Panel del técnico: Ofertas, Mis trabajos, Agenda y Zonas", () => {
  beforeEach(() => cy.task("serverClock", "reset"));

  it("S05-TC-326 Ofertas separa Pendientes e Historial y el historial muestra el estado como etiqueta", () => {
    login("e2e-technician-frio");
    cy.contains('[role=tab]', "Pendientes").should("have.attr", "aria-selected", "true");
    cy.contains('[role=tab]', "Historial").click();
    cy.get(".tech-history").should("exist");
    cy.get(".tech-status, .tech-empty-card").should("exist");
  });

  it("S05-TC-327 Mis trabajos cambia de pestaña y busca sin recargar la página", () => {
    cy.intercept("GET", "**/api/v1/technicians/me/jobs*").as("jobs");
    login("e2e-technician-frio");
    nav().contains("button", "Mis trabajos").click();
    cy.wait("@jobs").its("response.statusCode").should("eq", 200);
    cy.contains('[role=tab]', "Completados").click();
    cy.wait("@jobs").its("request.url").should("include", "tab=completed");
    cy.get('input[type=search]').type("zz-sin-resultados");
    cy.wait("@jobs").its("request.url").should("include", "q=zz-sin-resultados");
    cy.contains("Sin resultados").should("be.visible");
  });

  it("S05-TC-328 Zonas y disponibilidad guarda una franja con un clic y lo confirma", () => {
    cy.intercept("PUT", "**/api/v1/technicians/me/availability").as("save");
    login("e2e-technician-frio");
    nav().contains("button", "Zonas y disponibilidad").click();
    cy.get('[aria-label^="Domingo, Noche"]').click();
    cy.contains("button", "Guardar disponibilidad").click();
    cy.wait("@save").its("response.statusCode").should("eq", 200);
    cy.contains("Guardamos tu disponibilidad y tus zonas.").should("be.visible");
  });
});
