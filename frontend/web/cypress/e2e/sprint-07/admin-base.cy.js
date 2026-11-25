import { login } from "../../support/sprint01";

// S07-TC-163 a 165 · Panel del administrador, Fase A1 (PLAN-PANEL-ADMIN.md), con la API real: primera visita de un
// administrador (bienvenida y tutorial de 5 pasos, D-117), menú agrupado con Próximamente y secciones en preparación, y
// contadores del menú (D-118). e2e-admin-nuevo vuelve a su primera visita en cada siembra (Sprint07E2ESeeder), que además
// deja una solicitud sin técnico enviada hace 45 minutos (alerta operativa).
const nav = () => cy.get('nav[aria-label="Administración"]');

/** Inicio de sesión sin descartar la bienvenida (el login del S1 la omite). */
function firstLogin(account) {
  cy.visit("/#cuenta");
  cy.get("[data-cy=login-email]").type(account + "@example.test");
  cy.env(["E2E_PASSWORD"], { log: false }).then(({ E2E_PASSWORD }) => cy.get("[data-cy=login-password]").type(E2E_PASSWORD, { log: false }));
  cy.get("[data-cy=login-submit]").click();
  cy.get("[data-cy=portal-admin]").should("be.visible");
}

describe("Panel del administrador: base y menú (Fase A1)", () => {
  it("S07-TC-163 la primera visita muestra la bienvenida, guarda la preferencia y recorre el tutorial de 5 pasos una sola vez", () => {
    cy.intercept("PUT", "**/api/v1/me/preferences").as("preferences");
    firstLogin("e2e-admin-nuevo");
    cy.contains("dialog[open], [role=dialog]", "¿Cómo prefieres usar TécnicoYa?").within(() => {
      cy.contains("button", "Menos movimiento").click().should("have.attr", "aria-pressed", "true");
      cy.contains("button", "Guardar y continuar").click();
    });
    cy.wait("@preferences").its("request.body").should((body) => {
      expect(body.accessibility).to.deep.equal({ reduce_motion: true });
      expect(body.onboarding_completed).to.eq(true);
      // Ley 29733: nunca se guarda la tarjeta elegida.
      expect(JSON.stringify(body)).not.to.contain("movimiento");
    });
    const titles = ["El menú", "Inicio y tareas pendientes", "Solicitudes y emparejamiento", "Usuarios y verificación", "«Aa» y tu cuenta"];
    titles.forEach((title, index) => {
      cy.contains(".tour-bubble", `Paso ${index + 1} de 5`).should("be.visible").and("contain", title);
      cy.contains(".tour-bubble button", index === 4 ? "Terminar" : "Siguiente").click();
    });
    cy.wait("@preferences").its("request.body").should("deep.equal", { tour_completed: true });
    cy.get(".tour-bubble").should("not.exist");
    cy.reload();
    cy.get("[data-cy=portal-admin]").should("be.visible");
    cy.get(".welcome-dialog").should("not.exist");
    cy.get(".tour-bubble").should("not.exist");
  });

  it("S07-TC-164 el menú agrupa las secciones, «Próximamente» no navega y una sección en preparación lleva a una disponible", () => {
    login("admin");
    nav().find(".panel-nav-heading").then(($headings) => {
      expect([...$headings].map((heading) => heading.textContent.trim())).to.deep.eq(
        ["General", "Operación", "Personas", "Negocio", "Contenido", "Control", "Próximamente", "Ayuda"]);
    });
    nav().find('.panel-nav-item.is-soon[aria-disabled="true"]').should("have.length", 3);
    cy.get(".panel-content h2").first().invoke("text").then((before) => {
      nav().contains(".panel-nav-item", "Pagos").click();
      cy.get(".panel-content h2").first().should("have.text", before);
    });
    // Fase A3 (2026-11-25): «Emparejamiento en vivo» ya es una pantalla real; «Desempeño de técnicos» sigue en preparación.
    nav().contains("button", "Desempeño de técnicos").click();
    cy.contains(".panel-content", "Estamos preparando esta sección.").should("be.visible");
    cy.contains(".panel-content button", "Ir a Verificación de técnicos").click();
    nav().contains("button", "Verificación de técnicos").should("have.attr", "aria-current", "page");
  });

  it("S07-TC-165 los contadores del menú muestran lo que informa el servidor: verificación, solicitudes sin técnico y alertas", () => {
    cy.intercept("GET", "**/api/v1/admin/dashboard").as("dashboard");
    login("admin");
    cy.wait("@dashboard").its("response.body.data.badges").then((badges) => {
      // La siembra deja una solicitud sin técnico enviada hace 45 minutos (más de 30, D-118).
      expect(badges.requests_unassigned).to.be.at.least(1);
      expect(badges.operational_alerts).to.be.at.least(1);
      const shown = (count) => (count > 99 ? "99+" : String(count));
      nav().find('[data-section="requests"] .panel-nav-badge').should("have.text", shown(badges.requests_unassigned));
      nav().find('[data-section="alerts"] .panel-nav-badge').should("have.text", shown(badges.operational_alerts));
      if (badges.verification_pending > 0) {
        nav().find('[data-section="verification"] .panel-nav-badge').should("have.text", shown(badges.verification_pending));
      }
      nav().contains("button", "Alertas operativas").invoke("attr", "aria-describedby").then((id) => {
        cy.get(`#${id}`).should("have.text", `${badges.operational_alerts} ${badges.operational_alerts === 1 ? "alerta operativa" : "alertas operativas"}`);
      });
    });
  });
});
