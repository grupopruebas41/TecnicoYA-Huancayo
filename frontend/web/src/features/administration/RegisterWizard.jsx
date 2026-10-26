import React, {useEffect, useRef, useState} from 'react';
import {request} from './http';
import {Field, EMAIL_MAX_LENGTH} from './forms';
import {PasswordField, PasswordMeter} from './passwordFields';
import {emptyRegistration, registrationPayload, validateRegistration} from './registration';
import {legalTexts} from '../../landing/Shared';

const roles = [
  ['client', 'Necesito un técnico', 'Para tu hogar o tu negocio.', '⌂'],
  ['technician', 'Soy técnico', 'Recibe trabajos cerca de ti.', '⚒'],
];

function TermsDialog({onClose}) {
  const close = useRef(null);
  useEffect(() => { close.current?.focus(); }, []);
  return <div className="auth-dialog-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="terms-title"
      onKeyDown={event => { if (event.key === 'Escape') onClose(); if (event.key === 'Tab') { event.preventDefault(); close.current?.focus(); } }}>
      <h2 id="terms-title">Términos y Privacidad</h2>
      {Object.values(legalTexts).map(([title, body]) => <section key={title}><h3>{title}</h3><p>{body}</p></section>)}
      <button ref={close} type="button" className="button outline" onClick={onClose}>Cerrar</button>
    </div>
  </div>;
}

function ChoiceGroup({legend, name, items, selected, locked, onToggle, errors, cy}) {
  const message = errors[name]?.[0];
  return <fieldset className="register-choices" aria-describedby={message ? `${name}-error` : undefined}>
    <legend>{legend}</legend>
    <div>{items.map(item => <label key={item.id} className="register-chip">
      <input type="checkbox" data-cy={`${cy}-${item.code}`} checked={selected.includes(String(item.id)) || locked === String(item.id)}
        disabled={locked === String(item.id)} onChange={() => onToggle(String(item.id))}/>
      <span>{item.name}</span>
    </label>)}</div>
    {message && <span className="field-error" id={`${name}-error`}>{message}</span>}
  </fieldset>;
}

/**
 * D-80: registro en 2 pasos. El paso 1 elige el tipo de cuenta; el paso 2 pide los datos que usa el matching
 * por cercanía (D-63 y D-64). Volver al paso 1 no borra nada.
 */
