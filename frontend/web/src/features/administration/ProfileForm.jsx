import React, {useEffect, useState} from 'react';
import {request} from './http';
import {Field, Notice} from './forms';

export default function ProfileForm({user, onUpdate, onExpired}) {
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [conflict, setConflict] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  useEffect(() => { setName(user.name); setPhone(user.phone || ''); }, [user]);
  async function reload() {
    setBusy(true);
    try { onUpdate((await request('/me')).data); setConflict(false); setUncertain(false); setErrors({}); setError(''); setSuccess('Perfil actualizado desde el servidor.'); }
    catch (failure) { setError(failure.message); if ([401, 419, 403].includes(failure.status)) onExpired(failure); }
    finally { setBusy(false); }
  }
  async function submit(event) {
    event.preventDefault();
    if (busy || uncertain) return;
    const invalid = {};
    if (Array.from(name.trim()).length < 2 || Array.from(name.trim()).length > 100) invalid.name = ['El nombre debe tener entre 2 y 100 caracteres.'];
    if (phone && (phone.length > 20 || !/^\+?[0-9 ()-]+$/.test(phone))) invalid.phone = ['Ingresa un teléfono válido de hasta 20 caracteres.'];
    setErrors(invalid); setError(''); setSuccess('');
    if (Object.keys(invalid).length) { setError('Revisa los campos indicados.'); event.currentTarget.elements.namedItem(Object.keys(invalid)[0])?.focus(); return; }
    setBusy(true);
    try {
      const result = await request('/me', {name: name.trim(), phone: phone || null, expected_version: user.version}, 'PATCH');
      onUpdate(result.data); setSuccess('Cambios guardados correctamente.'); setConflict(false);
    } catch (failure) {
      setError(failure.message); setErrors(failure.fields || {}); setConflict(failure.status === 409);
      if ([401, 419, 403].includes(failure.status)) onExpired(failure);
      if (failure.status === 0) {
        setUncertain(true);
        try { onUpdate((await request('/me')).data); setUncertain(false); }
        catch (refreshFailure) { if ([401, 419, 403].includes(refreshFailure.status)) onExpired(refreshFailure); }
      }
    } finally { setBusy(false); }
  }
  return <form className="profile-form" onSubmit={submit} noValidate aria-busy={busy}>
    <h2>Mi perfil</h2><Field name="name" label="Nombre completo" errors={errors} data-cy="profile-name" value={name} onChange={e => setName(e.target.value)} autoComplete="name"/>
    <Field name="phone" label="Teléfono" errors={errors} data-cy="profile-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel"/>
    <Notice error={error} success={success}/><button type="submit" className="button primary" disabled={busy || uncertain} data-cy="profile-submit">{busy ? 'Consultando…' : 'Guardar perfil'}</button>
    {(conflict || uncertain) && <button className="button outline" type="button" disabled={busy} onClick={reload}>Recargar perfil y descartar mis cambios</button>}
  </form>;
}
