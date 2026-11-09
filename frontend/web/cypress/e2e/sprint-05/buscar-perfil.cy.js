import { loginClient, observe, switchAccount } from "../sprint-03/helpers";

// S05-TC-211 a 214 · Fase 3 (D-101): Buscar técnicos y perfil público con la API real. Sprint05E2ESeeder deja a
// «Técnica E2E de perfil completo» (vitrinas, disponible todo el día, dos trabajos y 5 reseñas de ejemplo).
const NAME = "Técnica E2E de perfil completo";
const openSearch = () => {
  cy.get('nav[aria-label="Gestión del cliente"]').contains("button", "Buscar técnicos").click();
  cy.get('[aria-label="Buscar técnicos"]').should("have.attr", "aria-busy", "false");
};
const cardOf = (name) => cy.contains("article h3", name).closest("article");

describe("Buscar técnicos y perfil del técnico", () => {
  it("S05-TC-211 especialidad, «Disponible hoy» y orden por precio filtran con la API real", () => {
    observe("GET", "/technicians?*", "busqueda");
    loginClient();
    openSearch();
    cy.get('[role=group][aria-label="Especialidades"]').contains("button", "Refrigeración comercial").click()
      .should("have.attr", "aria-pressed", "true");
    cy.get('[role=group][aria-label="Filtros"]').contains("button", "Disponible hoy").click().should("have.attr", "aria-pressed", "true");
    cy.get("#search-sort").select("Precio");
    cy.wait("@busqueda").its("request.url").should("contain", "available_today=1").and("contain", "sort=price");
    cy.contains("Ordenados por precio referencial, de menor a mayor; no es una recomendación.").should("be.visible");
    cardOf(NAME).within(() => {
      cy.contains("Verificado").should("be.visible");
      cy.contains("Ejemplo").should("be.visible");
      cy.contains("Desde S/").should("be.visible");
    });
  });

  it("S05-TC-212 el favorito se guarda en el servidor y sigue marcado al volver a entrar", () => {
    observe("PUT", "/client/favorites/*", "guardar");
    loginClient();
    openSearch();
    cardOf(NAME).find(`button[aria-label="Guardar a ${NAME} en favoritos"]`).click();
    cy.wait("@guardar").its("response.statusCode").should("eq", 200);
    cy.contains(`Guardaste a ${NAME} en tus favoritos.`).should("be.visible");
    cy.reload();
    openSearch();
    cardOf(NAME).find(`button[aria-label="Quitar a ${NAME} de favoritos"]`).should("have.attr", "aria-pressed", "true").click();
    cy.contains(`Quitaste a ${NAME} de tus favoritos.`).should("be.visible");
  });

  it("S05-TC-213 el perfil trae las seis secciones y el visor del portafolio se maneja con teclado", () => {
    loginClient();
    openSearch();
    cardOf(NAME).contains("button", `Ver perfil de ${NAME}`).click();
    cy.get("h3").then((headings) => expect([...headings].map((h) => h.textContent))
      .to.deep.equal(["Sobre mí", "Servicios", "Disponibilidad", "Portafolio", "Calificaciones", "Confianza"]));
    cy.get('table[aria-label="Disponibilidad semanal"] tbody tr').should("have.length", 7);
    cy.contains("Ejemplo · datos de demostración").should("be.visible");
    cy.contains("Identidad verificada por el administrador").should("be.visible");
    cy.get('[aria-label="Portafolio"] button[aria-label^="Ver el trabajo"]').first().as("opener").click();
    cy.get('dialog[aria-modal="true"]').should("contain", "Trabajo 1 de 2").trigger("keydown", { key: "ArrowRight" });
    cy.get('dialog[aria-modal="true"]').should("contain", "Trabajo 2 de 2").trigger("keydown", { key: "Escape" });
    cy.get('dialog[aria-modal="true"]').should("not.exist");
    cy.get("@opener").should("have.focus");
    cy.get(".profile-cta-bar").contains("button", "Solicitar servicio").should("be.visible");
  });

  it("S05-TC-214 lo que el técnico declara en «qué incluye» lo ve el cliente en el perfil", () => {
    const includes = "Revisión, limpieza y prueba de fugas (E2E " + Date.now() + ").";
    loginClient();
    switchAccount("e2e-technician-perfil@example.test");
    cy.get("[data-cy=portal-technician]").should("be.visible");
    cy.contains("button", "Servicios y tarifas").click();
    cy.get('[id^="includes-"]').first().clear().type(includes);
    cy.get('[id^="includes-"]').first().closest("form").contains("button", "Guardar").click();
    cy.contains("Cambios guardados.").should("be.visible");
    cy.get("@clientEmail").then((email) => switchAccount(email));
    openSearch();
    cardOf(NAME).contains("button", `Ver perfil de ${NAME}`).click();
    cy.get('[aria-label="Servicios"]').should("contain", "Qué incluye: " + includes);
  });
});
