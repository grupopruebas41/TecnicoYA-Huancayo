import { loginClient, observe, wizard } from "../sprint-03/helpers";

// S05-TC-146 y 147 · D-95 (PEDIDO-02): el recorrido completo del pedido por especialidades con la API real, y el bloqueo con
// 3 pedidos activos. Las casillas están visualmente ocultas dentro de su tarjeta: se marcan con force.
const nueva = () => cy.get('nav[aria-label="Gestión del cliente"]').contains("button", "Nueva solicitud").click();
const siguiente = () => wizard().contains("button", "Siguiente").click();

describe("Pedido por especialidades (D-95)", () => {
  it("S05-TC-146 las 3 especialidades con varias subcategorías crean una solicitud por especialidad y aparecen en Mis solicitudes", () => {
    observe("POST", "/orders", "pedido");
    loginClient();
    nueva();
    wizard().find("input[name=specialty_ids]").should("have.length", 3).check({ force: true });
    siguiente();
    wizard().contains("h2", "Paso 2").should("be.visible");
    wizard().find("section.order-group").should("have.length", 3).each((group) => {
      cy.wrap(group).find("input[name=subcategory_ids]").should("have.length.greaterThan", 1);
      cy.wrap(group).find("input[name=subcategory_ids]").eq(0).check({ force: true });
      cy.wrap(group).find("input[name=subcategory_ids]").eq(1).check({ force: true });
    });
    wizard().find("input[name=subcategory_ids]:disabled").should("not.exist");
    wizard().find(".order-live").invoke("text").should("match", /^3 especialidades · 6 trabajos: /);
    siguiente();

    wizard().contains("h2", "Paso 3").should("be.visible");
    wizard().find("[role=tab]").should("have.length", 3);
    wizard().find("textarea[name=description]").type("El equipo falla desde ayer y necesito una revisión.");
    wizard().contains("label", "Usar la misma descripción para todas").find("input").check();
    siguiente();

    wizard().contains("h2", "Paso 4").should("be.visible");
    wizard().find("select[name=district_id]").select(1);
    wizard().find("input[name=address]").type("Jr. Sintético 742");
    siguiente();

    wizard().contains("h2", "Paso 5").should("be.visible");
    wizard().find("[role=note]").should("contain", "Se crearán 3 solicitudes, una por especialidad.");
    wizard().find(".order-summary-subcategories").should("have.length", 3);
    wizard().find("input[name=confirmed]").check();
    wizard().contains("button", "Enviar pedido").click();

    cy.wait("@pedido").then(({ response }) => {
      expect(response.statusCode).to.eq(201);
      expect(response.body.data.requests).to.have.length(3);
      response.body.data.requests.forEach((request) => expect(request.subcategories).to.have.length(2));
    });
    wizard().contains("h2", "Pedido enviado").should("be.visible");
    wizard().contains("button", "Ir a Mis solicitudes").click();
    cy.get('[aria-label^="Pedido #"]').should("contain", "3 solicitudes");
  });

  it("S05-TC-147 con 3 pedidos activos el asistente bloquea y lleva a Mis solicitudes", () => {
    loginClient("limit");
    nueva();
    wizard().contains("h2", "Ya tienes 3 pedidos activos").should("be.visible");
    wizard().find("input[name=specialty_ids]").should("not.exist");
    wizard().contains("button", "Ver Mis solicitudes").click();
    cy.get('[aria-label="Mis solicitudes"]').should("be.visible");
  });
});
