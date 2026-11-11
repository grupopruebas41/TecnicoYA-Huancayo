import { login } from "../sprint-04/helpers";

// S05-TC-307 a 309 · Panel del técnico, Fase T2 (modo rápido, escritas sin ejecutar): menú del técnico e Inicio con la
// API real. La oferta en vivo la abre la tarea openRoundFor del S4 (E2ETasks open-round). Se ejecutan en el cierre común.
const nav = () => cy.get('nav[aria-label="Gestión del técnico"]');

describe("Panel del técnico: menú e Inicio", () => {
  beforeEach(() => cy.task("serverClock", "reset"));

  it("S05-TC-307 el menú agrupa las secciones y lo no listo va desactivado con «Próximamente»", () => {
    login("e2e-technician-frio");
    ["Trabajo", "Mi negocio", "Mi desempeño", "Ayuda"].forEach((group) => nav().contains(".panel-nav-heading", group));
    nav().contains(".panel-nav-item", "Mis trabajos").should("have.attr", "aria-disabled", "true").and("contain", "Próximamente");
    nav().contains("button", "Perfil profesional").click();
    cy.contains("h2", "Perfil profesional").should("be.visible");
  });

  it("S05-TC-308 una oferta nueva aparece en el Inicio con su anillo y se acepta desde la tarjeta", () => {
    login("e2e-technician-frio");
    cy.task("openRoundFor", "e2e-technician-frio@example.test");
    cy.get(".offer-spotlight", { timeout: 15000 }).should("be.visible").within(() => {
      cy.get("[role=timer]").invoke("text").should("match", /^\d{2}:\d{2}$/);
      cy.get(".offer-ring").should("have.attr", "data-tone", "ok");
      cy.contains("button", "Aceptar").click();
    });
    cy.contains("Aceptaste la oferta").should("be.visible");
  });

  it("S05-TC-309 los indicadores, Mi día y el progreso del perfil salen del servidor", () => {
    cy.intercept("GET", "**/api/v1/technicians/me/home").as("home");
    login("e2e-technician-frio");
    cy.wait("@home").its("response.statusCode").should("eq", 200);
    cy.contains("h3", "Tu actividad").should("be.visible");
    cy.get(".tech-slot").should("have.length", 3);
    cy.get('[role=progressbar]').invoke("attr", "aria-valuenow").then(Number).should("be.within", 0, 100);
  });
});
