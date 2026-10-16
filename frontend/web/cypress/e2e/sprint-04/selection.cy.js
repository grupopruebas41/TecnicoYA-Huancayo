import { login, openRequest, observe, read, apiWrite } from "./helpers";
describe("S4 selección", () => {
  it.skip("S04-TC-087 BLOQUEADO: falta preparación aislada de solicitud enviada y dos respuestas para este recorrido", () => {
    // Enviar solicitud programada; runJobs; aceptar desde ambas sesiones técnicas;
    // comprobar transición Buscando técnicos -> Elige a tu técnico y dos tarjetas referenciales.
  });
  it("S04-TC-088 elegir confirma asignación real", () => {
    login("e2e-client-match");
    openRequest("awaiting_choice");
    observe("POST", "/requests/*/selection", "selection");
    cy.contains("button", "Elegir a").first().click();
    cy.get("dialog")
      .should("be.visible")
      .contains("button", "Confirmar")
      .click();
    cy.wait("@selection")
      .its("response.body.data.request.status")
      .should("eq", "assigned");
    cy.contains("Asignaste a").should("be.visible");
    cy.get('[aria-label="Seguimiento de solicitud"]')
      .should("contain", "Asignada")
      .and("contain", "Franja confirmada:");
    cy.contains("button", "Elegir a").should("not.exist");
  });
  it.skip("S04-TC-089 BLOQUEADO: falta identificar solicitud aislada y candidato reservado de e2e-technician-busy", () => {
    // Elegir candidato realmente reservado: POST 409 SCHEDULE_CONFLICT; GET candidates;
    // error español, candidato retirado y ningún falso éxito. No inventar 409 con intercept.
  });
  it.skip("S04-TC-100 BLOQUEADO: falta fixture aislado que relacione técnico aceptado y cliente titular", () => {
    // Como técnico GET offers sin dirección; cliente elige la misma oferta; volver al técnico;
    // GET offers/{id} devuelve dirección y la pantalla la muestra. Evitar depender del caso 088.
  });
});
