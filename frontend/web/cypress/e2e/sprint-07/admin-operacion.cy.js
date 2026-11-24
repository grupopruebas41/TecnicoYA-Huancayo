import { login } from "../../support/sprint01";
import { read } from "../sprint-04/helpers";

// S07-TC-221 a 223 · Panel del administrador, Fase A3 (Operación), con la API real: cancelar con motivo desde el detalle de
// la solicitud (D-116 y D-120), reenviar al emparejamiento desde una alerta operativa (D-118) y el tablero en vivo con su
// indicador de conexión, más el CSV de la vista filtrada. Sprint07E2ESeeder deja una solicitud de e2e-client-intervencion
// (10 min) para cancelar y la de e2e-client-alertas (45 min, sin técnico) para la alerta.
const nav = () => cy.get('nav[aria-label="Administración"]');
const MOTIVE = "Anulación de prueba E2E con motivo suficiente.";

/** Número de la solicitud enviada del cliente E2E indicado (el listado del administrador trae el nombre del cliente). */
function requestOf(client) {
  return read("/admin/requests?status=sent&per_page=100").then(({ body }) => {
    const item = body.data.items.find((row) => row.client === client);
    expect(item, `solicitud enviada de ${client}`).to.exist;
    return item.id;
  });
}

describe("Panel del administrador: Operación (Fase A3)", () => {
  it("S07-TC-221 cancelar con motivo desde el detalle pide confirmación, avisa el resultado y deja el evento en la línea de tiempo", () => {
    login("admin");
    requestOf("Cliente E2E intervención").then((id) => {
      nav().contains("button", "Solicitudes").click();
      cy.get("label").contains("N.º de solicitud").parent().find("input").type(String(id));
      cy.get(`button[aria-label="Ver la solicitud ${id}"]`).should("have.length", 1).click();
      cy.contains("h2", `Solicitud N.º ${id}`).should("be.visible");
      cy.contains("button", "Cancelar con motivo").click();
      cy.get("dialog[open]").within(() => {
        cy.contains("button", "Cancelar la solicitud").click();
        cy.contains("Escribe el motivo (al menos 10 caracteres).").should("be.visible");
        cy.get("textarea").type(MOTIVE);
        cy.intercept("POST", `**/api/v1/admin/requests/${id}/cancellation`).as("cancel");
        cy.contains("button", "Cancelar la solicitud").click();
      });
      cy.wait("@cancel").then(({ request, response }) => {
        expect(response.statusCode).to.eq(200);
        expect(request.headers["idempotency-key"]).to.be.a("string").and.not.be.empty;
        expect(request.body.reason).to.eq(MOTIVE);
      });
      cy.contains("Cancelamos la solicitud y avisamos al cliente.").should("be.visible");
      cy.contains(".adm-status", "Cancelada").should("be.visible");
      cy.contains('[aria-labelledby="adm-request-timeline"]', "Un administrador canceló la solicitud.").should("be.visible");
      cy.contains("button", "Cancelar con motivo").should("not.exist");
    });
  });

  it("S07-TC-222 una alerta de solicitud sin técnico se reenvía al emparejamiento desde la lista priorizada", () => {
    login("admin");
    requestOf("Cliente E2E alertas").then((id) => {
      nav().contains("button", "Alertas operativas").click();
      cy.contains(".adm-alert", `Solicitud N.º ${id}`).should("contain", "Sin técnico hace").within(() => {
        cy.get(`button[aria-label="Reenviar la solicitud ${id}"]`).click();
      });
      cy.intercept("POST", `**/api/v1/admin/requests/${id}/rematch`).as("rematch");
      cy.get("dialog[open]").within(() => {
        cy.get("textarea").type("Nadie aceptó todavía: se vuelve a buscar (E2E).");
        cy.contains("button", "Reenviar").click();
      });
      cy.wait("@rematch").its("response.statusCode").should("eq", 200);
      cy.contains("Reenviamos la solicitud al emparejamiento.").should("be.visible");
      cy.get(`button[aria-label="Ver la solicitud ${id}"]`).first().click();
      cy.contains("h2", `Solicitud N.º ${id}`).should("be.visible");
      cy.contains('[aria-labelledby="adm-request-timeline"]', "Un administrador reenvió la solicitud al emparejamiento.").should("be.visible");
    });
  });

  it("S07-TC-223 el tablero en vivo muestra su conexión y sus secciones, y Solicitudes descarga el CSV de la vista filtrada", () => {
    cy.intercept("GET", "**/api/v1/admin/matching/live").as("live");
    login("admin");
    nav().contains("button", "Emparejamiento en vivo").click();
    cy.wait("@live").its("response.statusCode").should("eq", 200);
    cy.get('[role="status"][aria-label="Conexión"]').invoke("text").should("match", /En vivo|Actualiza cada 30 s/);
    ["Buscando técnico", "En el pendiente de 24 h", "Ofertas vencidas (24 h)"].forEach((title) => cy.contains("h3", title).should("be.visible"));

    nav().contains("button", "Solicitudes").click();
    cy.get("label").contains("Estado").parent().find("select").select("Enviada");
    cy.intercept("GET", "**/api/v1/admin/requests/export*").as("csv");
    cy.contains("button", "Exportar CSV").click();
    cy.wait("@csv").then(({ request, response }) => {
      expect(request.url).to.contain("status=sent");
      expect(response.statusCode).to.eq(200);
      expect(response.headers["content-type"]).to.contain("text/csv");
    });
    cy.contains("Descargamos el CSV de la vista filtrada.").should("be.visible");
  });
});
