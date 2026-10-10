// Datos sintéticos suministrados por el arrancador del slot B; nunca guardar contraseñas.
export const api = Cypress.expose('apiUrl');
export function login(role = 'client') {
  cy.visit('/#cuenta');
  cy.get('[data-cy=login-email]').type(`e2e-${role}@example.test`);
  cy.env(['E2E_PASSWORD'], {log: false}).then(({E2E_PASSWORD}) => {
    expect(Boolean(E2E_PASSWORD), 'contraseña sintética configurada').to.eq(true);
    cy.get('[data-cy=login-password]').type(E2E_PASSWORD, {log: false});
  });
  cy.get('[data-cy=login-submit]').click();
  cy.get(`[data-cy=portal-${role}]`).should('be.visible');
}
