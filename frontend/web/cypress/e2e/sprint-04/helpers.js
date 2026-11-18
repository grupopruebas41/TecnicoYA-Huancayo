import { openCard } from "../sprint-03/helpers";
import { dismissOnboarding } from "../../support/sprint01";
import { api, observe, apiWrite, openMyRequests } from "../sprint-03/helpers";
export { api, observe, apiWrite, openMyRequests };
export function login(account) {
  cy.visit("/#cuenta");
  cy.get("[data-cy=login-email]").type(account + "@example.test");
  cy.env(["E2E_PASSWORD"], { log: false }).then(({ E2E_PASSWORD }) =>
    cy.get("[data-cy=login-password]").type(E2E_PASSWORD, { log: false }),
  );
  cy.get("[data-cy=login-submit]").click();
  cy.get("[data-cy^=portal-]").should("be.visible"); // Fase 4: el cliente ya no tiene «Cerrar sesión» a la vista.
  dismissOnboarding(); // Fase 5: la bienvenida sale la primera vez que entra un cliente.
  // Panel del técnico (T2 y T3): entra al Inicio; las pruebas del S4 trabajan con la bandeja, que vive en «Ofertas».
  if (account.startsWith("e2e-technician")) {
    cy.get('nav[aria-label="Gestión del técnico"]').contains("button", "Ofertas").click();
    cy.get('[aria-label="Solicitudes entrantes"]').should("be.visible");
  }
}
export function read(path) {
  return cy.request({
    url: api() + "/api/v1" + path,
    headers: {
      Accept: "application/json",
      Origin: new URL(Cypress.config("baseUrl")).origin,
    },
  });
}
export function openRequest(phase) {
  read("/requests").then(({ body }) => {
    const row = body.data.find((r) => !phase || r.phase === phase);
    expect(row, "solicitud de la fase del catálogo").to.exist;
    openMyRequests();
    openCard(row.id);
    cy.wrap(row).as("currentRequest");
  });
}
export function pendingOffer() {
  return cy.get('[aria-label^="Oferta "]').filter(":has(button)").first();
}
export function offline(value) {
  return cy.then(() =>
    Cypress.automation("remote:debugger:protocol", {
      command: "Network.emulateNetworkConditions",
      params: {
        offline: value,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
      },
    }),
  );
}
