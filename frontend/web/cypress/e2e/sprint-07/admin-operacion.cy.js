import { login } from "../../support/sprint01";
import { read } from "../sprint-04/helpers";

// S07-TC-221 a 223 · Panel del administrador, Fase A3 (Operación), con la API real: cancelar con motivo desde el detalle de
// la solicitud (D-116 y D-120), reenviar al emparejamiento desde una alerta operativa (D-118) y el tablero en vivo con su
// indicador de conexión, más el CSV de la vista filtrada. Sprint07E2ESeeder deja una solicitud de e2e-client-intervencion
// (10 min) para cancelar y la de e2e-client-alertas (45 min, sin técnico) para la alerta.
// S07-TC-237 a 239 (revisión del #70): detalle con franja, barra de acciones y línea de tiempo; tablero con resumen y
// sin «Vence en 0 min»; alertas con nivel, grupos y chips, y el contador del menú en la misma línea que su texto.
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
      // Revisión del #70: la acción que ya no aplica por D-120 queda visible pero desactivada, con su motivo en el title.
      cy.contains('[role="toolbar"] button', "Cancelar con motivo").should("be.disabled").and("have.attr", "title", "La solicitud ya está cancelada.");
    });
  });

  it("S07-TC-222 una alerta de solicitud sin técnico se reenvía al emparejamiento desde la lista priorizada", () => {
    login("admin");
    requestOf("Cliente E2E alertas").then((id) => {
      nav().contains("button", "Alertas operativas").click();
      // Revisión del #70: la segunda línea empieza con el número («N.º 12 · Electricidad · Chilca»).
      cy.contains(".adm-alert", `N.º ${id} ·`).should("contain", "Sin técnico hace").within(() => {
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

  it("S07-TC-237 el detalle tiene franja del estado, barra de acciones de 44 px y la línea de tiempo de la solicitud por día", () => {
    login("admin");
    requestOf("Cliente E2E alertas").then((id) => {
      nav().contains("button", "Solicitudes").click();
      cy.get("label").contains("N.º de solicitud").parent().find("input").type(String(id));
      cy.get(`button[aria-label="Ver la solicitud ${id}"]`).should("have.length", 1).click();
      cy.get(".adm-request-head").should("have.attr", "data-tone").and("not.be.empty");
      cy.get(".adm-request-head .adm-status.is-large").should("be.visible");
      cy.get('[role="toolbar"][aria-label="Acciones de la solicitud"]').within(() => {
        cy.contains("button", "Reenviar al emparejamiento").should("have.class", "adm-btn-primary").and("be.enabled")
          .invoke("outerHeight").should("be.gte", 44);
        cy.contains("button", "Cancelar con motivo").should("have.class", "adm-btn-danger").and("be.enabled")
          .invoke("outerHeight").should("be.gte", 44);
      });
      cy.get('[aria-labelledby="adm-request-timeline"]').within(() => {
        // El día depende de la hora de Lima de la corrida (cerca de medianoche puede decir «Ayer»).
        cy.get(".adm-day-label").first().invoke("text").should("match", /^(Hoy|Ayer)$/);
        cy.contains(".adm-event-title", "Solicitud registrada").should("be.visible");
        cy.contains(".adm-event-title", "Solicitud enviada").should("be.visible");
        cy.get(".adm-event-dot svg").should("have.length.at.least", 2);
        cy.contains("Sin eventos registrados").should("not.exist");
      });
    });
  });

  it("S07-TC-238 el tablero en vivo resume arriba, cuenta cada columna y no muestra pendientes con «Vence en 0 min»", () => {
    cy.intercept("GET", "**/api/v1/admin/matching/live").as("live");
    login("admin");
    nav().contains("button", "Emparejamiento en vivo").click();
    cy.wait("@live").then(({ response }) => {
      const data = response.body.data;
      const open = data.searching.reduce((sum, item) => sum + item.open_offers.length, 0);
      expect(data).to.have.property("pending_overdue");
      cy.get('[role="group"][aria-label="Resumen del emparejamiento"] .adm-kpi').then(($kpis) => {
        expect([...$kpis].map((kpi) => kpi.textContent)).to.deep.eq([
          `${data.searching.length}Buscando ahora`, `${open}Ofertas abiertas`, `${data.pending.length}Pendientes de 24 h`]);
      });
      cy.contains("h3", "Buscando técnico").find(".adm-live-count").should("have.text", String(data.searching.length));
      if (data.searching.length) {
        cy.get(".adm-live-card[data-urgency]").first().find("button").should("have.class", "adm-btn-secondary")
          .invoke("outerHeight").should("be.gte", 44);
      }
    });
    cy.contains("Vence en 0 min").should("not.exist");
  });

  it("S07-TC-239 las alertas van agrupadas con nivel y tiempos legibles, y el contador del menú queda en la línea del texto", () => {
    login("admin");
    nav().contains("button", "Alertas operativas").click();
    cy.get('[role="group"][aria-label="Filtrar alertas"]').within(() => {
      cy.contains("button", /^Todas (d+)$/).should("have.attr", "aria-pressed", "true");
      cy.contains("button", /^Sin técnico asignado (d+)$/).click().should("have.attr", "aria-pressed", "true");
    });
    cy.get(".adm-alert-group").should("have.length", 1).and("have.attr", "aria-label", "Sin técnico asignado");
    cy.get(".adm-alert").each(($alert) => {
      expect($alert.find(".adm-level").text()).to.match(/^(Urgente|Atención)$/);
      expect($alert.text()).not.to.match(/d{3,} h/);
    });
    cy.get(".adm-alert").first().find('button[aria-label^="Ver la solicitud"]').should("have.class", "adm-btn-secondary");
    // DEF-87: con el ítem activo, el contador queda a la derecha y a la misma altura que el texto.
    nav().contains("button", "Alertas operativas").should("have.attr", "aria-current", "page").then(($item) => {
      const label = $item.find(".panel-label")[0].getBoundingClientRect();
      const badge = $item.find(".panel-nav-badge")[0].getBoundingClientRect();
      expect(badge.left).to.be.gte(label.right - 1);
      expect(badge.top).to.be.lt(label.bottom);
      expect(badge.bottom).to.be.gt(label.top);
    });
  });
});
