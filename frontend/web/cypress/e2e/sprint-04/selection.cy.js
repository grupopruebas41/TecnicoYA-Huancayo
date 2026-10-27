beforeEach(() => cy.task("serverClock", "reset"));
afterEach(() => cy.task("serverClock", "reset"));
import { login, openRequest, observe, read, apiWrite, openMyRequests } from "./helpers";
import { switchAccount, loginClient, wizard, send } from "../sprint-03/helpers";
describe("S4 selección", () => {
  it("S04-TC-087 cliente sigue la búsqueda hasta dos aceptaciones", () => {
    loginClient();
    cy.get('nav[aria-label="Gestión del cliente"]').contains("button", "Nueva solicitud").click();
    wizard().find("select[name=specialty_id] option").contains("Refrigeración").then(option => wizard().find("select[name=specialty_id]").select(option.val()));
    wizard().contains("button", "Siguiente").click();
    wizard().find("select[name=subcategory_id] option").contains("Cámaras").then(option => wizard().find("select[name=subcategory_id]").select(option.val()));
    wizard().contains("button", "Siguiente").click();
    wizard().find("textarea[name=description]").type("La cámara de frío no mantiene la temperatura adecuada.");
    wizard().contains("button", "Siguiente").click();
    wizard().find("select[name=district_id] option").contains("Huancayo").then(option => wizard().find("select[name=district_id]").select(option.val()));
    wizard().find("input[name=address]").type("Calle sintética de búsqueda 404");
    observe("POST", "/requests", "newRequest");
    wizard().contains("button", "Siguiente").click();
    cy.wait("@newRequest").its("response.body.data.id").as("searchId");
    observe("POST", "/requests/*/submission", "submitted");
    send();
    cy.wait("@submitted").its("response.statusCode").should("eq", 202);
    cy.task("runJobs");
    cy.visit("/#cuenta");
    openMyRequests();
    cy.get("@searchId").then(id => cy.contains("button", "Ver solicitud #" + id).click());
    cy.get('[aria-label="Seguimiento de solicitud"]').should("contain", "Buscando técnicos");
    for (const technician of ["frio", "busy"]) {
      switchAccount("e2e-technician-" + technician + "@example.test");
      cy.get("@searchId").then(id => read("/offers?status=pending").then(({body}) => {
        const offer = body.data.items.find(item => item.request.id === id);
        expect(offer, "oferta real del técnico para esta solicitud").to.exist;
        apiWrite("POST", "/offers/" + offer.id + "/response", {decision:"accept", expected_version:offer.version});
      }));
    }
    cy.get("@clientEmail").then(email => switchAccount(email));
    cy.visit("/#cuenta");
    openMyRequests();
    cy.get("@searchId").then(id => cy.contains("button", "Ver solicitud #" + id).click());
    cy.get('[aria-label="Seguimiento de solicitud"]').should("contain", "Elige a tu técnico");
    cy.get('[aria-label="Seguimiento de solicitud"] article').should("have.length", 2).each(card => {
      cy.wrap(card).should("contain", "referencial").and("contain", "aproximada por zona").and("contain", "Nuevo");
    });
  });
  it("S04-TC-088 elegir confirma asignación real", () => {
    cy.task("openRoundFor", "e2e-technician-frio@example.test").as("round");
    login("e2e-technician-frio");
    cy.get("@round").then(({offer_id}) => read("/offers/" + offer_id).then(({body}) =>
      apiWrite("POST", "/offers/" + offer_id + "/response", {decision: "accept", expected_version: body.data.version}),
    ));
    switchAccount("e2e-client-direct@example.test");
    cy.visit("/#cuenta");
    openMyRequests();
    cy.get("@round").then(({request_id}) => cy.contains("button", "Ver solicitud #" + request_id).click());
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
  it("S04-TC-089 una elección rechazada recarga candidatos sin falso éxito", () => {
    login("e2e-client-match");
    openRequest("awaiting_choice");
    observe("POST", "/requests/*/selection", "conflict");
    cy.contains("button", "Elegir a Técnico E2E con agenda ocupada").click();
    observe("GET", "/requests/*/candidates", "freshCandidates");
    cy.get("dialog").contains("button", "Confirmar").click();
    cy.wait("@conflict").then(({response}) => {
      expect(response.statusCode).to.eq(409);
      expect(response.body.error.code).to.eq("SCHEDULE_CONFLICT");
    });
    cy.wait("@freshCandidates").its("response.statusCode").should("eq", 200);
    cy.contains("[role=alert]", "El técnico ya no tiene disponible esa franja. Elige otra opción.").should("be.visible");
    cy.contains("button", "Elegir a Técnico E2E con agenda ocupada").should("not.exist");
    cy.get('[aria-label="Seguimiento de solicitud"]').should("contain", "Elige a tu técnico");
    cy.contains("Asignaste a").should("not.exist");
  });
  it("S04-TC-100 dirección visible solo después de la elección real", () => {
    cy.task("openRoundFor", "e2e-technician-electro@example.test").as("privateRound");
    login("e2e-technician-electro");
    cy.get("@privateRound").then(({offer_id}) => {
      read("/offers/" + offer_id).then(({body}) => {
        expect(body.data.request.address).to.be.null;
        apiWrite("POST", "/offers/" + offer_id + "/response", {decision:"accept", expected_version:body.data.version});
      });
      cy.contains("button", "Actualizar ofertas").click();
      cy.get('[aria-label="Oferta ' + offer_id + '"]').should("contain", "Aceptada").and("not.contain", "Calle sintética E2E de tiempo real");
    });
    switchAccount("e2e-client-direct@example.test");
    cy.get("@privateRound").then(({request_id, offer_id}) =>
      read("/requests/" + request_id + "/candidates").then(({body}) =>
        apiWrite("POST", "/requests/" + request_id + "/selection", {offer_id, expected_version:body.data.request_version}),
      ),
    );
    switchAccount("e2e-technician-electro@example.test");
    cy.visit("/#cuenta");
    cy.get("@privateRound").then(({offer_id}) => {
      read("/offers/" + offer_id).its("body.data.request.address").should("eq", "Calle sintética E2E de tiempo real");
      cy.get('[aria-label="Oferta ' + offer_id + '"]').should("contain", "Calle sintética E2E de tiempo real");
    });
  });
});
