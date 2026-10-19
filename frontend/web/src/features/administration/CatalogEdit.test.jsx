import React from 'react';
import {test,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import CatalogAdmin from './CatalogAdmin';
import {request} from './http';
vi.mock('./http',()=>({request:vi.fn()}));
const catalog=[{id:1,name:'Cómputo',active:true,version:2,code:'COMPUTO',subcategories:[{id:7,name:'Redes',description:'Redes locales',reference_fee:'50.00',image_id:31,active:true,version:3}]}];
beforeEach(()=>request.mockImplementation(async(path,body,method)=>{
 if(method==='PATCH' && path==='/admin/subcategories/7' && 'specialty_id' in body) throw {status:422,message:'No está permitido modificar el campo especialidad'};
 if(body)return {data:{id:7}};
 return {data:path==='/admin/specialties'?catalog:[{id:4,name:'Huancayo',version:2,code:'HUANCAYO',active:true}]};
}));
afterEach(()=>{cleanup();vi.resetAllMocks()});
test('S02-TC-076 complemento DEF-47: PATCH conserva foto y versión sin enviar specialty_id',async()=>{
 render(<CatalogAdmin/>);await screen.findByText('Editar Cómputo');
 fireEvent.click(screen.getByText('Subcategorías'));fireEvent.click(screen.getByText('Editar Redes'));
 fireEvent.change(screen.getByLabelText('Nombre'),{target:{value:'Redes actualizadas'}});
 fireEvent.click(screen.getByText('Guardar'));
 await waitFor(()=>expect(request).toHaveBeenCalledWith('/admin/subcategories/7',expect.any(Object),'PATCH'));
 const payload=request.mock.calls.find(([path,,method])=>path==='/admin/subcategories/7'&&method==='PATCH')[1];
 expect(payload).not.toHaveProperty('specialty_id');
 expect(payload).toEqual({name:'Redes actualizadas',description:'Redes locales',reference_fee:'50.00',image_id:31,expected_version:3});
 expect(screen.getByLabelText('Especialidad')).toBeDisabled();
 expect(screen.getByLabelText('Especialidad')).toHaveValue('1');
 await screen.findByText('Cambios guardados.');
});
test('S02-TC-076 complemento DEF-47: creación exige especialidad y la envía en POST',async()=>{
 render(<CatalogAdmin/>);await screen.findByText('Editar Cómputo');
 fireEvent.click(screen.getByText('Subcategorías'));fireEvent.click(screen.getByText('Crear subcategoría'));
 fireEvent.change(screen.getByLabelText('Nombre'),{target:{value:'Impresoras'}});
 fireEvent.click(screen.getByText('Guardar'));await screen.findByText('Revisa los campos indicados.');
 expect(request.mock.calls.some(([,body])=>body)).toBe(false);
 expect(screen.getByLabelText('Especialidad')).toBeEnabled();
 fireEvent.change(screen.getByLabelText('Especialidad'),{target:{value:'1'}});
 fireEvent.click(screen.getByText('Guardar'));await screen.findByText('Cambios guardados.');
 expect(request).toHaveBeenCalledWith('/admin/subcategories',expect.objectContaining({specialty_id:1,name:'Impresoras'}),'POST');
});
for(const [tab,name,path,expected] of [
 ['Especialidades','Cómputo','/admin/specialties/1',{name:'Nombre actualizado',description:'',image_id:null,expected_version:2}],
 ['Distritos','Huancayo','/admin/districts/4',{name:'Nombre actualizado',expected_version:2}],
]) test('S02-TC-076 complemento DEF-47: edición de '+tab+' envía únicamente campos editables',async()=>{
 render(<CatalogAdmin/>);await screen.findByText('Editar Cómputo');fireEvent.click(screen.getByText(tab));
 fireEvent.click(screen.getByText('Editar '+name));fireEvent.change(screen.getByLabelText('Nombre'),{target:{value:'Nombre actualizado'}});
 fireEvent.click(screen.getByText('Guardar'));await screen.findByText('Cambios guardados.');
 expect(request).toHaveBeenCalledWith(path,expected,'PATCH');
});
