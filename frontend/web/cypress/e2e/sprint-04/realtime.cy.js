import { login, observe, offline } from "./helpers";
it("S04-TC-093 oferta por Reverb sin recargar", () => {
  login("e2e-technician-electro");
  cy.get('[aria-label="Solicitudes entrantes"]')
    .contains("[role=status]", "Conexión en tiempo real activa.")
    .should("be.visible");
  observe("GET", "/offers/*", "eventResource");
  cy.task("openRoundFor", "e2e-technician-electro");
  cy.wait("@eventResource").its("response.statusCode").should("eq", 200);
  cy.get('[aria-label^="Oferta "]').should("exist");
  cy.get("[role=timer]").should("exist");
});
it.skip("S04-TC-094 BLOQUEADO: contrato no define tarea para republicar el mismo event_id", () => {
  // Desconectar transporte; republicar evento real dos veces desde outbox; reconectar;
  // una notificación lógica y versión de la API. No inyectar datos al estado React.
});
it("S04-TC-095 reconexión recupera por API", () => {
  cy.task("openRoundFor", "e2e-technician-frio");
  login("e2e-technician-frio");
  cy.get('[aria-label="Solicitudes entrantes"]')
    .contains("Conexión en tiempo real activa.")
    .should("be.visible");
  offline(true);
  cy.contains(
    "Sin conexión en tiempo real. Actualiza para ver cambios.",
  ).should("be.visible");
  cy.task("serverClock", "+10m");
  cy.task("runJobs");
  observe("GET", "/offers?status=pending,accepted", "reconnect");
  offline(false);
  cy.wait("@reconnect").then(({ response }) => {
    expect(response.statusCode).to.eq(200);
    expect(response.body.data.items.every((o) => o.status !== "pending")).to.eq(
      true,
    );
  });
});
afterEach(() => offline(false));
