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
  // Fase 4 del panel final: el cliente abre Mi perfil desde el panel del avatar (pestaña Mi cuenta); los demás, desde el menú.
  cy.get('[data-cy^=portal-]').then((portal) => {
    if (portal.is('[data-cy=portal-client]')) cy.get('button[aria-label^="Cuenta de "]').click();
    else cy.get('nav[aria-label="Administración"], nav[aria-label="Mi cuenta"]').contains('button', 'Mi perfil').click();
  });
  cy.get('[data-cy=profile-submit]').should('be.visible');
}

/** Fase 4: en el portal del cliente «Cerrar sesión» está al pie del panel del avatar. */
export function logout() {
  cy.get('body').then((body) => {
    if (!body.find('[data-cy=logout]:visible').length) cy.get('button[aria-label^="Cuenta de "]').click();
  });
  cy.get('[data-cy=logout]').click();
}
