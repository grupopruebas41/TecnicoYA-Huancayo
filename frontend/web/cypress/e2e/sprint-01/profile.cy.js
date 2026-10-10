import {api, login} from '../../support/sprint01';

it('S01-TC-073 teléfono inválido sin enviar PATCH y con alerta accesible', () => {
  login();
  let patches = 0;
  cy.intercept('PATCH', `${api}/api/v1/me`, req => {patches++; req.continue();});
  cy.get('[data-cy=profile-phone]').clear().type('064-ABC');
  cy.get('[data-cy=profile-submit]').click();
  cy.get('[data-cy=profile-phone]').should('have.attr', 'aria-invalid', 'true').and('have.attr', 'aria-describedby', 'phone-error');
  cy.get('#phone-error').should('contain', 'teléfono válido');
  cy.get('[role=alert]').should('contain', 'Revisa los campos');
  cy.then(() => expect(patches).to.eq(0));
});

it('S01-TC-074 red interrumpida: resultado incierto y consulta del estado real', () => {
  login();
  cy.get('[data-cy=profile-name]').invoke('val').then(originalName => {
    cy.intercept('PATCH', `${api}/api/v1/me`, {forceNetworkError: true}).as('uncertainSave');
    cy.intercept('GET', `${api}/api/v1/me`).as('readProfile');
    cy.get('[data-cy=profile-name]').clear().type('Edición sin confirmar');
    cy.get('[data-cy=profile-submit]').click();
    cy.wait('@uncertainSave');
    cy.wait('@readProfile').its('response.statusCode').should('eq', 200);
    cy.get('[role=alert]').should('contain', 'No pudimos confirmar el resultado');
    cy.contains('Cambios guardados correctamente').should('not.exist');
    cy.get('[data-cy=profile-name]').should('have.value', originalName);
    cy.reload();
    cy.wait('@readProfile');
    cy.get('[data-cy=profile-name]').should('have.value', originalName);
  });
});

it('S01-TC-077 sesión vencida al guardar vuelve al formulario de acceso', () => {
  login();
  cy.clearCookie(Cypress.expose('sessionCookie'), {log: false});
  cy.intercept('PATCH', `${api}/api/v1/me`).as('expiredSave');
  cy.get('[data-cy=profile-submit]').click();
  cy.wait('@expiredSave').its('response.statusCode').should('eq', 401);
  cy.get('[data-cy=login-submit]').should('be.visible');
  cy.get('[role=alert]').should('contain', 'Tu sesión venció');
  cy.location('hash').should('eq', '#cuenta');
});
