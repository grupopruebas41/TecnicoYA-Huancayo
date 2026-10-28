import { loginClient, wizard, send, observe } from "./helpers";
describe("S3 búsqueda", () => {
  beforeEach(() => {
    loginClient();
    cy.get('nav[aria-label="Gestión del cliente"]')
      .contains("button", "Buscar técnicos")
      .click();
  });
  it("S03-TC-064 filtros y vacío", () => {
    cy.get('[aria-label="Buscar técnicos"]').within(() => {
      cy.contains("label", "Rubro").find("select").select(1);
      cy.contains("label", "Zona").find("select").select(1);
      cy.get("[data-cy=technician-card]").should("have.length.greaterThan", 0);
      cy.contains("label", "Calificación mínima").find("select").select("5");
      cy.contains("No hay técnicos que coincidan").should("be.visible");
      cy.get("[data-cy=technician-card]").should("not.exist");
    });
  });
  it("S03-TC-065 perfil sin contacto", () => {
    cy.get("[data-cy=technician-card]").first().find("button").click();
    cy.get('[aria-label="Perfil público"]').within(() => {
      cy.contains("h3", "Servicios").should("be.visible");
      cy.contains("h3", "Portafolio público").should("be.visible");
      cy.contains("Sin reseñas publicadas todavía.").should("be.visible");
      cy.get('a[href^="tel:"],a[href*="wa.me"],a[href^="mailto:"]').should(
        "not.exist",
      );
      cy.contains(/Documentos de verificación|WhatsApp/).should("not.exist");
    });
  });
  it("S03-TC-066 solicitud dirigida al técnico elegido", () => {
    cy.get("[data-cy=technician-card]").first().find("button").click();
    cy.get('[aria-label="Perfil público"] h2').invoke("text").as("chosenName");
    cy.contains("button", "Solicitar servicio").click();
    // Revisión del PR #39: tarjetas con radio en lugar de select.
    wizard().find("input[name=specialty_id]").first().check();
    wizard().contains("button", "Siguiente").click();
    wizard()
      .find("input[name=subcategory_id]")
      .should("have.length.greaterThan", 0);
    wizard().find("input[name=subcategory_id]").first().check();
    wizard().contains("button", "Siguiente").click();
    wizard()
      .find("textarea")
      .type("Falla sintética para este técnico elegido.");
    wizard().contains("button", "Siguiente").click();
    wizard().find("select[name=district_id]").select(1);
    wizard().find("input[name=address]").type("Calle sintética 123");
    observe("POST", "/requests", "directed");
    wizard().contains("button", "Siguiente").click();
    cy.wait("@directed")
      .its("response.body.data.source")
      .should("eq", "profile");
    cy.get("@chosenName").then((name) =>
      wizard()
        .contains("Solicitud dirigida a " + name)
        .should("be.visible"),
    );
    send();
    wizard().contains("Solicitud enviada correctamente.").should("be.visible");
  });
});
