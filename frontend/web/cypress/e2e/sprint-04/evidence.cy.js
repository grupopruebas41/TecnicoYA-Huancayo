beforeEach(() => cy.task("serverClock", "reset"));
afterEach(() => cy.task("serverClock", "reset"));
import { loginClient, toDescription, wizard } from "../sprint-03/helpers";
import { api, observe } from "./helpers";
it("S04-TC-098 foto no adjunta solo se retira al confirmar", () => {
  loginClient();
  toDescription();
  observe("POST", "/media", "uploaded");
  wizard()
    .find("input[type=file]")
    .selectFile("cypress/fixtures/evidencia.png");
  cy.wait("@uploaded").its("response.statusCode").should("eq", 201);
  let deletes = 0;
  cy.intercept("DELETE", api() + "/api/v1/media/*", (req) => {
    deletes++;
    req.continue();
  }).as("delete");
  wizard().contains("button", "Retirar foto 1").click();
  cy.contains("button", "Cancelar").click();
  cy.then(() => expect(deletes).to.eq(0));
  wizard().contains("button", "Retirar foto 1").click();
  cy.contains("button", "Confirmar").click();
  cy.wait("@delete").its("response.statusCode").should("eq", 204);
  cy.contains("Quitaste la foto.").should("be.visible");
  wizard().find("img").should("not.exist");
});
it("S04-TC-099 respuesta perdida no duplica creación", () => {
  loginClient();
  toDescription();
  wizard()
    .find("textarea[name=description]")
    .type("Falla sintética del equipo de pruebas");
  wizard().contains("button", "Siguiente").click();
  wizard().find("select[name=district_id]").select(1);
  wizard().find("input[name=address]").type("Dirección sintética");
  const keys = [],
    ids = [];
  cy.intercept("POST", api() + "/api/v1/requests", (req) => {
    keys.push(req.headers["idempotency-key"]);
    req.continue((res) => {
      ids.push(res.body.data.id);
      if (keys.length === 1)
        res.send({
          statusCode: 200,
          body: "truncada",
          headers: { "content-type": "text/plain" },
        });
    });
  }).as("create");
  wizard().contains("button", "Siguiente").click();
  cy.wait("@create");
  cy.wait("@create");
  cy.contains("Solicitud registrada.").should("be.visible");
  cy.then(() => {
    expect(keys).to.have.length(2);
    expect(keys[0]).to.eq(keys[1]);
    expect(ids[0]).to.eq(ids[1]);
  });
});
