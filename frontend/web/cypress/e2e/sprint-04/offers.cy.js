beforeEach(() => cy.task("serverClock", "reset"));
afterEach(() => cy.task("serverClock", "reset"));
import { login, api, observe } from "./helpers";
describe("S4 ofertas reales", () => {
  beforeEach(() => {
    cy.task("openRoundFor", "e2e-technician-frio@example.test").as("freshRound");
    login("e2e-technician-frio");
  });
  it("S04-TC-083 aceptar no asigna", () => {
    observe("POST", "/offers/*/response", "response");
    cy.get("@freshRound").then(({offer_id}) => cy.get('[aria-label="Oferta ' + offer_id + '"]')).contains("button", "Aceptar").click();
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
    cy.get("@freshRound").then(({offer_id}) => cy.get('[aria-label="Oferta ' + offer_id + '"]')).contains("button", "Rechazar").click();
    cy.contains("button", "Cancelar").click();
    cy.then(() => expect(posts).to.eq(0));
    cy.get("@freshRound").then(({offer_id}) => cy.get('[aria-label="Oferta ' + offer_id + '"]')).contains("button", "Rechazar").click();
    cy.contains("button", "Confirmar").click();
    cy.wait("@reject").its("response.statusCode").should("eq", 200);
    cy.contains("Rechazaste la oferta.").should("be.visible");
    cy.contains("p", "Rechazada").should("be.visible");
  });
  it("S04-TC-085 vencimiento del servidor prevalece", () => {
    cy.clock(Date.now() - 300000, ["Date", "setInterval", "clearInterval"]);
    cy.task("serverClock", "+10m");
    observe("POST", "/offers/*/response", "expired");
    cy.get("@freshRound").then(({offer_id}) => cy.get('[aria-label="Oferta ' + offer_id + '"]')).contains("button", "Aceptar").click();
    cy.wait("@expired").its("response.statusCode").should("eq", 409);
    cy.contains(
      "[role=alert]",
      "La oferta venció. Ya no puedes responderla.",
    ).should("be.visible");
    cy.contains("p", "Vencida").should("be.visible");
  });
  it("S04-TC-086 reloj anclado al servidor llega a 00:01 y 00:00", () => {
    let elapsed = 0;
    cy.clock(Date.now(), ["Date", "setInterval", "clearInterval"]);
    observe("GET", "/offers?status=pending,accepted", "clockOffers");
    cy.visit("/#cuenta", {onBeforeLoad(win) {
      cy.stub(win.performance, "now").callsFake(() => elapsed);
    }});
    cy.wait("@clockOffers").then(({response}) => cy.get("@freshRound").then(({offer_id}) => {
      const offer = response.body.data.items.find(item => item.id === offer_id);
      expect(offer, "oferta recién creada por el backend").to.exist;
      const duration = Date.parse(offer.expires_at) - Date.parse(response.body.meta.server_time);
      expect(duration).to.be.greaterThan(60000);
      cy.get('[aria-label="Oferta ' + offer_id + '"] [role=timer]').should("be.visible");
      // Avanzar únicamente el reloj del navegador hasta los últimos 60 s del SLA real.
      // La respuesta HTTP y expires_at permanecen intactos.
      cy.then(() => { elapsed = duration - 60000; });
      cy.tick(1000);
      cy.get('[aria-label="Oferta ' + offer_id + '"] [role=timer]').should("have.text", "01:00");
      cy.then(() => { elapsed += 59000; });
      cy.tick(59000);
      cy.get('[aria-label="Oferta ' + offer_id + '"] [role=timer]').should("have.text", "00:01");
      cy.then(() => { elapsed += 1000; });
      cy.tick(1000);
      cy.get('[aria-label="Oferta ' + offer_id + '"]').within(() => {
        cy.get("[role=timer]").should("have.text", "00:00");
        cy.contains("button", "Aceptar").should("be.disabled");
        cy.contains("Plazo vencido").should("be.visible");
      });
    }));
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
    cy.get("@freshRound").then(({offer_id}) => cy.get('[aria-label="Oferta ' + offer_id + '"]')).contains("button", "Aceptar").click();
    cy.wait("@lost");
    cy.wait("@recovery").its("response.statusCode").should("eq", 200);
    cy.contains("Aceptaste la oferta.").should("not.exist");
    cy.contains(
      "Respuesta consultada. Revisa el estado actualizado de la oferta.",
    ).should("be.visible");
  });
});
