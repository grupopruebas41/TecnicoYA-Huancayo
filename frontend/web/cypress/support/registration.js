// Registro en 2 pasos (D-80): paso 1 elige el tipo de cuenta y paso 2 pide los datos para el matching.
// Los distritos y especialidades vienen de los seeders E2E (DistrictSeeder y CatalogSeeder).
export function fillRegistration({type = 'client', email, password, givenNames = 'Persona', familyNames = 'Sintética E2E', submit = true}) {
  cy.get('[data-cy=show-register]').click();
  cy.get(`[data-cy=register-type-${type}]`).check();
  cy.get('[data-cy=register-next]').click();
  cy.get('[data-cy=register-given-names]').type(givenNames);
  cy.get('[data-cy=register-family-names]').type(familyNames);
  cy.get('[data-cy=register-email]').type(email);
  cy.get('[data-cy=register-phone]').type('987654321');
  if (type === 'technician') {
    cy.get('[data-cy=register-base-district]').select('Huancayo');
    cy.get('[data-cy=register-experience]').type('3');
    cy.get('[data-cy=register-specialty-computo]').check();
    // Al menos un rubro por especialidad: el primero del panel desplegado.
    cy.get('[data-cy^=register-subcategory-]').first().check();
  } else {
    cy.get('[data-cy=register-district]').select('Huancayo');
  }
  cy.get('[data-cy=register-password]').type(password, {log: false});
  cy.get('[data-cy=register-password-confirmation]').type(password, {log: false});
  cy.get('[data-cy=register-terms]').check();
  if (submit) cy.get('[data-cy=register-submit]').click();
}
