import {
  loginClient,
  toDescription,
  toSummary,
  wizard,
  send,
  observe,
} from "./helpers";
// Chrome 156 necesita el código virtual y texto de Enter para activar botones.
// Se envían eventos nativos CDP; nunca click() ni eventos DOM fabricados.
function enter() {
  const key = {
    key: "Enter",
    code: "Enter",
    windowsVirtualKeyCode: 13,
    nativeVirtualKeyCode: 13,
  };
  cy.then(() =>
    Cypress.automation("remote:debugger:protocol", {
      command: "Input.dispatchKeyEvent",
      params: { ...key, type: "keyDown", text: "\r", unmodifiedText: "\r" },
    }),
  );
  cy.then(() =>
    Cypress.automation("remote:debugger:protocol", {
      command: "Input.dispatchKeyEvent",
      params: { ...key, type: "keyUp" },
    }),
  );
}
describe("S3 asistente", () => {
  beforeEach(() => loginClient());
  it("S03-TC-052 recorrido con corrección antes de enviar", () => {
    toSummary();
    wizard().contains("button", "Atrás").click();
    wizard().contains("button", "Atrás").click();
    wizard()
      .find("textarea")
      .clear()
      .type("La computadora presenta una falla corregida y verificable.");
    wizard().contains("button", "Siguiente").click();
    observe("PATCH", "/requests/*", "corrected");
    wizard().contains("button", "Siguiente").click();
    cy.wait("@corrected").its("response.statusCode").should("eq", 200);
    observe("POST", "/requests/*/submission", "sent");
    send();
    cy.wait("@sent").its("response.statusCode").should("eq", 202);
    wizard().contains("Solicitud enviada correctamente.").should("be.visible");
    wizard().contains("falla corregida").should("be.visible");
  });
  it("S03-TC-053 paso incompleto no avanza y enfoca error", () => {
    let creates = 0;
    cy.intercept("POST", "**/api/v1/requests", () => {
      creates++;
    });
    toDescription();
    wizard().contains("button", "Atrás").click();
    wizard().find("select[name=subcategory_id]").select("");
    wizard().contains("button", "Siguiente").click();
    cy.focused().should("have.attr", "name", "subcategory_id");
    wizard().find("select[name=subcategory_id]").select(1);
    wizard().contains("button", "Siguiente").click();
    wizard().contains("button", "Siguiente").click();
    cy.focused().should("have.attr", "name", "description");
    cy.then(() => expect(creates).to.eq(0));
  });
  it("S03-TC-054 atrás y adelante conserva datos", () => {
    toSummary();
    for (let i = 0; i < 4; i++) wizard().contains("button", "Atrás").click();
    wizard().contains("h2", "Paso 1").should("be.visible");
    for (let i = 0; i < 2; i++)
      wizard().contains("button", "Siguiente").click();
    wizard()
      .find("textarea")
      .should(
        "have.value",
        "La computadora no enciende desde ayer por la tarde.",
      );
    wizard().contains("button", "Siguiente").click();
    wizard()
      .find("input[name=address]")
      .should("have.value", "Calle sintética 456");
    wizard().contains("button", "Siguiente").click();
    wizard().contains("h2", "Paso 5").should("be.visible");
  });
  it("S03-TC-055 límites de descripción", () => {
    toDescription();
    wizard().find("textarea").type("a".repeat(19));
    wizard().contains("button", "Siguiente").click();
    wizard().contains("al menos 20").should("be.visible");
    wizard().contains("19/1000").should("be.visible");
    wizard().find("textarea").type("a");
    wizard().contains("20/1000").should("be.visible");
    wizard().contains("button", "Siguiente").click();
    wizard().contains("h2", "Paso 4").should("be.visible");
  });
  it("S03-TC-063 recorrido por teclado", () => {
    cy.location("hash").should("eq", "#cuenta/cliente");
    cy.window().then((win) => win.focus());
    cy.get('nav[aria-label="Gestión del cliente"]')
      .contains("button", "Nueva solicitud")
      .scrollIntoView()
      .focus()
      .should("be.focused");
    enter();
    wizard().contains("h2", "Paso 1").should("be.visible").and("be.focused");
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.focused().should("have.attr", "name", "specialty_id").select(1);
    cy.press(Cypress.Keyboard.Keys.TAB);
    enter();
    wizard().contains("h2", "Paso 2").should("be.visible").and("be.focused");
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.focused().select(1);
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.press(Cypress.Keyboard.Keys.TAB);
    enter();
    wizard().contains("h2", "Paso 3").should("be.visible").and("be.focused");
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.focused().type("Descripción sintética suficientemente larga.");
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.press(Cypress.Keyboard.Keys.TAB);
    enter();
    wizard().contains("h2", "Paso 4").should("be.visible").and("be.focused");
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.focused().select(1);
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.focused().type("Dirección sintética");
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.press(Cypress.Keyboard.Keys.TAB);
    enter();
    wizard().contains("h2", "Paso 5").should("be.focused");
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.focused().should("have.attr", "type", "checkbox");
    cy.then(() =>
      Cypress.automation("remote:debugger:protocol", {
        command: "Input.dispatchKeyEvent",
        params: {
          type: "keyDown",
          key: " ",
          code: "Space",
          windowsVirtualKeyCode: 32,
          text: " ",
        },
      }),
    );
    cy.then(() =>
      Cypress.automation("remote:debugger:protocol", {
        command: "Input.dispatchKeyEvent",
        params: {
          type: "keyUp",
          key: " ",
          code: "Space",
          windowsVirtualKeyCode: 32,
        },
      }),
    );
    cy.focused().should("be.checked");
    cy.press(Cypress.Keyboard.Keys.TAB);
    enter();
    wizard().contains("Solicitud enviada correctamente.").should("be.visible");
  });
});
