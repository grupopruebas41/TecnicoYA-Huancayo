import React, {useState} from 'react';
import {request} from '../administration/http';
import {useResource} from '../administration/Sprint02Common';
import {validateClientDetails} from './clientRules';

const expired = error => [401, 419, 403].includes(error.status);

/**
 * D-91 (PERFIL-02): distrito principal (precarga la nueva solicitud y da el origen de la cercanía) y dirección de
 * referencia privada del cliente. Doble validación: aquí y en PATCH /me.
 */
export default function ClientDetails({user, onUpdate, onExpired}) {
  const districts = useResource('/catalog/districts');
  const [values, setValues] = useState({district_id: String(user.client_profile?.district_id ?? ''),
    reference_address: user.client_profile?.reference_address ?? ''});
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const set = name => event => { setValues({...values, [name]: event.target.value}); setSuccess(''); };
  async function submit(event) {
    event.preventDefault();
    setError(''); setSuccess('');
    const found = validateClientDetails(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const address = values.reference_address.trim();
      const result = await request('/me', {district_id: Number(values.district_id), reference_address: address || null,
        expected_version: user.version}, 'PATCH');
      onUpdate(result.data);
      setValues({...values, reference_address: address});
      setSuccess('Guardamos tus datos de cliente.');
    } catch (failure) {
      setErrors(Object.fromEntries(Object.entries(failure.fields || {}).map(([field, messages]) => [field, messages[0]])));
      if (!failure.fields || failure.status === 409) setError(failure.message);
      if (expired(failure)) onExpired(failure);
    } finally { setBusy(false); }
  }
  const field = name => ({'aria-invalid': errors[name] ? 'true' : undefined, 'aria-describedby': errors[name] ? `client-${name}-error` : undefined});
  return <form className="panel-card client-details" aria-label="Datos de cliente" onSubmit={submit} noValidate aria-busy={busy}>
    <h3>Datos de cliente</h3>
    <p className="muted">Tu distrito principal se usa para precargar tus solicitudes y ordenar a los técnicos por cercanía.</p>
    {districts.error && <p className="error" role="alert">No pudimos cargar los distritos. <button type="button" className="text-button" onClick={districts.reload}>Reintentar</button></p>}
    {!districts.data && !districts.error && <p className="muted">Cargando distritos…</p>}
    {districts.data && <label>Distrito principal
      <select name="district_id" value={values.district_id} onChange={set('district_id')} disabled={busy} {...field('district_id')}>
        <option value="">Elige un distrito</option>
        {districts.data.map(district => <option key={district.id} value={district.id}>{district.name}</option>)}
      </select>
    </label>}
    {errors.district_id && <p id="client-district_id-error" className="field-error">{errors.district_id}</p>}
    <label>Dirección de referencia (privada)
      <textarea name="reference_address" rows={2} value={values.reference_address}
        onChange={set('reference_address')} disabled={busy} {...field('reference_address')}/>
    </label>
    <small className="muted">Solo la ves tú. Al técnico asignado le llega la dirección de cada solicitud, no esta.</small>
    {errors.reference_address && <p id="client-reference_address-error" className="field-error">{errors.reference_address}</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {success && <output className="notice">{success}</output>}
    <button type="submit" className="button primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar datos de cliente'}</button>
  </form>;
}
