beforeEach(() => cy.task("serverClock", "reset"));
afterEach(() => cy.task("serverClock", "reset"));
import { login, openRequest } from "./helpers";
it("S04-TC-091 pendiente muestra límite en Lima", () => {
  login("e2e-client-pending");
  openRequest("pending_availability");
  cy.get('[aria-label="Seguimiento de solicitud"]')
    .should("contain", "Pendiente de disponibilidad")
    .and("contain", "Buscaremos hasta el")
    .and("contain", "hora de Lima");
});
it("S04-TC-092 expiración libera cupo", () => {
  cy.task("serverClock", "+24h");
  cy.task("runJobs");
  login("e2e-client-pending");
  openRequest("expired");
  cy.contains("La búsqueda venció. Puedes crear otra solicitud.").should(
    "be.visible",
  );
  cy.contains("button", "Nueva solicitud").should("be.enabled");
});
