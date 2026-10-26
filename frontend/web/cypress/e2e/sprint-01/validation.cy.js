import {fillRegistration} from '../../support/registration';
const api = Cypress.expose('apiUrl');
const site = Cypress.config('baseUrl');
let password;
before(() => cy.env(['E2E_PASSWORD'], {log: false}).then(values => { password = values.E2E_PASSWORD; }));

function login() {
  cy.visit('/#cuenta');
  cy.get('[data-cy=login-email]').type('e2e-client@example.test');
  cy.get('[data-cy=login-password]').type(password, {log: false});
  cy.get('[data-cy=login-submit]').click();
  cy.get('[data-cy=portal-client]').should('be.visible');
}

describe('Alertas y validación del incremento Sprint 1', () => {
  it('S01-TC-023 [TC-001, TC-002]: valida el registro en cliente y muestra el rechazo del correo duplicado del servidor', () => {
    let submitted = 0;
    cy.intercept('POST', `${api}/api/v1/auth/register`, req => { submitted++; req.continue(); }).as('register');
    cy.visit('/#cuenta');
    // Registro en 2 pasos (D-80): el envío vacío del paso 2 se valida sin llamar a la API.
    cy.get('[data-cy=show-register]').click();
    cy.get('[data-cy=register-type-client]').check();
    cy.get('[data-cy=register-next]').click();
    cy.get('[data-cy=register-submit]').click();
    cy.get('[role=alert]').should('contain', 'Revisa los campos');
    cy.then(() => expect(submitted).to.eq(0));
    cy.get('[data-cy=register-back]').click();
    cy.get('[data-cy=show-login]').click();
    fillRegistration({type: 'client', email: 'e2e-client@example.test', password, givenNames: 'Cliente', familyNames: 'Duplicado'});
    cy.wait('@register').its('response.statusCode').should('eq', 422);
    cy.get('[data-cy=register-email]').should('have.attr', 'aria-invalid', 'true');
    cy.get('#email-error').should('be.visible').and('contain', 'correo');
    cy.get('[data-cy=register-success]').should('not.exist');
  });

  it('S01-TC-024 [TC-005]: muestra el error de credenciales del servidor en español', () => {
    cy.intercept('POST', `${api}/api/v1/auth/login`).as('login');
    cy.visit('/#cuenta');
    cy.get('[data-cy=login-email]').type('no-existe@example.test');
    cy.get('[data-cy=login-password]').type(password, {log: false});
    cy.get('[data-cy=login-submit]').click();
    cy.wait('@login').its('response.statusCode').should('eq', 401);
    cy.get('[role=alert]').should('contain', 'El correo o la contraseña no son válidos');
  });

  it('S01-TC-025 [TC-009, TC-010, TC-137]: valida el perfil, confirma el guardado y conserva una edición concurrente', () => {
    login();
    cy.get('[data-cy=profile-name]').clear().type('A');
    cy.get('[data-cy=profile-submit]').click();
    cy.get('#name-error').should('be.visible');
    cy.intercept('PATCH', `${api}/api/v1/me`).as('save');
    cy.get('[data-cy=profile-name]').clear().type('Cliente actualizado');
    cy.get('[data-cy=profile-submit]').click();
    cy.wait('@save').its('response.statusCode').should('eq', 200);
    cy.get('.profile-form output').should('be.visible').and('contain', 'Cambios guardados correctamente');
    // Otra pestaña guarda primero: se comprueba una carrera real, sin simular un 409.
    cy.request({url: `${api}/api/v1/me`, headers: {Origin: site}}).then(({body}) => {
      cy.getCookie('XSRF-TOKEN', {log: false}).then(cookie => {
        cy.request({method: 'PATCH', url: `${api}/api/v1/me`, log: false,
          headers: {Origin: site, 'X-XSRF-TOKEN': decodeURIComponent(cookie.value)},
          body: {name: 'Edición desde otra pestaña', expected_version: body.data.version},
        }).its('status').should('eq', 200);
      });
    });
    cy.get('[data-cy=profile-name]').clear().type('Intento obsoleto');
    cy.get('[data-cy=profile-submit]').click();
    cy.wait('@save').its('response.statusCode').should('eq', 409);
    cy.contains('button', 'Recargar perfil y descartar mis cambios').click();
    cy.get('[data-cy=profile-name]').should('have.value', 'Edición desde otra pestaña');
    cy.window().then(win => {
      // Solo el resultado booleano se registra; nunca volcamos contenido de storage ni cookies.
      const stored = JSON.stringify([win.localStorage, win.sessionStorage]);
      expect(stored.includes(password), 'sin contraseña persistida').to.eq(false);
      expect(win.localStorage.getItem('tecnicoya.api-session')).to.eq(null);
      expect(win.sessionStorage.getItem('tecnicoya.api-session')).to.eq(null);
      expect(win.document.cookie.includes(`${Cypress.expose('sessionCookie')}=`)).to.eq(false);
    });
    cy.get('[data-cy=logout]').click();
  });
});
