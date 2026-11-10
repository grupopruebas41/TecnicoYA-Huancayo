import { loginClient, observe, switchAccount } from "../sprint-03/helpers";

// S05-TC-250 a 252 · Fase 5 (modo rápido, escritas sin ejecutar): bienvenida y tutorial una sola vez, y ajustes que
// persisten entre sesiones (otra sesión limpia equivale a otro equipo: sin localStorage).
describe("Accesibilidad, bienvenida y tutorial", () => {
  it("S05-TC-250 la bienvenida guarda las preferencias y no vuelve a aparecer al recargar", () => {
    observe("PUT", "/client/me/preferences", "preferencias");
    loginClient("fresh", { keepOnboarding: true });
    cy.get('[role=dialog]').contains("h2", "¿Cómo prefieres usar TécnicoYa?");
    cy.contains("button", "Letra grande y alto contraste").click();
    cy.contains("button", "Guardar y continuar").click();
    cy.wait("@preferencias").its("response.body.data.onboarding_completed_at").should("not.be.null");
    cy.contains("button", "Omitir tutorial").click();
    cy.wait("@preferencias").its("response.body.data.tour_completed_at").should("not.be.null");
    cy.reload();
    cy.get("[data-cy=portal-client]").should("be.visible");
    cy.get("[role=dialog]").should("not.exist");
    cy.get("html").should("have.attr", "data-text-size", "130").and("have.attr", "data-contrast", "high");
  });

  it("S05-TC-251 los ajustes vuelven en otra sesión sin la copia local", () => {
    loginClient();
    cy.get('button[aria-label^="Cuenta de "]').click();
    cy.contains("[role=tab]", "Accesibilidad").click();
    cy.contains("label", "Modo simple").find("input").check();
    cy.get("html").should("have.attr", "data-simple", "on");
    cy.clearLocalStorage();
    cy.get("@clientEmail").then((email) => switchAccount(email));
    cy.get("html").should("have.attr", "data-simple", "on");
  });

  it("S05-TC-252 «Cómo funciona» repite el tutorial y «Saltar al contenido» funciona con teclado", () => {
    loginClient();
    cy.get('nav[aria-label="Gestión del cliente"]').contains("button", "Cómo funciona").click();
    cy.contains("button", "Ver el tutorial otra vez").click();
    cy.get("[role=dialog]").should("contain", "Paso 1 de 4");
    cy.get("[role=dialog]").trigger("keydown", { key: "Escape" });
    cy.get(".skip-link").focus().click();
    cy.focused().should("have.id", "contenido");
  });
});
