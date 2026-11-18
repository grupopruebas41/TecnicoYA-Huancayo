import { login } from "../sprint-04/helpers";

// S05-TC-369 a 371 · Panel del técnico, Fase T5 (modo rápido, escritas sin ejecutar): primera visita de un técnico nuevo
// (bienvenida, tutorial y «Primeros pasos»), pestaña «Avisos» y tutorial repetido desde «Cómo funciona», con la API real.
// e2e-technician-nuevo vuelve a su primera visita en cada siembra (Sprint05E2ESeeder). Se ejecutan en el cierre común.
const nav = () => cy.get('nav[aria-label="Gestión del técnico"]');

/** Inicio de sesión sin descartar la bienvenida (el login del S4 la omite). */
function firstLogin(account) {
  cy.visit("/#cuenta");
  cy.get("[data-cy=login-email]").type(account + "@example.test");
  cy.env(["E2E_PASSWORD"], { log: false }).then(({ E2E_PASSWORD }) => cy.get("[data-cy=login-password]").type(E2E_PASSWORD, { log: false }));
  cy.get("[data-cy=login-submit]").click();
  cy.get("[data-cy=portal-technician]").should("be.visible");
}

describe("Panel del técnico: primera visita, avisos y tutorial", () => {
  beforeEach(() => cy.task("serverClock", "reset"));

  it("S05-TC-369 la primera visita muestra la bienvenida, guarda los avisos, sigue con el tutorial y deja «Primeros pasos»", () => {
    cy.intercept("PUT", "**/api/v1/me/preferences").as("preferences");
    firstLogin("e2e-technician-nuevo");
    cy.contains('[role="dialog"]', "¿Cómo prefieres usar TécnicoYa?").within(() => {
      cy.contains("button", "Avisos de ofertas más notorios").click().should("have.attr", "aria-pressed", "true");
      cy.contains("button", "Guardar y continuar").click();
    });
    cy.wait("@preferences").its("request.body").should((body) => {
      expect(body.offer_alerts).to.deep.equal({ sound: true, vibration: true, flash: true });
      expect(JSON.stringify(body)).not.to.contain("avisos");
    });
    cy.contains(".tour-bubble", "Paso 1 de 5").should("be.visible");
    cy.contains("button", "Omitir tutorial").click();
    cy.wait("@preferences").its("request.body").should("deep.equal", { tour_completed: true });
    cy.get(".tech-first-steps").should("be.visible").and("contain", "0 de 4");
    cy.reload();
    cy.contains('[role="dialog"]', "¿Cómo prefieres usar TécnicoYa?").should("not.exist");
  });

  it("S05-TC-370 la pestaña «Avisos» guarda un interruptor con su alerta", () => {
    cy.intercept("PUT", "**/api/v1/me/preferences").as("preferences");
    login("e2e-technician-frio");
    cy.get(".panel-avatar-button").click();
    cy.contains('[role="tab"]', "Avisos").click();
    cy.contains("label", "Leer la oferta en voz alta").find('input[role="switch"]').click();
    cy.wait("@preferences").its("response.statusCode").should("eq", 200);
    cy.contains("Guardamos tus avisos de ofertas.").should("be.visible");
  });

  it("S05-TC-371 «Cómo funciona» repite el tutorial de 5 pasos sin volver a marcarlo", () => {
    let marks = 0;
    cy.intercept("PUT", "**/api/v1/me/preferences", (req) => { if (req.body.tour_completed) marks += 1; });
    login("e2e-technician-frio");
    nav().contains("button", "Cómo funciona").click();
    cy.contains("button", "Ver el tutorial otra vez").click();
    cy.contains(".tour-bubble", "Paso 1 de 5").should("be.visible");
    for (let step = 0; step < 4; step += 1) cy.contains(".tour-bubble button", "Siguiente").click();
    cy.contains(".tour-bubble button", "Terminar").click();
    cy.get(".tour-bubble").should("not.exist").then(() => expect(marks).to.eq(0));
  });
});
