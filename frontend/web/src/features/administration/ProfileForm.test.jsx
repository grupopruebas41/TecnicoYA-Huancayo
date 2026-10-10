import React from 'react';
import {afterEach, expect, test, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import ProfileForm from './ProfileForm';
import {request} from './http';
vi.mock('./http', () => ({request: vi.fn()}));
afterEach(() => {cleanup(); vi.resetAllMocks();});
const user = {name: 'Cliente sintético', phone: null, version: 2};
const submit = () => fireEvent.click(screen.getByRole('button', {name: 'Guardar perfil'}));

test.each(['1'.repeat(21), '064-ABC'])('S01-TC-081 teléfono inválido sin petición: %s', phone => {
  render(<ProfileForm user={user} onUpdate={vi.fn()} onExpired={vi.fn()}/>);
  fireEvent.change(screen.getByLabelText('Teléfono'), {target: {value: phone}});
  submit();
  expect(screen.getByLabelText('Teléfono')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos');
  expect(request).not.toHaveBeenCalled();
});
test('S01-TC-025 [TC-009, TC-010, TC-137] complemento unitario: PATCH versionado, éxito confirmado, conflicto y recarga explícita', async () => {
  const onUpdate = vi.fn();
  request.mockResolvedValueOnce({data: {...user, version: 3}})
    .mockRejectedValueOnce({status: 409, message: 'La información cambió.'})
    .mockResolvedValueOnce({data: {...user, version: 4}});
  render(<ProfileForm user={user} onUpdate={onUpdate} onExpired={vi.fn()}/>);
  submit();
  await screen.findByText('Cambios guardados correctamente.');
  expect(request).toHaveBeenCalledWith('/me', {name: user.name, phone: null, expected_version: 2}, 'PATCH');
  submit();
  await screen.findByRole('alert');
  expect(screen.queryByText('Cambios guardados correctamente.')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Recargar perfil y descartar mis cambios'}));
  await waitFor(() => expect(onUpdate).toHaveBeenLastCalledWith({...user, version: 4}));
});
test('S01-TC-074 complemento unitario: resultado incierto consulta identidad, sin repetir PATCH ni afirmar éxito', async () => {
  const onUpdate = vi.fn();
  request.mockRejectedValueOnce({status: 0, message: 'No pudimos confirmar el resultado.'})
    .mockResolvedValueOnce({data: {...user, version: 3}});
  render(<ProfileForm user={user} onUpdate={onUpdate} onExpired={vi.fn()}/>);
  submit();
  await waitFor(() => expect(request).toHaveBeenLastCalledWith('/me'));
  expect(onUpdate).toHaveBeenCalledWith({...user, version: 3});
  expect(screen.getByRole('alert')).toHaveTextContent('No pudimos confirmar');
  expect(screen.queryByText('Cambios guardados correctamente.')).not.toBeInTheDocument();
});
test('S01-TC-077 complemento unitario: sesión caducada y nombre inválido no producen falso éxito', async () => {
  const onExpired = vi.fn();
  request.mockRejectedValue({status: 401, message: 'Tu sesión venció.'});
  render(<ProfileForm user={user} onUpdate={vi.fn()} onExpired={onExpired}/>);
  fireEvent.change(screen.getByLabelText('Nombre completo'), {target: {value: 'A'}});
  submit();
  expect(request).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Nombre completo'), {target: {value: 'Nombre válido'}});
  submit();
  await waitFor(() => expect(onExpired).toHaveBeenCalledOnce());
});
