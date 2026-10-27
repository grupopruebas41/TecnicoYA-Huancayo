beforeEach(() => cy.task("serverClock", "reset"));
afterEach(() => cy.task("serverClock", "reset"));
import { login, observe, offline, openMyRequests } from "./helpers";
it("S04-TC-093 oferta por Reverb sin recargar", () => {
  login("e2e-technician-electro");
  cy.get('[aria-label="Solicitudes entrantes"]')
    .contains("[role=status]", "Conexión en tiempo real activa.")
    .should("be.visible");
  observe("GET", "/offers/*", "eventResource");
  cy.task("openRoundFor", "e2e-technician-electro@example.test");
  cy.wait("@eventResource").its("response.statusCode").should("eq", 200);
  cy.get('[aria-label^="Oferta "]').should("exist");
  cy.get("[role=timer]").should("exist");
});
it("S04-TC-094 el mismo evento publicado dos veces sin conexión se muestra una vez al reconectar [TC-055]", () => {
  // Evento real del outbox republicado por Reverb (tarea replayEvent, S04-TC-137); no se inyecta estado en React.
  cy.task("openRoundFor", "e2e-technician-electro@example.test").then(({ request_id: id }) => {
    cy.task("runJobs");
    login("e2e-client-direct");
    openMyRequests();
    cy.contains("button", "Ver solicitud #" + id).click();
    cy.get('[aria-label="Seguimiento de solicitud"]')
      .contains("Conexión en tiempo real activa.")
      .should("be.visible");
    const reads = [];
    cy.intercept("GET", "**/api/v1/requests/" + id, (req) =>
      req.continue((res) => reads.push(res.body.data.version)),
    ).as("read");
    offline(true);
    cy.contains("Sin conexión en tiempo real. Actualiza para ver cambios.").should("be.visible");
    cy.task("serverClock", "+10m");
    cy.task("runJobs"); // la oferta directa vence: request.updated real, perdido sin conexión
    cy.task("replayEvent", id).then((first) => {
      expect(first.request_id).to.eq(id);
      cy.task("replayEvent", id).its("event_id").should("eq", first.event_id);
      offline(false);
      cy.wait("@read").its("response.body.data.version").should("eq", first.version);
      cy.contains("Tu técnico no respondió a tiempo.").should("be.visible");
      cy.wrap(reads).should("deep.equal", [first.version]);
    });
  });
});
it("S04-TC-095 reconexión recupera por API", () => {
  cy.task("openRoundFor", "e2e-technician-frio@example.test");
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
  cy.contains("p", "Vencida").should("be.visible");
  cy.wait("@reconnect").then(({ response }) => {
    expect(response.statusCode).to.eq(200);
    expect(response.body.data.items.every((o) => o.status !== "pending")).to.eq(
      true,
    );
  });
});
afterEach(() => offline(false));
