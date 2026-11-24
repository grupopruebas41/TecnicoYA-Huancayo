import { login } from "../../support/sprint01";

// S07-TC-187 a 189 · Panel del administrador, Fase A2 (PLAN-PANEL-ADMIN.md), con la API real: el Inicio muestra lo que
// informa GET /admin/dashboard (indicadores y tareas de D-118), cada tarea lleva a su sección y el gráfico cambia entre
// 7 y 30 días con su resumen y su detalle por teclado. Sprint07E2ESeeder deja una solicitud sin técnico de 45 minutos.
const minutes = (value) => {
  if (value === null) return "—";
  if (value < 60) return `${value} min`;
  return value % 60 ? `${Math.floor(value / 60)} h ${value % 60} min` : `${Math.floor(value / 60)} h`;
};

describe("Panel del administrador: Inicio (Fase A2)", () => {
  beforeEach(() => cy.intercept("GET", "**/api/v1/admin/dashboard").as("dashboard"));

  it("S07-TC-187 los 6 indicadores del Inicio coinciden con los del servidor", () => {
    login("admin");
    cy.wait("@dashboard").its("response.body.data.kpis").then((kpis) => {
      const expected = {
        "Solicitudes de hoy": String(kpis.requests_today), "Buscando técnico ahora": String(kpis.searching_now),
        "Técnicos activos y verificados": String(kpis.technicians_verified), "Tiempo medio de asignación": minutes(kpis.avg_assignment_minutes),
        "Clientes Premium": String(kpis.premium_clients), "Alertas IoT abiertas": String(kpis.iot_open_alerts),
      };
      expect(kpis.searching_now, "la siembra deja una solicitud buscando técnico").to.be.at.least(1);
      Object.entries(expected).forEach(([label, value]) => {
        cy.get(`.adm-kpi[aria-label="${label}: ${value}"]`).should("be.visible").find(".adm-kpi-value").should("have.text", value);
      });
    });
    cy.get(".panel-content h2").first().invoke("text").should("match", /^Buen(os días|as tardes|as noches)/);
  });

  it("S07-TC-188 «Tareas pendientes» muestra la solicitud sin técnico y «Revisar» lleva a su sección", () => {
    login("admin");
    cy.wait("@dashboard").its("response.body.data.tasks").then((tasks) => {
      const unassigned = tasks.find((task) => task.key === "unassigned_requests");
      expect(unassigned.count, "solicitud de 45 minutos sin técnico").to.be.at.least(1);
      cy.contains(".adm-task", `Solicitudes sin técnico hace más de ${unassigned.limit} min`).within(() => {
        cy.get(".adm-task-count").should("have.text", String(unassigned.count));
        cy.contains("button", "Revisar").click();
      });
    });
    cy.get('nav[aria-label="Administración"]').contains("button", "Alertas operativas").should("have.attr", "aria-current", "page");
  });

  it("S07-TC-189 el gráfico cambia a 30 días con su resumen y muestra el detalle del día con el teclado", () => {
    login("admin");
    cy.wait("@dashboard").its("response.body.data.series.items").then((items) => {
      const sum = (list, key) => list.reduce((total, item) => total + item[key], 0);
      const created = (list) => `${sum(list, "created")} ${sum(list, "created") === 1 ? "creada" : "creadas"}`;
      cy.contains(".adm-trend-summary", `En los últimos 7 días: ${created(items.slice(-7))}`).should("be.visible");
      cy.contains(".adm-trend button", "30 días").click().should("have.attr", "aria-pressed", "true");
      cy.contains(".adm-trend-summary", `En los últimos 30 días: ${created(items)}`).should("be.visible");
      cy.get('.adm-trend svg[role="img"]').focus().trigger("keydown", { key: "End" });
      cy.get('[role="status"][aria-label="Detalle del día"]').should("be.visible")
        .and("contain", "Creadas").and("contain", String(items.at(-1).created));
      cy.get('.adm-trend svg[role="img"]').trigger("keydown", { key: "Escape" });
      cy.get('[role="status"][aria-label="Detalle del día"]').should("not.exist");
    });
  });
});
