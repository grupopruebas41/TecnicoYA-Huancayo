import { login, pendingOffer } from "./helpers";
it("S04-TC-096 teclado y foco en confirmación", () => {
  cy.task("openRoundFor", "e2e-technician-frio");
  login("e2e-technician-frio");
  pendingOffer()
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
  pendingOffer().contains("button", "Rechazar").should("have.focus");
  cy.get("[role=timer]").first().should("have.attr", "aria-live", "off");
});
