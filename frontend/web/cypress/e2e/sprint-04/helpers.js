import { api, observe, apiWrite, openMyRequests } from "../sprint-03/helpers";
export { api, observe, apiWrite, openMyRequests };
export function login(account) {
  cy.visit("/#cuenta");
  cy.get("[data-cy=login-email]").type(account + "@example.test");
  cy.env(["E2E_PASSWORD"], { log: false }).then(({ E2E_PASSWORD }) =>
    cy.get("[data-cy=login-password]").type(E2E_PASSWORD, { log: false }),
  );
  cy.get("[data-cy=login-submit]").click();
  cy.get("[data-cy=logout]").should("be.visible");
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
    cy.contains("button", "Ver solicitud #" + row.id).click();
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
