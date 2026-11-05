import { loginClient, openMyRequests, toSummary, wizard, send } from "./helpers";
describe("S3 mis solicitudes", () => {
  it("S03-TC-067 registrada continúa y enviada no se edita", () => {
    loginClient("mixed");
    openMyRequests();
    cy.get('[aria-label="Mis solicitudes"] article')
      .contains("p", "Registrada")
      .closest("article")
      .contains("button", "Ver detalle")
      .click();
    cy.contains("button", "Continuar solicitud #").should("be.visible");
    cy.get('[aria-label="Mis solicitudes"] article')
      .contains("article", /Enviada|Esperando|Buscando|Pendiente/)
      .contains("button", "Ver detalle")
      .click();
    cy.contains("button", "Continuar solicitud #").should("not.exist");
    cy.contains("button", "Enviar solicitud").should("not.exist");
    cy.contains("button", "Retirar foto").should("not.exist");
  });
  it("S03-TC-068 cuarta activa queda registrada", () => {
    loginClient("limit");
    toSummary();
    send();
    wizard().find("[role=alert]").should("contain", "3 pedidos activos"); // D-95: la solicitud suelta cuenta como un pedido
    wizard().contains("Solicitud enviada correctamente.").should("not.exist");
    cy.get('nav[aria-label="Gestión del cliente"]')
      .contains("button", "Mis solicitudes")
      .click();
    cy.get("@record").then((record) =>
      cy
        .contains("article", "Solicitud #" + record.id)
        .should("contain", "Registrada"),
    );
  });
});
