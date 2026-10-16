import { login, pendingOffer, api, observe } from "./helpers";
describe("S4 ofertas reales", () => {
  beforeEach(() => {
    cy.task("openRoundFor", "e2e-technician-frio");
    login("e2e-technician-frio");
  });
  it("S04-TC-083 aceptar no asigna", () => {
    observe("POST", "/offers/*/response", "response");
    pendingOffer().contains("button", "Aceptar").click();
    cy.wait("@response").its("response.statusCode").should("eq", 200);
    cy.contains(
      "Aceptaste la oferta. El cliente elegirá cuando cierre la ronda.",
    ).should("be.visible");
    cy.contains("p", "Aceptada").should("be.visible");
    cy.get('[aria-label="Solicitudes entrantes"]').should(
      "not.contain",
      "Asignada",
    );
  });
  it("S04-TC-084 rechazo requiere confirmación", () => {
    let posts = 0;
    cy.intercept("POST", api() + "/api/v1/offers/*/response", (req) => {
      posts++;
      req.continue();
    }).as("reject");
    pendingOffer().contains("button", "Rechazar").click();
    cy.contains("button", "Cancelar").click();
    cy.then(() => expect(posts).to.eq(0));
    pendingOffer().contains("button", "Rechazar").click();
    cy.contains("button", "Confirmar").click();
    cy.wait("@reject").its("response.statusCode").should("eq", 200);
    cy.contains("Rechazaste la oferta.").should("be.visible");
    cy.contains("p", "Rechazada").should("be.visible");
  });
  it("S04-TC-085 vencimiento del servidor prevalece", () => {
    cy.clock(Date.now() - 300000, ["Date", "setInterval", "clearInterval"]);
    cy.task("serverClock", "+10m");
    observe("POST", "/offers/*/response", "expired");
    pendingOffer().contains("button", "Aceptar").click();
    cy.wait("@expired").its("response.statusCode").should("eq", 409);
    cy.contains(
      "[role=alert]",
      "La oferta venció. Ya no puedes responderla.",
    ).should("be.visible");
    cy.contains("p", "Vencida").should("be.visible");
  });
  it.skip("S04-TC-086 BLOQUEADO: falta fixture o tarea que fije expires_at = server_time + 60 s", () => {
    // Al recibir el fixture real: cy.clock con performance.now controlado; 59 s => 00:01;
    // 1 s más => 00:00, Aceptar disabled y Plazo vencido. No fabricar la respuesta de API.
  });
  it("S04-TC-097 error de red recupera oferta sin falso éxito", () => {
    let first = true;
    cy.intercept("POST", api() + "/api/v1/offers/*/response", (req) => {
      if (first) {
        first = false;
        req.destroy();
      } else req.continue();
    }).as("lost");
    observe("GET", "/offers/*", "recovery");
    pendingOffer().contains("button", "Aceptar").click();
    cy.wait("@lost");
    cy.wait("@recovery").its("response.statusCode").should("eq", 200);
    cy.contains("Aceptaste la oferta.").should("not.exist");
    cy.contains(
      "Respuesta consultada. Revisa el estado actualizado de la oferta.",
    ).should("be.visible");
  });
});
