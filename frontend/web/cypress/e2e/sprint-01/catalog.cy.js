const api = 'http://127.0.0.1:8001';

describe('Sprint 1: catálogo', () => {
  it('TC-012 muestra el catálogo real servido por Laravel/MySQL', () => {
    cy.intercept('GET', `${api}/api/v1/catalog/specialties*`).as('specialties');
    cy.intercept('GET', `${api}/api/v1/catalog/subcategories*`).as('subcategories');
    cy.visit('/#catalogo');
    cy.wait('@specialties').then(({ response }) => {
      expect(response.statusCode).to.eq(200);
      expect(response.body.data).to.have.length(3);
      for (const item of response.body.data) {
        cy.get('[data-cy=specialty-select]').find(`option[value="${item.id}"]`).should('contain', item.name);
      }
      cy.get('[data-cy=specialty-select]').select(String(response.body.data[0].id));
    });
    cy.wait('@subcategories').then(({ response }) => {
      expect(response.statusCode).to.eq(200);
      expect(response.body.data.length).to.be.greaterThan(0);
      for (const item of response.body.data) {
        cy.get('[data-cy=subcategory-list]').should('contain', item.name);
      }
    });
  });

  it('TC-012 informa un fallo realista sin inventar catálogo', () => {
    // Variante de fallo controlado; la variante anterior no sustituye la API.
    cy.intercept('GET', `${api}/api/v1/catalog/specialties*`, { forceNetworkError: true }).as('failed');
    cy.visit('/#catalogo');
    cy.wait('@failed');
    cy.get('[data-cy=catalog-error]').should('be.visible');
    cy.get('[data-cy=subcategory-list]').should('not.exist');
  });
});
