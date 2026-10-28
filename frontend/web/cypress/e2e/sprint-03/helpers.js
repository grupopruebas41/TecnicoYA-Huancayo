import { fillRegistration } from "../../support/registration";
export const api = () => Cypress.expose("apiUrl");
export const wizard = () => cy.get('[aria-label="Nueva solicitud"]');
export const observe = (method, path, alias) =>
  cy.intercept(method, api() + "/api/v1" + path).as(alias);
export function loginClient(kind = "fresh") {
  const email =
    kind === "fresh"
      ? "s03-" + crypto.randomUUID() + "@example.test"
      : "e2e-client-" + kind + "@example.test";
  cy.wrap(email, { log: false }).as("clientEmail");
  cy.visit("/#cuenta");
  cy.env(["E2E_PASSWORD"], { log: false }).then(({ E2E_PASSWORD }) => {
    expect(E2E_PASSWORD).to.be.a("string");
    if (kind === "fresh") {
      fillRegistration({ type: "client", email, password: E2E_PASSWORD, givenNames: "Cliente" });
      cy.get("[data-cy=register-success]").should("be.visible");
    } else cy.get("[data-cy=login-email]").type(email);
    cy.get("[data-cy=login-password]").type(E2E_PASSWORD, { log: false });
    cy.get("[data-cy=login-submit]").click();
    cy.get("[data-cy=portal-client]").should("be.visible");
  });
}
// D-87: el cliente entra a su Inicio; las solicitudes están en la sección «Mis solicitudes» del menú.
export function openMyRequests() {
  cy.get('nav[aria-label="Gestión del cliente"]')
    .contains("button", "Mis solicitudes")
    .click();
}
export function toDescription() {
  cy.get('nav[aria-label="Gestión del cliente"]')
    .contains("button", "Nueva solicitud")
    .click();
  // Revisión del PR #39: especialidad y subcategoría son tarjetas con un radio visible (antes, select).
  wizard()
    .find("input[name=specialty_id]")
    .should("have.length.greaterThan", 0);
  wizard().find("input[name=specialty_id]").first().check();
  wizard().contains("button", "Siguiente").click();
  wizard()
    .find("input[name=subcategory_id]")
    .should("have.length.greaterThan", 0);
  wizard().find("input[name=subcategory_id]").first().check();
  wizard().contains("button", "Siguiente").click();
}
export function toSummary() {
  toDescription();
  wizard()
    .find("textarea[name=description]")
    .type("La computadora no enciende desde ayer por la tarde.");
  wizard().contains("button", "Siguiente").click();
  wizard().find("select[name=district_id]").select(1);
  wizard().find("input[name=address]").type("Calle sintética 456");
  observe("POST", "/requests", "created");
  wizard().contains("button", "Siguiente").click();
  cy.wait("@created").then(({ response }) => {
    expect(response.statusCode).to.eq(201);
    cy.wrap(response.body.data).as("record");
  });
  wizard().contains("h2", "Paso 5").should("be.visible");
}
export function send() {
  wizard()
    .contains("label", "Confirmo que el resumen es correcto")
    .find("input")
    .check();
  wizard().contains("button", "Enviar solicitud").click();
}
export function image() {
  observe("POST", "/media", "media");
  observe("POST", "/requests/*/attachments", "attached");
  wizard()
    .find("input[type=file]")
    .selectFile("cypress/fixtures/evidencia.png");
  cy.wait("@media").its("response.statusCode").should("eq", 201);
  cy.wait("@attached").its("response.statusCode").should("eq", 201);
  wizard().contains("Foto adjuntada.").should("be.visible");
}
export function apiWrite(method, path, body) {
  cy.request({ url: api() + "/sanctum/csrf-cookie", log: false });
  return cy.getCookie("XSRF-TOKEN", { log: false }).then((cookie) =>
    cy.request({
      method,
      url: api() + "/api/v1" + path,
      body,
      headers: {
        "X-XSRF-TOKEN": decodeURIComponent(cookie.value),
        Origin: new URL(Cypress.config("baseUrl")).origin,
        Accept: "application/json",
      },
      log: false,
    }),
  );
}
export function switchAccount(email) {
  apiWrite("POST", "/auth/logout");
  cy.env(["E2E_PASSWORD"], { log: false }).then(({ E2E_PASSWORD }) =>
    apiWrite("POST", "/auth/login", { email, password: E2E_PASSWORD }),
  );
}
