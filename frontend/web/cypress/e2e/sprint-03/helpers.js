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
// D-92: «Nueva solicitud» abre el pedido con varios rubros (casillas specialty_ids y subcategory_ids, visualmente
// ocultas dentro de su tarjeta: se marcan con force). Llega al paso 3 con un solo rubro.
export function toDescription() {
  cy.get('nav[aria-label="Gestión del cliente"]')
    .contains("button", "Nueva solicitud")
    .click();
  wizard()
    .find("input[name=specialty_ids]")
    .should("have.length.greaterThan", 0);
  wizard().find("input[name=specialty_ids]").first().check({ force: true });
  wizard().contains("button", "Siguiente").click();
  wizard()
    .find("input[name=subcategory_ids]")
    .should("have.length.greaterThan", 0);
  wizard().find("input[name=subcategory_ids]").first().check({ force: true });
  wizard().contains("button", "Siguiente").click();
  wizard().contains("h2", "Paso 3").should("be.visible");
}
// D-92: el pedido ya no crea borradores. El borrador del S3 (registrar, corregir, adjuntar y enviar una solicitud)
// sigue en el asistente anterior: se registra por la API con los mismos datos y se abre con «Continuar solicitud».
export function toSummary() {
  cy.request(api() + "/api/v1/catalog/specialties").then(({ body }) =>
    cy.request(api() + "/api/v1/catalog/subcategories?specialty_id=" + body.data[0].id),
  ).then(({ body }) => cy.wrap(body.data[0].id).as("subcategoryId"));
  cy.request(api() + "/api/v1/catalog/districts").then(({ body }) => cy.wrap(body.data[0].id).as("districtId"));
  cy.get("@subcategoryId").then((subcategory) => cy.get("@districtId").then((district) =>
    apiWrite("POST", "/requests", {
      subcategory_id: subcategory,
      description: "La computadora no enciende desde ayer por la tarde.",
      district_id: district,
      address: "Calle sintética 456",
      mode: "asap",
      source: "automatic",
    }).then((response) => {
      expect(response.status).to.eq(201);
      cy.wrap(response.body.data).as("record");
    }),
  ));
  openMyRequests();
  cy.get("@record").then((record) => {
    cy.contains("button", "Ver solicitud #" + record.id).click();
    cy.contains("button", "Continuar solicitud #" + record.id).click();
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
// D-92: envío del pedido (paso 5 del asistente nuevo).
export function sendOrder() {
  wizard()
    .contains("label", "Confirmo que el resumen es correcto")
    .find("input")
    .check();
  wizard().contains("button", "Enviar pedido").click();
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
