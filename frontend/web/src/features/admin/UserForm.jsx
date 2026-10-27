import React, {useEffect, useState} from 'react';
import {request} from '../administration/http';
import {Field, Notice} from '../administration/forms';
import {ROLE_LABELS, emptyUser, userChanges, userPayload, validateUser} from './adminRules';

function useCatalog() {
  const [catalog, setCatalog] = useState({districts: [], specialties: [], error: ''});
  useEffect(() => {
    let active = true;
    Promise.all([request('/catalog/districts'), request('/catalog/specialties')])
      .then(([districts, specialties]) => { if (active) setCatalog({districts: districts.data, specialties: specialties.data, error: ''}); })
      .catch(() => { if (active) setCatalog(current => ({...current, error: 'No pudimos cargar los distritos y especialidades. Recarga la página.'})); });
    return () => { active = false; };
  }, []);
  return catalog;
}

/** Especialidades y, por cada una marcada, sus rubros (al menos uno por especialidad, D-80). */
function TechnicianSkills({specialties, values, onChange, errors}) {
  const [rubros, setRubros] = useState({});
  function toggleSpecialty(id) {
    const chosen = values.specialty_ids.includes(id);
    if (chosen) {
      const own = (rubros[id] || []).map(item => item.id);
      onChange({specialty_ids: values.specialty_ids.filter(item => item !== id), subcategory_ids: values.subcategory_ids.filter(item => !own.includes(item))});
      return;
    }
    onChange({specialty_ids: [...values.specialty_ids, id]});
    if (!rubros[id]) request(`/catalog/subcategories?specialty_id=${id}`).then(result => setRubros(current => ({...current, [id]: result.data})))
      .catch(() => setRubros(current => ({...current, [id]: []})));
  }
  const toggleRubro = id => onChange({subcategory_ids: values.subcategory_ids.includes(id) ? values.subcategory_ids.filter(item => item !== id) : [...values.subcategory_ids, id]});
  const message = errors.specialty_ids?.[0] || errors.subcategory_ids?.[0];
  return <fieldset className="admin-fieldset" aria-describedby={message ? 'skills-error' : undefined}>
    <legend>Especialidades y rubros</legend>
    <div className="admin-checks">
      {specialties.map(specialty => <label key={specialty.id} className="admin-check">
        <input type="checkbox" checked={values.specialty_ids.includes(specialty.id)} onChange={() => toggleSpecialty(specialty.id)}/>{specialty.name}
      </label>)}
    </div>
    {values.specialty_ids.map(id => <div key={id} className="admin-rubros" role="group" aria-label={`Rubros de ${specialties.find(item => item.id === id)?.name}`}>
      {!rubros[id] ? <p className="muted">Cargando rubros…</p> : rubros[id].map(item => <label key={item.id} className="admin-check">
        <input type="checkbox" checked={values.subcategory_ids.includes(item.id)} onChange={() => toggleRubro(item.id)}/>{item.name}
      </label>)}
    </div>)}
    {message && <p id="skills-error" className="field-error">{message}</p>}
  </fieldset>;
}

