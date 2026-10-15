import {technician,field,image,observe} from './helpers';
describe('Técnico S2',()=>{
it('S02-TC-071 subir y publicar portafolio',()=>{technician('Portafolio');cy.contains('button','Nuevo trabajo').click();field('Título del trabajo','Trabajo '+Date.now());field('Fecha del trabajo','2026-10-01');cy.get('#field-subcategory_id option').eq(1).then(o=>cy.get('#field-subcategory_id').select(o.val()));cy.contains('label','Estado del trabajo').find('select').select('published');observe('POST','/media','media');image();cy.wait('@media').its('response.statusCode').should('eq',201);observe('POST','/technicians/me/portfolio','work');cy.contains('button','Guardar').click();cy.wait('@work').its('response.statusCode').should('eq',201);cy.contains('Cambios guardados.').should('be.visible');cy.get('.s02-card').contains('Publicado').should('be.visible')});
it('S02-TC-072 cancelar y confirmar retiro de trabajo',()=>{technician('Portafolio');let calls=0;cy.intercept('DELETE','**/api/v1/technicians/me/portfolio/*',()=>{calls++}).as('retire');cy.contains('button','Retirar trabajo').first().click();cy.get('dialog[open]').should('be.visible').contains('Cancelar').click();cy.then(()=>expect(calls).to.eq(0));cy.contains('button','Retirar trabajo').first().click();cy.get('dialog[open]').should('be.visible').contains('button','Confirmar').click();cy.wait('@retire').then(({response})=>expect(response.statusCode,JSON.stringify(response.body)).to.eq(204));cy.contains('Trabajo retirado correctamente.').should('be.visible').then(()=>expect(calls).to.eq(1))});
it('S02-TC-073 franjas solapadas y persistencia',()=>{technician('Disponibilidad y zona');cy.contains('h3','Disponibilidad, zona y pausa').should('be.visible');cy.get('.s02-panel').then($p=>{const count=$p.find('button:contains("Quitar franja")').length;for(let i=0;i<count;i++)cy.contains('button','Quitar franja').first().click()});cy.get('input[type=time]').should('not.exist');cy.contains('button','Añadir franja').click();cy.contains('button','Añadir franja').click();let calls=0;cy.intercept('PUT','**/api/v1/technicians/me/availability',()=>{calls++}).as('availability');cy.contains('button','Guardar').click();cy.contains(/solapa/).should('be.visible').then(()=>expect(calls).to.eq(0));cy.get('input[type=time]').last().clear().type('23:59');cy.get('input[type=time]').eq(-2).clear().type('23:00');cy.contains('button','Quitar franja').first().click();cy.get('input[type=time]').should('have.length',2).first().should('have.value','23:00');cy.get('input[type=time]').last().should('have.value','23:59');cy.contains('button','Guardar').click();cy.get('.s02-panel').should($p=>expect($p.find('[role=alert],.field-error').text(),'Validación de disponibilidad').to.eq(''));cy.wait('@availability').then(({request,response})=>expect(response.statusCode,JSON.stringify({request:request.body,response:response.body})).to.eq(200));cy.contains('Cambios guardados.').should('be.visible');cy.reload();cy.get('nav[aria-label="Gestión del técnico"]').contains('Disponibilidad y zona').click();cy.get('input[type=time]').last().should('have.value','23:59')});
it('S02-TC-074 tarifa inválida y actualización',()=>{technician('Servicios y tarifas');cy.get('input[inputmode=decimal]').first().clear().type('-1');let calls=0;cy.intercept('PUT','**/api/v1/technicians/me/services',()=>calls++);cy.contains('button','Guardar').click();cy.get('[role=alert]').should('be.visible').then(()=>expect(calls).to.eq(0));cy.get('input[inputmode=decimal]').first().clear().type('60.00');cy.contains('button','Guardar').click();cy.contains('Cambios guardados.').should('be.visible');cy.contains('Versión de tarifa:').should('be.visible')});
it('S02-TC-075 activar y quitar pausa',()=>{
  technician('Disponibilidad y zona');
  cy.contains('h3','Disponibilidad, zona y pausa').should('be.visible');
  observe('PUT','/technicians/me/availability','pauseSave');
  observe('GET','/technicians/me/profile','profileReload');
  cy.contains('label','Activar pausa').find('input').check();
  cy.contains('button','Guardar').click();
  cy.wait('@pauseSave').then(({response})=>expect(response.statusCode,JSON.stringify(response.body)).to.eq(200));
  cy.wait('@profileReload').its('response.body.data.availability.pause').should('not.eq',null);
  cy.contains('Hay una pausa registrada.').should('be.visible');
  cy.contains('label','Activar pausa').find('input').uncheck().should('not.be.checked');
  cy.contains('button','Guardar').click();
  cy.wait('@pauseSave').then(({request,response})=>{expect(request.body.pause).to.eq(null);expect(response.statusCode,JSON.stringify(response.body)).to.eq(200)});
  cy.wait('@profileReload').its('response.body.data.availability.pause').should('eq',null);
  cy.contains('Sin pausa registrada.').should('be.visible');
  cy.contains('Cambios guardados.').should('be.visible');
  cy.reload();
  cy.get('nav[aria-label="Gestión del técnico"]').contains('Disponibilidad y zona').click();
  cy.contains('label','Activar pausa').find('input').should('not.be.checked');
});
});
