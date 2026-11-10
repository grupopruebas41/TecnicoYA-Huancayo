import { loginClient, observe } from "../sprint-03/helpers";

// S05-TC-272 a 274 · Fase 6 (modo rápido, escritas sin ejecutar): Mi hogar / Mi negocio con la API real.
// Sprint05E2ESeeder deja a e2e-client-premium con equipos y sensores simulados (la congeladora sale de rango en la tarde).
const nav = () => cy.get('nav[aria-label="Gestión del cliente"]');

describe("Plan Premium: Mi hogar / Mi negocio", () => {
  it("S05-TC-272 un cliente free ve el candado y la API le responde 403", () => {
    loginClient();
    nav().contains("button", "Sensores IoT").click();
    cy.contains("h2", "Plan Premium").should("be.visible");
    cy.request({ url: Cypress.expose("apiUrl") + "/api/v1/client/iot/devices", failOnStatusCode: false })
      .its("status").should("eq", 403);
  });

  it("S05-TC-273 los sensores muestran la franja de demostración y el estado de cada equipo", () => {
    loginClient("premium");
    nav().contains("button", "Sensores IoT").click();
    cy.contains("Modo demostración: lecturas simuladas").should("be.visible");
    cy.get(".sensor-card").should("have.length", 3).first().find(".premium-status").invoke("text").should("match", /Normal|Atención|Falla/);
  });

  it("S05-TC-274 una alerta se envía al técnico y crea la solicitud", () => {
    observe("POST", "/client/iot/alerts/*/request", "enviar");
    loginClient("premium");
    nav().contains("button", "Alertas").click();
    cy.contains("button", "Enviar a mi técnico de confianza").first().click();
    cy.wait("@enviar").its("response.statusCode").should("eq", 201);
    cy.contains(/Creamos la solicitud #\d+|Enviamos la solicitud #\d+/).should("be.visible");
  });
});
