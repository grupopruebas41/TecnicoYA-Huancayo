import { loginClient, observe } from "../sprint-03/helpers";

// S05-TC-178 y 179 · Fase 2: Mis solicitudes con la API real. e2e-client-limit tiene 3 activas, sembradas para S03-TC-068.
const openBoard = () => {
  cy.get('nav[aria-label="Gestión del cliente"]').contains("button", "Mis solicitudes").click();
  cy.get('[aria-label="Mis solicitudes"] [role=tabpanel]').should("have.attr", "aria-busy", "false");
};

describe("Mis solicitudes completo", () => {
  it("S05-TC-178 cuatro pestañas con contador, tarjetas con estado y búsqueda sin resultados", () => {
    loginClient("limit");
    openBoard();
    cy.get("[role=tab]").should("have.length", 4);
    cy.contains("[role=tab]", /^Activas \(\d+\)$/).should("have.attr", "aria-selected", "true");
    cy.get("article").should("have.length.greaterThan", 0).first().find(".client-status svg").should("exist");
    cy.get("input[type=search]").type("texto que no coincide con nada");
    cy.contains("Ninguna solicitud coincide").should("be.visible");
    cy.contains("button", "Limpiar búsqueda").click();
    cy.get("article").should("have.length.greaterThan", 0);
  });

  it("S05-TC-179 cancelar con motivo mueve la solicitud a Canceladas y no pide nada más", () => {
    observe("POST", "/requests/*/cancellation", "cancelacion");
    loginClient();
    cy.get('nav[aria-label="Gestión del cliente"]').contains("button", "Nueva solicitud").click();
    cy.get('[aria-label="Nueva solicitud"]').find("input[name=specialty_ids]").first().check({ force: true });
    cy.get('[aria-label="Nueva solicitud"]').contains("button", "Siguiente").click();
    cy.get('[aria-label="Nueva solicitud"]').find("input[name=subcategory_ids]").first().check({ force: true });
    cy.get('[aria-label="Nueva solicitud"]').contains("button", "Siguiente").click();
    cy.get('[aria-label="Nueva solicitud"]').find("textarea[name=description]").type("El equipo falla desde ayer y necesito una revisión.");
    cy.get('[aria-label="Nueva solicitud"]').contains("button", "Siguiente").click();
    cy.get('[aria-label="Nueva solicitud"]').find("select[name=district_id]").select(1);
    cy.get('[aria-label="Nueva solicitud"]').find("input[name=address]").type("Jr. Sintético 742");
    cy.get('[aria-label="Nueva solicitud"]').contains("button", "Siguiente").click();
    cy.get('[aria-label="Nueva solicitud"]').find("input[name=confirmed]").check();
    cy.get('[aria-label="Nueva solicitud"]').contains("button", "Enviar pedido").click();
    cy.get('[aria-label="Nueva solicitud"]').contains("button", "Ir a Mis solicitudes").click();

    cy.contains("button", /^Cancelar la solicitud #/).click();
    cy.get('dialog[aria-modal="true"]').within(() => {
      cy.contains("button", "Cancelar solicitud").click();
      cy.contains("Elige un motivo.").should("be.visible");
      cy.contains("label", "Otro motivo").click();
      cy.contains("button", "Cancelar solicitud").click();
      cy.contains("debe tener de 5 a 255 caracteres").should("be.visible");
      cy.get("textarea[name=reason]").type("Ya lo resolví por otro medio.");
      cy.contains("button", "Cancelar solicitud").click();
    });
    cy.wait("@cancelacion").its("response.statusCode").should("eq", 200);
    cy.contains(/^Cancelaste la solicitud #\d+\.$/).should("be.visible");
    cy.contains("[role=tab]", /^Canceladas \(1\)$/).click();
    cy.get("article").should("have.length", 1).and("contain", "Cancelada");
  });
});
