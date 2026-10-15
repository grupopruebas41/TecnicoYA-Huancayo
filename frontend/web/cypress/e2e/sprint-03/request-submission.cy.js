import {
  loginClient,
  toSummary,
  wizard,
  send,
  observe,
  api,
  switchAccount,
  apiWrite,
} from "./helpers";
describe("S3 envío", () => {
  let restoreId;
  beforeEach(() => {
    restoreId = null;
    loginClient();
  });
  afterEach(() => {
    if (!restoreId) return;
    switchAccount("e2e-admin@example.test");
    cy.request({url: api() + "/api/v1/admin/specialties", headers: {Origin: new URL(Cypress.config("baseUrl")).origin, Accept: "application/json"}}).then(({ body }) => {
      const item = body.data
        .flatMap((s) => s.subcategories)
        .find((s) => s.id === restoreId);
      if (item && !item.active)
        apiWrite("PATCH", "/admin/subcategories/" + item.id, {
          active: true,
          expected_version: item.version,
        });
    });
  });
  it("S03-TC-059 doble clic no duplica envío", () => {
    toSummary();
    let calls = 0;
    cy.intercept("POST", api() + "/api/v1/requests/*/submission", (req) => {
      calls++;
      req.continue((res) => res.setDelay(150));
    }).as("submission");
    wizard().contains("label", "Confirmo").find("input").check();
    wizard().contains("button", "Enviar solicitud").dblclick({ force: true });
    wizard().contains("button", "Enviando…").should("be.disabled");
    cy.wait("@submission").its("response.statusCode").should("eq", 202);
    wizard().contains("Solicitud enviada correctamente.").should("be.visible");
    cy.then(() => expect(calls).to.eq(1));
  });
  it("S03-TC-060 respuesta perdida después de procesar se recupera", () => {
    toSummary();
    let calls = 0;
    cy.intercept("POST", api() + "/api/v1/requests/*/submission", (req) => {
      calls++;
      expect(req.headers["idempotency-key"]).to.be.a("string");
      req.continue((res) => {
        expect(res.statusCode).to.eq(202);
        res.send({
          statusCode: 200,
          body: "respuesta truncada",
          headers: { "content-type": "text/plain" },
        });
      });
    }).as("lost");
    cy.get("@record").then((record) =>
      cy
        .intercept("GET", api() + "/api/v1/requests/" + record.id, (req) =>
          req.continue((res) => res.setDelay(150)),
        )
        .as("recovery"),
    );
    send();
    cy.wait("@lost");
    wizard().contains("No pudimos confirmar el resultado").should("be.visible");
    cy.wait("@recovery").its("response.body.data.status").should("eq", "sent");
    wizard()
      .contains("Solicitud enviada. Estado confirmado con el servidor.")
      .should("be.visible");
    cy.then(() => expect(calls).to.eq(1));
  });
  it("S03-TC-061 subcategoría desactivada rechaza envío real", () => {
    toSummary();
    cy.get("@record").then((record) => {
      switchAccount("e2e-admin@example.test");
      cy.request({url: api() + "/api/v1/admin/specialties", headers: {Origin: new URL(Cypress.config("baseUrl")).origin, Accept: "application/json"}}).then(({ body }) => {
        const item = body.data
          .flatMap((s) => s.subcategories)
          .find((s) => s.id === record.subcategory.id);
        expect(item).to.exist;
        restoreId = item.id;
        apiWrite("PATCH", "/admin/subcategories/" + item.id, {
          active: false,
          expected_version: item.version,
        });
      });
      cy.get("@clientEmail").then((email) => switchAccount(email));
      cy.reload();
      cy.contains("button", "Ver solicitud #" + record.id).click();
      cy.contains("button", "Continuar solicitud #" + record.id).click();
      send();
      wizard()
        .contains("La subcategoría elegida no está disponible.")
        .should("be.visible");
      wizard().contains("Solicitud enviada correctamente.").should("not.exist");
      switchAccount("e2e-admin@example.test");
      cy.request({url: api() + "/api/v1/admin/specialties", headers: {Origin: new URL(Cypress.config("baseUrl")).origin, Accept: "application/json"}}).then(({ body }) => {
        const item = body.data
          .flatMap((s) => s.subcategories)
          .find((s) => s.id === record.subcategory.id);
        apiWrite("PATCH", "/admin/subcategories/" + item.id, {
          active: true,
          expected_version: item.version,
        });
      });
    });
  });
  it("S03-TC-062 error 500 simulado no muestra éxito", () => {
    toSummary();
    cy.intercept("POST", api() + "/api/v1/requests/*/submission", {
      statusCode: 500,
      body: {
        error: { message: "Servicio no disponible." },
        meta: { request_id: "prueba-s03-500" },
      },
    }).as("failed");
    send();
    cy.wait("@failed");
    cy.get("@record").then((record) =>
      wizard()
        .find("[role=alert]")
        .should("contain", "Solicitud #" + record.id)
        .and("contain", "prueba-s03-500"),
    );
    wizard().contains("button", "Enviar solicitud").should("be.enabled");
    wizard().contains("Solicitud enviada correctamente.").should("not.exist");
  });
});
