import { login, openRequest, observe } from "./helpers";
it("S04-TC-090 directa vencida requiere autorizar alternativas", () => {
  cy.task("serverClock", "+10m");
  cy.task("runJobs");
  login("e2e-client-direct");
  openRequest("direct_declined");
  cy.contains("Tu técnico no respondió a tiempo.").should("be.visible");
  observe("POST", "/requests/*/alternative-searches", "alternatives");
  cy.contains("button", "Buscar otros técnicos").click();
  cy.wait("@alternatives").its("response.statusCode").should("eq", 202);
  cy.contains("Autorizaste la búsqueda de otros técnicos.").should(
    "be.visible",
  );
});
