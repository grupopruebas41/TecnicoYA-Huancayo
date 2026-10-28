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
// Fase 1 del panel (D-73): los datos de la cuenta viven en la sección «Mi perfil» del menú lateral.
export function openProfile() {
  // D-87: el panel del cliente nombra su menú «Gestión del cliente» (el mismo que usan las E2E del S3 y del S4).
  cy.get('nav[aria-label="Administración"], nav[aria-label="Mi cuenta"], nav[aria-label="Gestión del cliente"]').contains('button', 'Mi perfil').click();
  cy.get('[data-cy=profile-submit]').should('be.visible');
}
