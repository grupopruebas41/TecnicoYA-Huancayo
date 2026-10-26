import React, {useEffect, useState} from 'react';
import {request} from './http';
import {Field, Notice} from './forms';

// D-75: las cuentas con nombres y apellidos los editan por separado; las anteriores conservan «Nombre completo».
const lengthOf = value => Array.from((value || '').trim()).length;
export default function ProfileForm({user, onUpdate, onExpired}) {
  const split = user.given_names != null;
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(user.name);
  const [givenNames, setGivenNames] = useState(user.given_names || '');
  const [familyNames, setFamilyNames] = useState(user.family_names || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [conflict, setConflict] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  useEffect(() => { setName(user.name); setGivenNames(user.given_names || ''); setFamilyNames(user.family_names || ''); setPhone(user.phone || ''); }, [user]);
  async function reload() {
    setBusy(true);
    try { onUpdate((await request('/me')).data); setConflict(false); setUncertain(false); setErrors({}); setError(''); setSuccess('Perfil actualizado desde el servidor.'); }
    catch (error) { setError(error.message); if ([401, 419, 403].includes(error.status)) onExpired(error); }
    finally { setBusy(false); }
  }
  async function reconcileProfile() {
    try { onUpdate((await request('/me')).data); setUncertain(false); }
    catch (error) { if ([401, 419, 403].includes(error.status)) onExpired(error); }
  }
  async function submit(event) {
    event.preventDefault();
    if (busy || uncertain) return;
    const invalid = {};
    if (split) {
      if (lengthOf(givenNames) < 2 || lengthOf(givenNames) > 50) invalid.given_names = ['Los nombres deben tener entre 2 y 50 caracteres.'];
      if (lengthOf(familyNames) < 2 || lengthOf(familyNames) > 50) invalid.family_names = ['Los apellidos deben tener entre 2 y 50 caracteres.'];
    } else if (lengthOf(name) < 2 || lengthOf(name) > 100) invalid.name = ['El nombre debe tener entre 2 y 100 caracteres.'];
    if (phone && (phone.length > 20 || !/^\+?[0-9 ()-]+$/.test(phone))) invalid.phone = ['Ingresa un teléfono válido de hasta 20 caracteres.'];
    setErrors(invalid); setError(''); setSuccess('');
    if (Object.keys(invalid).length) { setError('Revisa los campos indicados.'); event.currentTarget.elements.namedItem(Object.keys(invalid)[0])?.focus(); return; }
    setBusy(true);
    try {
      const names = split ? {given_names: givenNames.trim(), family_names: familyNames.trim()} : {name: name.trim()};
      const result = await request('/me', {...names, phone: phone || null, expected_version: user.version}, 'PATCH');
      onUpdate(result.data); setSuccess('Cambios guardados correctamente.'); setConflict(false);
    } catch (error) {
      setError(error.message); setErrors(error.fields || {}); setConflict(error.status === 409);
      if ([401, 419, 403].includes(error.status)) onExpired(error);
      if (error.status === 0) {
        setUncertain(true);
        await reconcileProfile();
      }
    } finally { setBusy(false); }
  }
  return <form className="profile-form" onSubmit={submit} noValidate aria-busy={busy}>
    <h2>Mi perfil</h2>{split ? <div className="auth-row">
      <Field name="given_names" label="Nombres" errors={errors} data-cy="profile-given-names" value={givenNames} onChange={e => setGivenNames(e.target.value)} autoComplete="given-name" maxLength={50}/>
      <Field name="family_names" label="Apellidos" errors={errors} data-cy="profile-family-names" value={familyNames} onChange={e => setFamilyNames(e.target.value)} autoComplete="family-name" maxLength={50}/>
    </div> : <Field name="name" label="Nombre completo" errors={errors} data-cy="profile-name" value={name} onChange={e => setName(e.target.value)} autoComplete="name"/>}
    <Field name="phone" label="Teléfono" errors={errors} data-cy="profile-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel"/>
    <Notice error={error} success={success}/><button type="submit" className="button primary" disabled={busy || uncertain} data-cy="profile-submit">{busy ? 'Consultando…' : 'Guardar perfil'}</button>
    {(conflict || uncertain) && <button className="button outline" type="button" disabled={busy} onClick={reload}>Recargar perfil y descartar mis cambios</button>}
  </form>;
}
