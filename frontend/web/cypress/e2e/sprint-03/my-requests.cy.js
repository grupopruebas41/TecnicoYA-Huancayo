import { loginClient, toSummary, wizard, send } from "./helpers";
describe("S3 mis solicitudes", () => {
  it("S03-TC-067 registrada continúa y enviada no se edita", () => {
    loginClient("mixed");
    cy.get('[aria-label="Mis solicitudes"] article')
      .contains("p", "Registrada")
      .parent()
      .find("button")
      .click();
    cy.contains("button", "Continuar solicitud #").should("be.visible");
    cy.get('[aria-label="Mis solicitudes"] article')
      .contains("p", "Enviada")
      .parent()
      .find("button")
      .click();
    cy.contains("button", "Continuar solicitud #").should("not.exist");
    cy.contains("button", "Enviar solicitud").should("not.exist");
    cy.contains("button", "Retirar foto").should("not.exist");
  });
  it("S03-TC-068 cuarta activa queda registrada", () => {
    loginClient("limit");
    toSummary();
    send();
    wizard().find("[role=alert]").should("contain", "máximo de 3");
    wizard().contains("Solicitud enviada correctamente.").should("not.exist");
    cy.get('nav[aria-label="Gestión del cliente"]')
      .contains("button", "Mis solicitudes")
      .click();
    cy.get("@record").then((record) =>
      cy
        .contains("h3", "Solicitud #" + record.id)
        .parent()
        .should("contain", "Registrada"),
    );
  });
});
