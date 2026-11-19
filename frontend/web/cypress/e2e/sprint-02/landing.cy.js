// S02-TC-059 y 060 · Actualizadas en el cierre común S4-S5 sobre la portada rediseñada (mismas 10 secciones con
// data-landing). La sección final ahora tiene dos caminos (cliente y técnico) y el carrusel de subcategorías de cada
// especialidad muestra el título en un h3; con movimiento reducido no rota (su barra de progreso queda quieta).
describe("Landing S2", () => {
  it("S02-TC-059 diez secciones y CTA en móvil y escritorio", () => {
    for (const width of [375, 1280]) {
      cy.viewport(width, 900);
      cy.visit("/#inicio");
      cy.get("[data-landing]").should("have.length", 10);
      cy.document().then((d) => expect(d.documentElement.scrollWidth).to.be.at.most(width));
      cy.get("#empezar a").first().click();
      cy.location("hash").should("match", /^#cuenta/);
      cy.get("[data-cy=login-submit], [data-cy=register-submit]").first().should("be.visible");
    }
  });

  it("S02-TC-060 carrusel reducido accesible", () => {
    cy.visit("/#inicio", {
      onBeforeLoad(win) {
        const native = win.matchMedia.bind(win);
        win.matchMedia = (query) => (query.includes("prefers-reduced-motion")
          ? { matches: true, addEventListener() {}, removeEventListener() {} }
          : native(query));
      },
    });
    cy.get("#servicios .current h3").first().should("be.visible").and("not.be.empty");
    cy.get("#servicios .ty-product-progress span").first().should("not.have.class", "is-running");
    cy.get('#servicios button[aria-label="Subcategoría siguiente"]').first().focus()
      .trigger("keydown", { key: "ArrowRight" }).should("have.focus");
    cy.get("#servicios .current h3").first().should("not.be.empty");
  });
});
