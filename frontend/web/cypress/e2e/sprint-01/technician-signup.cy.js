import {api} from '../../support/sprint01';
import {fillRegistration} from '../../support/registration';

it('S01-TC-072 [TC-003] registra un técnico y muestra Pendiente de verificación al ingresar', () => {
  const email = `tecnico-${crypto.randomUUID()}@example.test`;
  cy.intercept('POST', `${api}/api/v1/auth/register`).as('registerTechnician');
  cy.visit('/#cuenta');
  cy.env(['E2E_PASSWORD'], {log: false}).then(({E2E_PASSWORD}) => {
    fillRegistration({type: 'technician', email, password: E2E_PASSWORD, givenNames: 'Técnico', submit: false});
    cy.get('[data-cy=register-client-type]').should('not.exist');
    cy.get('[data-cy=register-submit]').click();
    cy.wait('@registerTechnician').then(({request, response}) => {
      expect(response.statusCode).to.eq(201);
      expect(request.body).not.to.have.property('client_type');
      expect(request.body).to.include({base_district_id: request.body.district_ids[0], experience_years: 3});
    });
    cy.get('[data-cy=register-success]').should('contain', 'Cuenta creada correctamente').and('contain', 'pendiente de verificación');
    cy.get('[data-cy=login-email]').should('have.value', email);
    cy.get('[data-cy=login-password]').type(E2E_PASSWORD, {log: false});
  });
  cy.get('[data-cy=login-submit]').click();
  cy.get('[data-cy=portal-technician]').should('contain', 'Pendiente de verificación');
  cy.location('hash').should('eq', '#cuenta/tecnico');
  cy.get('[data-cy=logout]').click();
  cy.get('[data-cy=login-submit]').should('be.visible');
});