/** Alta (sin contraseña: la persona la define con el enlace de activación) o edición con motivo y versión. */
export default function UserForm({user = null, profile = null, onCancel, onSaved}) {
  const editing = Boolean(user);
  const original = editing ? {
    ...emptyUser, account_type: user.role, given_names: user.given_names || '', family_names: user.family_names || '', email: user.email || '',
    phone: user.phone || '', district_id: user.district?.id ? String(user.district.id) : '',
    client_type: profile?.client_type || 'household', business_name: profile?.business_name || '', reference_address: profile?.reference_address || '',
  } : emptyUser;
  const [values, setValues] = useState(original);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const catalog = useCatalog();
  const set = changes => setValues(current => ({...current, ...changes}));
  const bind = name => ({name, value: values[name], onChange: event => set({[name]: event.target.value})});
  const type = values.account_type;

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const invalid = validateUser(values, {editing});
    setErrors(invalid); setError('');
    if (Object.keys(invalid).length) { setError('Revisa los campos indicados.'); return; }
    setBusy(true);
    try {
      if (editing) {
        const changes = userChanges(original, values);
        if (!Object.keys(changes).length) { setError('No cambiaste ningún dato.'); return; }
        await request(`/admin/users/${user.id}`, {...changes, reason: values.reason.trim(), expected_version: user.version}, 'PATCH');
        onSaved('Datos del usuario guardados.');
      } else {
        const result = await request('/admin/users', userPayload(values), 'POST');
        onSaved('Usuario creado: le enviamos el enlace de activación a su correo.', result.data);
      }
    } catch (failure) {
      setErrors(failure.fields || {});
      setError(failure.message);
      set({current_password: ''});
    } finally { setBusy(false); }
  }

  const districtOptions = placeholder => [<option key="" value="">{placeholder}</option>,
    ...catalog.districts.map(district => <option key={district.id} value={district.id}>{district.name}</option>)];
  return <form className="admin-form" noValidate aria-busy={busy} onSubmit={submit}>
    <h3>{editing ? `Editar a ${user.name}` : 'Crear usuario'}</h3>
    {!editing && <p className="muted">No se define contraseña: la persona recibe un enlace de activación por correo (vence en 72 horas) y elige la suya.</p>}
    <Notice error={catalog.error}/>
    {!editing && <fieldset className="admin-fieldset">
      <legend>Tipo de cuenta</legend>
      <div className="admin-segmented" role="radiogroup" aria-label="Tipo de cuenta">
        {Object.entries(ROLE_LABELS).map(([value, label]) => <label key={value} className={'admin-segment' + (type === value ? ' is-selected' : '')}>
          <input type="radio" name="account_type" value={value} checked={type === value} onChange={() => set({account_type: value})}/>{label}
        </label>)}
      </div>
    </fieldset>}
    <div className="admin-row">
      <Field label="Nombres" errors={errors} maxLength={50} autoComplete="off" {...bind('given_names')}/>
      <Field label="Apellidos" errors={errors} maxLength={50} autoComplete="off" {...bind('family_names')}/>
    </div>
    <div className="admin-row">
      <Field label="Correo" type="email" errors={errors} maxLength={254} autoComplete="off" {...bind('email')}/>
      <Field label="Teléfono" type="tel" inputMode="numeric" maxLength={9} placeholder="9XXXXXXXX" errors={errors} {...bind('phone')}/>
    </div>
    {type === 'client' && <>
      <div className="admin-row">
        <Field name="district_id" label="Distrito" errors={errors}><select {...bind('district_id')}>{districtOptions('Elige el distrito')}</select></Field>
        <Field name="client_type" label="Tipo de cliente" errors={errors}><select {...bind('client_type')}><option value="household">Hogar</option><option value="mype">MYPE</option></select></Field>
      </div>
      {values.client_type === 'mype' && <Field label="Razón social (opcional)" errors={errors} maxLength={180} {...bind('business_name')}/>}
      <Field label="Dirección de referencia (opcional)" errors={errors} maxLength={255} {...bind('reference_address')}/>
    </>}
    {type === 'technician' && (editing
      ? <Field name="district_id" label="Distrito base" errors={errors}><select {...bind('district_id')}>{districtOptions('Elige el distrito base')}</select></Field>
      : <>
        <div className="admin-row">
          <Field name="base_district_id" label="Distrito base" errors={errors}><select {...bind('base_district_id')}>{districtOptions('Elige el distrito base')}</select></Field>
          <Field label="Años de experiencia" type="number" min={0} max={50} step={1} inputMode="numeric" errors={errors} {...bind('experience_years')}/>
        </div>
        <TechnicianSkills specialties={catalog.specialties} values={values} onChange={set} errors={errors}/>
      </>)}
    {type === 'admin' && !editing && <Field name="current_password" label="Tu contraseña (para confirmar)" type="password" autoComplete="current-password"
      maxLength={72} errors={errors} {...bind('current_password')}/>}
    <Field name="reason" label="Motivo (queda en la auditoría)" errors={errors}><textarea rows={2} maxLength={500} {...bind('reason')}/></Field>
    <Notice error={error}/>
    <div className="admin-form-actions">
      <button type="button" className="button outline" disabled={busy} onClick={onCancel}>Cancelar</button>
      <button type="submit" className="button primary" disabled={busy}>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear y enviar activación'}</button>
    </div>
  </form>;
}
