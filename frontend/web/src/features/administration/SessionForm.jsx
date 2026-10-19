import React, {useState} from 'react';
import {request} from './http';
import {Field, Notice, validateAccount, EMAIL_MAX_LENGTH} from './forms';
import './auth.css';
import {takeAuthIntent} from '../../landing/config';

export default function SessionForm({onLogin}) {
  const [intent] = useState(takeAuthIntent);
  const [register, setRegister] = useState(intent?.mode === 'register');
  const [type, setType] = useState(intent?.role || 'client');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  function changeMode() { setRegister(!register); setErrors({}); setError(''); setSuccess(''); }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    data.email = data.email.trim().toLowerCase();
    const invalid = validateAccount(data, register);
    setErrors(invalid); setSuccess(''); setError('');
    if (Object.keys(invalid).length) { setError('Revisa los campos indicados.'); form.elements.namedItem(Object.keys(invalid)[0])?.focus(); return; }
    setBusy(true);
    try {
      await request(register ? '/auth/register' : '/auth/login', data);
      form.reset();
      if (register) {
        setEmail(data.email); setRegister(false); setSuccess('Cuenta creada correctamente. Inicia sesión para continuar.');
      } else onLogin((await request('/me')).data);
    } catch (error) {
      setError(error.message); setErrors(error.fields || {});
      if (error.status === 0) {
        // Una respuesta perdida puede haber creado la sesión. Nunca reenviamos el POST.
        try { const current = await request('/me'); if (!register) onLogin(current.data, error.message); }
        catch { /* El aviso incierto permanece; no se afirma que la operación falló. */ }
      }
    }
    finally { setBusy(false); }
  }
  const prefix = register ? 'register' : 'login';
  const submitLabel = register ? 'Registrarme' : 'Ingresar';
  return <div className={`auth-shell ${register ? 'is-register' : ''}`}>
    <aside className="auth-welcome"><span className="auth-emblem" aria-hidden="true">t</span><div className="auth-welcome-copy">
      <span className="kicker">TALENTO LOCAL. CONEXIONES DE CONFIANZA.</span><h2>Tu solución<br/><em>empieza aquí.</em></h2>
      <p>Conecta con especialistas de Huancayo desde tu cuenta personal.</p>
      <button className="button auth-switch" type="button" disabled={busy} onClick={changeMode}>{register ? 'Ya tengo una cuenta' : 'Crear una cuenta'} ↗</button>
    </div><span className="auth-location">TÉCNICOYA · HUANCAYO</span></aside>
    <div className="auth-form-side"><form key={prefix} className="auth-form" onSubmit={submit} noValidate aria-busy={busy}>
      <span className="kicker">TU ESPACIO EN TÉCNICOYA</span><h1>{register ? 'Crea tu cuenta' : 'Iniciar sesión'}</h1>
      {success && <output className="notice" data-cy="register-success">{success}</output>}
      {register && <>
        <Field name="name" label="Nombre" errors={errors} data-cy="register-name" autoComplete="name"/>
        <Field name="account_type" label="Tipo de cuenta" errors={errors}><select name="account_type" data-cy="register-account-type" value={type} onChange={e => setType(e.target.value)}><option value="client">Cliente</option><option value="technician">Técnico independiente</option></select></Field>
        {type === 'client' && <Field name="client_type" label="Tipo de cliente" errors={errors}><select name="client_type" data-cy="register-client-type"><option value="household">Hogar</option><option value="mype">MYPE</option></select></Field>}
        {type === 'technician' && <p className="muted">Tu perfil quedará pendiente de verificación. Podrás completar tus datos básicos.</p>}
      </>}
      <Field name="email" label="Correo" errors={errors} type="email" maxLength={EMAIL_MAX_LENGTH} autoComplete="email" data-cy={`${prefix}-email`} value={email} onChange={e => setEmail(e.target.value)}/>
      <Field name="password" label="Contraseña" errors={errors} type="password" autoComplete={register ? 'new-password' : 'current-password'} data-cy={`${prefix}-password`}/>
      {register && <Field name="password_confirmation" label="Confirmar contraseña" errors={errors} type="password" autoComplete="new-password" data-cy="register-password-confirmation"/>}
      <Notice error={error}/><button type="submit" className="button primary submit" data-cy={`${prefix}-submit`} disabled={busy}>{busy ? 'Conectando…' : submitLabel}</button>
      <button className="text-button" type="button" data-cy={register ? 'show-login' : 'show-register'} disabled={busy} onClick={changeMode}>{register ? 'Iniciar sesión' : 'Crear una cuenta'}</button>
    </form></div>
  </div>;
}
