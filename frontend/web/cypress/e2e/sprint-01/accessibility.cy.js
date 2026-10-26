import {api} from '../../support/sprint01';

function pressEnter() {
  if (Cypress.browser.family !== 'chromium') return cy.press(Cypress.Keyboard.Keys.ENTER);
  // Cypress 16.1.1 omite keyCode/text para teclas nombradas en CDP.
  // Chrome necesita el Enter completo para la activación nativa del botón.
  // No llama click(), submit() ni modifica el DOM o la respuesta del servidor.
  return cy.then(() => Cypress.automation('remote:debugger:protocol', {
    command: 'Input.dispatchKeyEvent',
    params: {type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r', unmodifiedText: '\r'},
  })).then(() => Cypress.automation('remote:debugger:protocol', {
    command: 'Input.dispatchKeyEvent',
    params: {type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13},
  }));
}

function focusOn(selector) {
  cy.focused().should('match', selector).and('be.visible').and('have.css', 'outline-style', 'solid');
  cy.focused().should($element => expect(parseFloat($element.css('outline-width'))).to.be.greaterThan(0));
}
it('S01-TC-075 registro por teclado: Tab, foco visible y envío con Enter', () => {
  cy.intercept('POST', `${api}/api/v1/auth/register`).as('keyboardRegister');
  cy.visit('/#cuenta');
  cy.get('[data-cy=login-submit]').should('be.visible');
  // Establece el punto inicial; desde aquí solo Tab/Enter y escritura, sin clics.
  cy.get('.account-page .brand').focus();
  cy.press(Cypress.Keyboard.Keys.TAB); // Volver al inicio.
  cy.press(Cypress.Keyboard.Keys.TAB); // Crear una cuenta.
  focusOn('.auth-switch');
  const activations = [];
  cy.focused().then($button => $button[0].addEventListener('click', event => activations.push(event.isTrusted), {once: true}));
  pressEnter();
  // Enter cambia de formulario: esperar el render observable antes del siguiente Tab.
  cy.get('[data-cy=register-name]').should('be.visible');
  cy.then(() => expect(activations, 'activación nativa por teclado').to.deep.eq([true]));
  // Al terminar el deslizamiento del panel (600 ms) el foco pasa solo al primer campo del registro.
  focusOn('[data-cy=register-name]'); cy.focused().type('Cliente teclado');
  cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[data-cy=register-account-type]');
  cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[data-cy=register-client-type]');
  cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[data-cy=register-email]');
  cy.focused().type(`teclado-${crypto.randomUUID()}@example.test`);
  cy.env(['E2E_PASSWORD'], {log: false}).then(({E2E_PASSWORD}) => {
    cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[data-cy=register-password]'); cy.focused().type(E2E_PASSWORD, {log: false});
    // Cada contraseña tiene después su botón Mostrar/Ocultar, también alcanzable con Tab.
    cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[aria-label="Mostrar contraseña"]');
    cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[data-cy=register-password-confirmation]'); cy.focused().type(E2E_PASSWORD, {log: false});
    cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[aria-label="Mostrar confirmación de contraseña"]');
  });
  cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[data-cy=register-submit]');
  pressEnter();
  cy.wait('@keyboardRegister').its('response.statusCode').should('eq', 201);
  cy.get('[data-cy=register-success]').should('contain', 'Cuenta creada correctamente');
});
