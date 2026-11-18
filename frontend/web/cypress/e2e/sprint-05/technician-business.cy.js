import { login } from "../sprint-04/helpers";

// S05-TC-350 a 352 · Panel del técnico, Fase T4 (modo rápido, escritas sin ejecutar): Verificación coherente con el menú,
// Perfil profesional con vista previa en vivo y Estadísticas por semana y por mes, con la API real. Se ejecutan en el
// cierre común (workflow «e2e-cierre»). e2e-technician-frio trae sus 2 documentos obligatorios (Sprint05E2ESeeder).
const nav = () => cy.get('nav[aria-label="Gestión del técnico"]');

describe("Panel del técnico: Mi negocio y Estadísticas", () => {
  beforeEach(() => cy.task("serverClock", "reset"));

  it("S05-TC-350 la Verificación coincide con el menú «Aprobado» y muestra los 2 documentos obligatorios aprobados", () => {
    cy.intercept("GET", "**/api/v1/technicians/me/verification").as("verification");
    login("e2e-technician-frio");
    nav().contains("button", "Verificación").should("contain", "Aprobado").click();
    cy.wait("@verification").its("response.statusCode").should("eq", 200);
    cy.get(".tech-verify-banner").should("have.attr", "data-tone", "ok").and("contain", "Aprobado");
    cy.get('[aria-label="Documentos obligatorios"] > li').should("have.length", 2).each(($card) => {
      cy.wrap($card).find(".tech-status").should("contain", "Aprobado");
    });
    cy.contains("No has adjuntado documentos").should("not.exist");
    cy.contains("label", "Tipo de documento").find("select option").should("have.length", 4);
  });

  it("S05-TC-351 Perfil profesional actualiza la vista previa mientras se escribe y guarda con su alerta", () => {
    cy.intercept("PATCH", "**/api/v1/technicians/me/profile").as("save");
    login("e2e-technician-frio");
    nav().contains("button", "Perfil profesional").click();
    const text = `Garantía sintética de ${Date.now() % 90} días en mano de obra.`;
    cy.contains("label", "Qué garantía ofreces").find("textarea").clear().type(text);
    cy.get(".tech-profile-preview").should("contain", text);
    cy.contains("button", "Guardar perfil").click();
    cy.wait("@save").its("response.statusCode").should("eq", 200);
    cy.contains("Guardamos tu perfil profesional.").should("be.visible");
  });

  it("S05-TC-352 Estadísticas muestra los indicadores, el resumen en texto y cambia de semana a mes", () => {
    cy.intercept("GET", "**/api/v1/technicians/me/stats*").as("stats");
    login("e2e-technician-frio");
    nav().contains("button", "Estadísticas").click();
    cy.wait("@stats").its("request.url").should("include", "period=week");
    cy.get('[aria-label="Resumen del período"] > li').should("have.length", 4);
    cy.get(".tech-stats-summary").should("contain", "las últimas 8 semanas");
    cy.get('.tech-chart svg[role="group"]').should("have.length", 4);
    cy.contains('[role=tab]', "Por mes").click();
    cy.wait("@stats").its("request.url").should("include", "period=month");
    cy.get(".tech-stats-summary").should("contain", "los últimos 6 meses");
  });
});
