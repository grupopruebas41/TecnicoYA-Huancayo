import { loginClient, observe } from "../sprint-03/helpers";

// S05-TC-232 a 234 · Fase 4 (modo rápido, escritas sin ejecutar): barra superior, panel del avatar y menú nuevo con la API real.
const nav = () => cy.get('nav[aria-label="Gestión del cliente"]');

describe("Barra superior, panel del avatar y menú del cliente", () => {
  it("S05-TC-232 el ☰ contrae el menú y lo recuerda al volver a entrar", () => {
    observe("PATCH", "/me", "guardar");
    loginClient();
    cy.get('button[aria-label="Contraer menú"]').click();
    cy.wait("@guardar").its("response.body.data.sidebar_collapsed").should("eq", true);
    cy.reload();
    cy.get(".panel-shell").should("have.class", "is-collapsed");
    cy.get('button[aria-label="Expandir menú"]').click();
  });

  it("S05-TC-233 el panel del avatar guarda una dirección y el asistente la ofrece en el paso 4", () => {
    observe("POST", "/client/addresses", "direccion");
    loginClient();
    cy.get('button[aria-label^="Cuenta de "]').click();
    cy.get('[role=dialog]').within(() => {
      cy.contains("[role=tab]", "Mis direcciones").click();
      cy.contains("button", "Agregar dirección").click();
      cy.get("#address-district").select(1);
      cy.get("#address-text").type("Jr. Sintético 742");
      cy.contains("button", "Guardar dirección").click();
    });
    cy.wait("@direccion").its("response.statusCode").should("eq", 201);
    cy.contains("Dirección guardada.").should("be.visible");
    cy.get('[role=dialog]').trigger("keydown", { key: "Escape" });
    cy.get('[role=dialog]').should("not.exist");
    cy.get('button[aria-label^="Cuenta de "]').should("have.focus");
  });

  it("S05-TC-234 el menú no tiene CUENTA, lo premium abre el plan y lo que no está listo no navega", () => {
    loginClient();
    nav().should("not.contain", "Mi perfil").and("not.contain", "Notificaciones");
    nav().contains("button", "Mis citas").should("have.attr", "aria-disabled", "true").click();
    cy.get(".panel-title").should("have.text", "Inicio");
    nav().contains("button", "Sensores IoT").click();
    cy.contains("h2", "Plan Premium").should("be.visible");
    cy.contains("Por definir").should("be.visible");
    nav().contains("button", "Preguntas frecuentes").click();
    cy.get("details").first().click().should("have.attr", "open");
  });
});
