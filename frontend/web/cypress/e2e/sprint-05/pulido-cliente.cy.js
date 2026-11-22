import { loginClient } from "../sprint-03/helpers";

// S05-TC-404 a 406 · Pulido final del panel del cliente con la API real. DEF-77: ninguna insignia de la tarjeta de técnico
// se parte en vertical a 1366, 1024 y 390 px ni con el texto al 150 %. DEF-76: Sensores con datos de las últimas 24 h y
// estados con texto. Garantías con «Vigentes» primero. Sprint05E2ESeeder deja a e2e-client-premium con DemoPremium.
const nav = () => cy.get('nav[aria-label="Gestión del cliente"]');
const open = (label, width) => {
  if (width < 760) cy.get(".panel-drawer-toggle").click();
  nav().contains("button", label).click();
};

describe("Pulido final del panel del cliente", () => {
  it("S05-TC-404 las insignias de Buscar técnicos quedan en una línea a 1366, 1024 y 390 px y con texto al 150 % [DEF-77]", () => {
    loginClient();
    [[1366, 900, "100%"], [1024, 800, "100%"], [390, 844, "100%"], [390, 844, "150%"], [1366, 900, "150%"]].forEach(([width, height, size]) => {
      cy.viewport(width, height);
      cy.document().then((doc) => { doc.documentElement.style.fontSize = size; });
      open("Buscar técnicos", width);
      cy.get('[aria-label="Buscar técnicos"]').should("have.attr", "aria-busy", "false");
      cy.get("[data-testid=technician-card] .cx-badge").should("have.length.greaterThan", 1).each(($badge) => {
        const style = getComputedStyle($badge[0]);
        const line = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.4;
        // Una sola línea: la altura no pasa de una línea más el relleno, y el ancho alcanza para el texto.
        expect($badge[0].getBoundingClientRect().height, `${width}px ${size} «${$badge.text().trim()}»`).to.be.lessThan(line * 1.9 + 8);
        expect(style.whiteSpace).to.eq("nowrap");
      });
      cy.window().then((win) => expect(win.document.documentElement.scrollWidth).to.be.at.most(win.innerWidth));
    });
    cy.document().then((doc) => { doc.documentElement.style.fontSize = ""; });
  });

  it("S05-TC-405 Sensores muestra lecturas de las últimas 24 h y cada estado con texto; Alertas empieza por las activas [DEF-76]", () => {
    loginClient("premium");
    open("Sensores IoT", 1366);
    cy.get(".sensor-card").should("have.length", 3).each(($card) => {
      cy.wrap($card).find(".premium-status").invoke("text").should("match", /Normal|Atención|Falla|Sin datos/);
      cy.wrap($card).should("contain", "Última lectura hace");
    });
    cy.contains(".sensor-card", "Congeladora de helados").find(".premium-status").should("contain", "Falla");
    open("Alertas", 1366);
    cy.get(".alert-group-title").first().should("contain", "Activas");
    cy.get(".premium-alert").first().should("have.class", "is-failure").find(".alert-value").should("be.visible");
  });

  it("S05-TC-406 Garantías abre en «Vigentes» con la barra de días y las pestañas se manejan con el teclado", () => {
    loginClient("premium");
    open("Garantías", 1366);
    cy.get('[role=tab][aria-selected="true"]').should("contain", "Vigentes");
    cy.get('[role=progressbar]').first().should("have.attr", "aria-valuetext").and("match", /^Quedan \d+ de 30 días$/);
    cy.get('[role=tab][aria-selected="true"]').focus().trigger("keydown", { key: "ArrowRight" });
    cy.get('[role=tab][aria-selected="true"]').should("contain", "Vencidas").and("have.focus");
    cy.contains("Ejemplo · datos de demostración").should("have.length", 1);
  });
});
