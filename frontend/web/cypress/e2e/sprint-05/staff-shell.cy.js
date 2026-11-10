import { login } from "../../support/sprint01";

// S05-TC-288 a 290 · Panel del técnico, Fase T1 (modo rápido, escritas sin ejecutar): la base moderna del cliente para
// el técnico y el administrador, con la API real. Se ejecutan en el cierre común (workflow «e2e-cierre»).
const account = () => cy.get('button[aria-label^="Cuenta de "]');

describe("Base común del técnico y del administrador", () => {
  it("S05-TC-288 el técnico ve ☰ junto al logo, el indicador de conexión arriba y su panel de la cuenta con 5 pestañas", () => {
    login("technician");
    cy.get(".panel-brand-row").find('button[aria-label="Contraer menú"]').should("be.visible");
    cy.get(".panel-sidebar-foot").should("not.contain", "Cerrar sesión").and("contain", "Ir al sitio");
    cy.get("[data-cy=connection]").should("have.attr", "data-state");
    account().click();
    cy.get('[role=dialog] [role=tab]').then(($tabs) => {
      expect([...$tabs].map((tab) => tab.textContent)).to.deep.eq(["Mi cuenta", "Seguridad", "Accesibilidad", "Avisos", "Apariencia"]);
    });
  });

  it("S05-TC-289 «Cerrar las otras sesiones» pide confirmación y deja abierta esta sesión", () => {
    login("technician");
    account().click();
    cy.contains('[role=tab]', "Seguridad").click();
    cy.intercept("POST", "**/api/v1/me/sessions/revoke-others").as("revoke");
    cy.contains("button", "Cerrar las otras sesiones").click();
    cy.contains("button", "Sí, cerrarlas").click();
    cy.wait("@revoke").its("response.statusCode").should("eq", 200);
    cy.contains(/No había otras sesiones abiertas|Cerramos \d+ sesi/).should("be.visible");
    cy.request(Cypress.expose("apiUrl") + "/api/v1/me").its("status").should("eq", 200);
  });

  it("S05-TC-290 el administrador guarda la accesibilidad en su cuenta y no tiene Mi perfil en el menú", () => {
    login("admin");
    cy.get('nav[aria-label="Administración"]').should("not.contain", "Mi perfil");
    cy.intercept("PUT", "**/api/v1/me/preferences").as("prefs");
    account().click();
    cy.contains('[role=tab]', "Accesibilidad").click();
    cy.contains("label", "Alto contraste").click();
    cy.wait("@prefs").its("response.statusCode").should("eq", 200);
    cy.document().its("documentElement.dataset.contrast").should("eq", "high");
    cy.contains("label", "Alto contraste").click();
    cy.wait("@prefs");
  });
});
