beforeEach(() => cy.task("serverClock", "reset"));
afterEach(() => cy.task("serverClock", "reset"));
import { login } from "./helpers";
it("S04-TC-096 teclado y foco en confirmación", () => {
  cy.task("openRoundFor", "e2e-technician-frio@example.test").as("freshRound");
  login("e2e-technician-frio");
  cy.get("@freshRound").then(({offer_id}) => cy.get('[aria-label="Oferta ' + offer_id + '"]'))
    .contains("button", "Rechazar")
    .focus()
    .should("have.attr", "type", "button");
  cy.then(() =>
    Cypress.automation("remote:debugger:protocol", {
      command: "Input.dispatchKeyEvent",
      params: {
        type: "keyDown",
        key: "Enter",
        code: "Enter",
        windowsVirtualKeyCode: 13,
      },
    }),
  );
  cy.then(() =>
    Cypress.automation("remote:debugger:protocol", {
      command: "Input.dispatchKeyEvent",
      params: {
        type: "keyUp",
        key: "Enter",
        code: "Enter",
        windowsVirtualKeyCode: 13,
      },
    }),
  );
  cy.get("dialog")
    .should("be.visible")
    .contains("button", "Cancelar")
    .should("have.focus")
    .click();
  cy.get("@freshRound").then(({offer_id}) => cy.get('[aria-label="Oferta ' + offer_id + '"]')).contains("button", "Rechazar").should("have.focus");
  cy.get("[role=timer]").first().should("have.attr", "aria-live", "off");
});
