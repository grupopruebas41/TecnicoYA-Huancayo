describe('I0: disponibilidad del entorno', () => {
  it('sirve React', () => {
    cy.visit('/');
    cy.get('#root').should('not.be.empty');
  });

  it('conecta con la base de datos real mediante la API', () => {
    cy.request('http://localhost:8000/api/v1/health').then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body).to.deep.eq({ status: 'ok', database: 'up' });
    });
  });
});
