// Requiere el contrato de selectores y usuarios E2E descrito en la guía.
const api = 'http://127.0.0.1:8001';
const site = 'http://127.0.0.1:5174';
let fixturePassword;
before(() => cy.env(['E2E_PASSWORD'], {log: false}).then(({E2E_PASSWORD}) => {
  if (!E2E_PASSWORD) throw new Error('Falta la contraseña sintética del entorno E2E.');
  fixturePassword = E2E_PASSWORD;
}));
const password = () => fixturePassword;

function login(role) {
  cy.visit('/#cuenta');
  cy.get('[data-cy=login-email]').type(`e2e-${role}@example.test`);
  cy.get('[data-cy=login-password]').type(password(), { log: false });
  cy.get('[data-cy=login-submit]').click();
  cy.get(`[data-cy=portal-${role}]`).should('be.visible');
}

describe('Sprint 1: UI real con sesión', () => {
  it('TC-001 registra un cliente mediante formulario', () => {
    cy.intercept('POST', `${api}/api/v1/auth/register`).as('register');
    cy.visit('/#cuenta');
    cy.get('[data-cy=show-register]').click();
    cy.get('[data-cy=register-name]').type('Cliente E2E');
    cy.get('[data-cy=register-email]').type(`e2e-${crypto.randomUUID()}@example.test`);
    cy.get('[data-cy=register-account-type]').select('client');
    cy.get('[data-cy=register-client-type]').select('household');
    cy.get('[data-cy=register-password]').type(password(), { log: false });
    cy.get('[data-cy=register-password-confirmation]').type(password(), { log: false });
    cy.get('[data-cy=register-submit]').click();
    cy.wait('@register').its('response.statusCode').should('eq', 201);
    cy.get('[data-cy=register-success]').should('be.visible');
  });

  for (const role of ['client', 'technician', 'admin']) {
    it(`TC-005 inicia sesión real como ${role} y mantiene identidad al recargar`, () => {
      cy.intercept('POST', `${api}/api/v1/auth/login`).as('login');
      login(role);
      cy.wait('@login').its('response.statusCode').should('eq', 200);
      cy.request({ url: `${api}/api/v1/me`, headers: { Origin: site } })
        .its('body.data.role.code').should('eq', role);
      cy.reload();
      cy.get(`[data-cy=portal-${role}]`).should('be.visible');
      cy.get('[data-cy=logout]').click();
      cy.get('[data-cy=login-submit]').should('be.visible');
    });
  }

  it('TC-006 rechaza por HTTP la cookie de una sesión cerrada', () => {
    login('client');
    cy.getCookie('tecnicoya_sprint01_session', { log: false }).then((cookie) => {
      expect(cookie).not.to.be.null;
      cy.get('[data-cy=logout]').click();
      cy.get('[data-cy=login-submit]').should('be.visible');
      cy.clearCookies({ log: false });
      cy.request({
        url: `${api}/api/v1/me`, failOnStatusCode: false, log: false,
        headers: { Origin: site, Accept: 'application/json', Cookie: `${cookie.name}=${cookie.value}` },
      }).its('status').should('eq', 401);
    });
  });

  it('S01-SEC-CSRF rechaza un login sin token CSRF en el servidor HTTP', () => {
    cy.clearCookies({ log: false });
    cy.request({
      method: 'POST', url: `${api}/api/v1/auth/login`, failOnStatusCode: false, log: false,
      headers: { Origin: site, Accept: 'application/json' },
      body: { email: 'e2e-client@example.test', password: password() },
    }).its('status').should('eq', 419);
  });
});
