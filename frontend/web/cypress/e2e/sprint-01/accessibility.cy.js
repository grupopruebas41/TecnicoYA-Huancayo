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

function pressSpace() {
  if (Cypress.browser.family !== 'chromium') return cy.press(Cypress.Keyboard.Keys.SPACE);
  // Igual que pressEnter: la tecla completa por CDP marca radios y casillas de forma nativa.
  return cy.then(() => Cypress.automation('remote:debugger:protocol', {
    command: 'Input.dispatchKeyEvent',
    params: {type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, text: ' ', unmodifiedText: ' '},
  })).then(() => Cypress.automation('remote:debugger:protocol', {
    command: 'Input.dispatchKeyEvent',
    params: {type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32},
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
  // Registro en 2 pasos (D-80). Enter cambia de modo: tras el deslizamiento (600 ms) el foco llega a la primera tarjeta.
  cy.get('[data-cy=register-type-client]').should('exist');
  cy.then(() => expect(activations, 'activación nativa por teclado').to.deep.eq([true]));
  cy.focused().should('match', '[data-cy=register-type-client]');
  // El radio es invisible: el foco visible lo dibuja su tarjeta.
  cy.get('.register-role:focus-within').should('have.css', 'outline-style', 'solid');
  pressSpace();
  cy.get('[data-cy=register-type-client]').should('be.checked');
  cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[data-cy=register-next]');
  pressEnter();
  focusOn('[data-cy=register-given-names]'); cy.focused().type('Cliente');
  cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[data-cy=register-family-names]'); cy.focused().type('Teclado');
  cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[data-cy=register-email]');
  cy.focused().type(`teclado-${crypto.randomUUID()}@example.test`);
  cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[data-cy=register-phone]'); cy.focused().type('987654321');
  // cy.type() no escribe en un select: se elige la opción sobre el elemento enfocado, sin clic.
  cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[data-cy=register-district]'); cy.focused().select('Huancayo');
  cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[data-cy=register-client-type]');
  cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[data-cy=register-reference-address]');
  cy.env(['E2E_PASSWORD'], {log: false}).then(({E2E_PASSWORD}) => {
    cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[data-cy=register-password]'); cy.focused().type(E2E_PASSWORD, {log: false});
    // Cada contraseña tiene después su botón Mostrar/Ocultar, también alcanzable con Tab.
    cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[aria-label="Mostrar contraseña"]');
    cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[data-cy=register-password-confirmation]'); cy.focused().type(E2E_PASSWORD, {log: false});
    cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[aria-label="Mostrar confirmación de contraseña"]');
  });
  cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[data-cy=register-terms]'); pressSpace();
  cy.get('[data-cy=register-terms]').should('be.checked');
  cy.press(Cypress.Keyboard.Keys.TAB); focusOn('.register-terms .text-button'); // Leer Términos y Privacidad.
  cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[data-cy=register-back]');
  cy.press(Cypress.Keyboard.Keys.TAB); focusOn('[data-cy=register-submit]');
  pressEnter();
  cy.wait('@keyboardRegister').its('response.statusCode').should('eq', 201);
  cy.get('[data-cy=register-success]').should('contain', 'Cuenta creada correctamente');
});
