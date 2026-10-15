import React from 'react';
import {test,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {validateSubcategory,validateAnnouncement,validateSlots,validateRate,validatePause,validateUpload,technicianState} from './sprint02Validation';
import {AnnouncementPreview,ReviewForm,MutationForm} from './Sprint02Common';
import ConfirmDialog from '../../components/ConfirmDialog';
afterEach(()=>{cleanup();vi.useRealTimers()});
test('S02-TC-076 validación de subcategoría',()=>{for(const name of ['', 'a'])expect(validateSubcategory({name})).toHaveProperty('name');expect(validateSubcategory({name:'Redes'})).toHaveProperty('specialty_id');expect(validateSubcategory({name:'Redes',specialty_id:1})).toEqual({})});
test('S02-TC-077 validación de comunicado',()=>{const e=validateAnnouncement({title:'Aviso',body:'Texto',audiences:[],starts_at:'2030-01-02',ends_at:'2030-01-01',link_url:'javascript:alert(1)'});expect(e).toHaveProperty('ends_at');expect(e).toHaveProperty('audiences');expect(e).toHaveProperty('link_url')});
test('S02-TC-078 vista previa escapa HTML',()=>{const {container}=render(<AnnouncementPreview value={{title:'Aviso',body:'<img src=x onerror=alert(1)>'}}/>);expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();expect(container.querySelector('img')).toBeNull()});
test('S02-TC-079 diálogo cancela y devuelve foco',()=>{const confirm=vi.fn();function Demo(){const [open,set]=React.useState(false);return <><button onClick={()=>set(true)}>Retirar</button>{open&&<ConfirmDialog onCancel={()=>set(false)} onConfirm={confirm}/>}</>}render(<Demo/>);const trigger=screen.getByText('Retirar');trigger.focus();fireEvent.click(trigger);fireEvent.click(screen.getByText('Cancelar'));expect(confirm).not.toHaveBeenCalled();expect(trigger).toHaveFocus();fireEvent.click(trigger);fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'});expect(confirm).not.toHaveBeenCalled();expect(trigger).toHaveFocus()});
test('S02-TC-080 validación de franjas',()=>{const s=(start,end)=>({weekday:1,start,end});for(const slots of [[s('08:00','12:00'),s('11:00','14:00')],[s('12:00','08:00')],[s('08:00','08:29')]])expect(Object.keys(validateSlots(slots)).length).toBeGreaterThan(0);expect(validateSlots([s('08:00','12:00'),s('12:00','12:30')])).toEqual({})});
test('S02-TC-081 límites de tarifa',()=>{for(const n of ['0.99','5000.01','50.555'])expect(validateRate(n)).toBeTruthy();for(const n of ['1.00','5000.00'])expect(validateRate(n)).toBe('')});
test('S02-TC-082 pausa con reloj controlado',()=>{vi.useFakeTimers();vi.setSystemTime(new Date('2030-01-01T12:00:00Z'));expect(validatePause({starts_at:'2030-01-01T11:59:00Z'})).toHaveProperty('starts_at');expect(validatePause({starts_at:'2030-01-01T12:00:00Z',ends_at:'2030-01-01T11:00:00Z'})).toHaveProperty('ends_at')});
test('S02-TC-083 revisión exige motivo antes de API',async()=>{const save=vi.fn();render(<ReviewForm onSave={save}/>);fireEvent.click(screen.getByText('Rechazar'));expect(save).not.toHaveBeenCalled();fireEvent.change(screen.getByLabelText('Motivo'),{target:{value:'abcd'}});fireEvent.click(screen.getByText('Rechazar'));expect(save).not.toHaveBeenCalled();expect(screen.getByLabelText('Motivo')).toHaveAttribute('aria-invalid','true');expect(screen.getByLabelText('Motivo')).toHaveAccessibleDescription('El motivo debe tener entre 5 y 2000 caracteres.')});
test('S02-TC-086 error 500 y resultado incierto nunca dan éxito',async()=>{const reload=vi.fn();const save=vi.fn().mockRejectedValueOnce(Object.assign(new Error('Error. Referencia: prueba-500'),{status:500})).mockRejectedValueOnce(Object.assign(new Error('Resultado incierto'),{status:0}));render(<MutationForm onSave={save} reload={reload}><span>Datos conservados</span></MutationForm>);fireEvent.click(screen.getByText('Guardar'));await screen.findByText(/prueba-500/);expect(screen.queryByText('Cambios guardados.')).toBeNull();fireEvent.click(screen.getByText('Guardar'));await waitFor(()=>expect(reload).toHaveBeenCalledTimes(1));expect(screen.getByRole('alert')).toHaveTextContent(/confirmar|incierto/);expect(screen.getByText('Datos conservados')).toBeInTheDocument()});
test('S02-TC-087 estados distintos en español',()=>{expect(['pending','rejected','active','suspended'].map(technicianState)).toEqual(['Pendiente de verificación','Verificación rechazada','Activo','Suspendido'])});
test('S02-TC-088 validación de archivo',()=>{expect(validateUpload({type:'image/gif',size:100})).toBeTruthy();expect(validateUpload({type:'image/jpeg',size:5242881})).toBeTruthy();expect(validateUpload({type:'image/jpeg',size:5242880})).toBe('')});


test('S02-TC-079 complemento: diálogo nativo mantiene nombre y bloqueo de confirmación', () => {
  const cancel=vi.fn(), confirm=vi.fn();
  render(<ConfirmDialog busy onCancel={cancel} onConfirm={confirm}/>);
  const dialog=screen.getByRole('dialog', {name:'Confirmar retiro'});
  expect(dialog.tagName).toBe('DIALOG');
  expect(screen.getByRole('button', {name:'Confirmar'})).toBeDisabled();
  fireEvent.keyDown(dialog, {key:'Escape'});
  expect(cancel).not.toHaveBeenCalled();
  expect(confirm).not.toHaveBeenCalled();
});