export default function RegisterWizard({initialRole = '', busy, setBusy, onRegistered}) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState({...emptyRegistration, account_type: initialRole});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState({districts: [], specialties: [], failed: false});
  const [terms, setTerms] = useState(false);
  const [reload, setReload] = useState(0);
  const form = useRef(null);
  const technician = values.account_type === 'technician';
  useEffect(() => {
    let active = true;
    Promise.all([request('/catalog/districts'), request('/catalog/specialties')])
      .then(([districts, specialties]) => { if (active) setCatalog({districts: districts.data, specialties: specialties.data, failed: false}); })
      .catch(() => { if (active) setCatalog(current => ({...current, failed: true})); });
    return () => { active = false; };
  }, [reload]);
  const local = validateRegistration(values);
  const visible = Object.fromEntries(Object.entries(local).filter(([name]) => submitted || touched[name]));
  const errors = {...visible, ...serverErrors};
  function set(name, value) {
    setValues(current => ({...current, [name]: value}));
    setServerErrors(current => { const next = {...current}; delete next[name]; return next; });
  }
  const bind = name => ({name, value: values[name], onChange: event => set(name, event.target.value),
    onBlur: () => setTouched(current => ({...current, [name]: true}))});
  const toggle = name => id => {
    setTouched(current => ({...current, [name]: true}));
    set(name, values[name].includes(id) ? values[name].filter(item => item !== id) : [...values[name], id]);
  };
  function next() { setStep(2); setError(''); setTimeout(() => form.current?.querySelector('input')?.focus(), 0); }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setSubmitted(true); setError('');
    const invalid = Object.keys(local);
    if (invalid.length) {
      setError('Revisa los campos indicados.');
      form.current?.querySelector(`[name="${invalid[0]}"], [aria-describedby="${invalid[0]}-error"] input`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await request('/auth/register', registrationPayload(values));
      onRegistered(values.account_type, values.email.trim().toLowerCase());
    } catch (failure) {
      setError(failure.message || 'No se pudo crear la cuenta.'); setServerErrors(failure.fields || {});
    } finally { setBusy(false); }
  }
  const progress = <p className="register-progress"><span>Paso {step} de 2</span><span className="register-progress-bar" aria-hidden="true"><span style={{width: step === 1 ? '50%' : '100%'}}/></span></p>;
  if (step === 1) return <div className="register-step">
    {progress}
    <h2>¿Quién eres?</h2>
    <div className="register-roles" role="radiogroup" aria-label="Tipo de cuenta">
      {roles.map(([value, title, text, icon]) => <label key={value} className={'register-role' + (values.account_type === value ? ' is-selected' : '')}>
        <input type="radio" name="account_type" value={value} data-cy={`register-type-${value}`} checked={values.account_type === value} onChange={() => set('account_type', value)}/>
        <span className="register-role-icon" aria-hidden="true">{icon}</span>
        <strong>{title}</strong><small>{text}</small>
      </label>)}
    </div>
    {values.account_type === 'technician' && <p className="muted register-note">Tu perfil quedará pendiente de verificación hasta que administración revise tus documentos.</p>}
    <button type="button" className="button primary submit" data-cy="register-next" disabled={!values.account_type} onClick={next}>Continuar</button>
  </div>;
  const districtOptions = placeholder => [<option key="" value="">{placeholder}</option>,
    ...catalog.districts.map(district => <option key={district.id} value={district.id}>{district.name}</option>)];
  return <form ref={form} className="register-step" onSubmit={submit} noValidate aria-busy={busy}>
    {progress}
    <h2>Tus datos</h2>
    {catalog.failed && <p className="error" role="alert">No pudimos cargar distritos y especialidades. <button type="button" className="text-button" onClick={() => setReload(reload + 1)}>Reintentar</button></p>}
    <div className="auth-row">
      <Field label="Nombres" errors={errors} data-cy="register-given-names" autoComplete="given-name" maxLength={50} {...bind('given_names')}/>
      <Field label="Apellidos" errors={errors} data-cy="register-family-names" autoComplete="family-name" maxLength={50} {...bind('family_names')}/>
    </div>
    <div className="auth-row">
      <Field label="Correo" errors={errors} type="email" data-cy="register-email" autoComplete="email" maxLength={EMAIL_MAX_LENGTH} {...bind('email')}/>
      <Field label="Teléfono" errors={errors} type="tel" inputMode="numeric" data-cy="register-phone" autoComplete="tel-national" maxLength={9} placeholder="9XXXXXXXX" {...bind('phone')}/>
    </div>
    {technician ? <>
      <div className="auth-row">
        <Field name="base_district_id" label="Distrito base" errors={errors}><select data-cy="register-base-district" {...bind('base_district_id')}>{districtOptions('Elige tu distrito base')}</select></Field>
        <Field label="Años de experiencia" errors={errors} type="number" min={0} max={50} step={1} inputMode="numeric" data-cy="register-experience" {...bind('experience_years')}/>
      </div>
      <ChoiceGroup legend="Distritos que atiendes" name="district_ids" items={catalog.districts} selected={values.district_ids}
        locked={values.base_district_id} onToggle={toggle('district_ids')} errors={errors} cy="register-district"/>
      <ChoiceGroup legend="Especialidades que ofreces" name="specialty_ids" items={catalog.specialties} selected={values.specialty_ids}
        onToggle={toggle('specialty_ids')} errors={errors} cy="register-specialty"/>
      <Field label="WhatsApp (opcional)" errors={errors} type="tel" inputMode="numeric" data-cy="register-whatsapp" maxLength={9} placeholder="9XXXXXXXX" {...bind('whatsapp')}/>
    </> : <>
      <div className="auth-row">
        <Field name="district_id" label="Distrito principal" errors={errors}><select data-cy="register-district" {...bind('district_id')}>{districtOptions('Elige tu distrito')}</select></Field>
        <Field name="client_type" label="Tipo de cliente" errors={errors}><select data-cy="register-client-type" {...bind('client_type')}><option value="household">Hogar</option><option value="mype">MYPE</option></select></Field>
      </div>
      {values.client_type === 'mype' && <Field label="Razón social (opcional)" errors={errors} data-cy="register-business-name" maxLength={180} autoComplete="organization" {...bind('business_name')}/>}
      <Field label="Dirección de referencia (opcional)" errors={errors} data-cy="register-reference-address" maxLength={255} autoComplete="street-address" {...bind('reference_address')}/>
      <p className="muted register-note">Tu dirección es privada: solo la verá el técnico asignado a tu atención.</p>
    </>}
    <div className="auth-row">
      <PasswordField label="Contraseña" toggleLabel="contraseña" errors={errors} autoComplete="new-password" data-cy="register-password" {...bind('password')}/>
      <PasswordField label="Confirmar contraseña" toggleLabel="confirmación de contraseña" errors={errors} autoComplete="new-password" data-cy="register-password-confirmation" {...bind('password_confirmation')}/>
    </div>
    <PasswordMeter password={values.password}/>
    <div className="register-terms">
      <label className="checkbox-label"><input type="checkbox" name="terms_accepted" data-cy="register-terms" checked={values.terms_accepted}
        aria-invalid={!!errors.terms_accepted} aria-describedby={errors.terms_accepted ? 'terms_accepted-error' : undefined}
        onChange={event => set('terms_accepted', event.target.checked)}/> Acepto los Términos y la Privacidad</label>
      <button type="button" className="text-button" onClick={() => setTerms(true)}>Leer Términos y Privacidad</button>
      {errors.terms_accepted && <span className="field-error" id="terms_accepted-error">{errors.terms_accepted[0]}</span>}
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="register-actions">
      <button type="button" className="button outline" data-cy="register-back" disabled={busy} onClick={() => { setStep(1); setError(''); }}>Atrás</button>
      <button type="submit" className="button primary submit" data-cy="register-submit" disabled={busy}>{busy ? 'Creando…' : 'Crear cuenta'}</button>
    </div>
    {terms && <TermsDialog onClose={() => setTerms(false)}/>}
  </form>;
}
