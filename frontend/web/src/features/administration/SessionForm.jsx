import React, {useEffect, useRef, useState} from 'react';
import {request} from './http';
import {Field, Notice, validateAccount, EMAIL_MAX_LENGTH} from './forms';
import {PasswordField} from './passwordFields';
import RegisterWizard from './RegisterWizard';
import {ForgotPassword} from './PasswordRecovery';
import './auth.css';
import {takeAuthIntent} from '../../landing/config';

// Duración del deslizamiento del panel (auth.css); sin animación, el foco se mueve de inmediato.
const SLIDE_MS = 600;
const media = query => window.matchMedia?.(query)?.matches;

const panels = {
  login: {kicker: 'TALENTO LOCAL. CONEXIONES DE CONFIANZA.', title: 'Tu solución', accent: 'empieza aquí.',
    text: 'Conecta con especialistas de Huancayo desde tu cuenta personal.', action: 'Crear una cuenta ↗', cy: 'show-register'},
  register: {kicker: 'BIENVENIDO DE NUEVO', title: '¿Ya tienes cuenta?', accent: 'Vuelve a tu espacio.',
    text: 'Inicia sesión para seguir tus solicitudes y servicios.', action: 'Ya tengo una cuenta ↗', cy: 'show-login'},
};
const registered = {
  client: 'Cuenta creada correctamente. Inicia sesión para continuar.',
  technician: 'Cuenta creada correctamente. Tu cuenta quedó pendiente de verificación. Sube tus documentos desde tu panel.',
};

export default function SessionForm({onLogin, connectionError = '', onRetry}) {
  const [intent] = useState(takeAuthIntent);
  const [register, setRegister] = useState(intent?.mode === 'register');
  const [forgot, setForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const formSide = useRef(null);
  const focusTimer = useRef(null);
  useEffect(() => () => clearTimeout(focusTimer.current), []);
  function focusFirstField(delay) {
    clearTimeout(focusTimer.current);
    // En móvil o con movimiento reducido no hay deslizamiento que esperar.
    const wait = delay ?? (media('(prefers-reduced-motion: reduce)') || media('(max-width: 760px)') ? 0 : SLIDE_MS);
    focusTimer.current = setTimeout(() => formSide.current?.querySelector('input, select')?.focus(), wait);
  }
  function changeMode() { setRegister(!register); setForgot(false); setErrors({}); setError(''); setSuccess(''); focusFirstField(); }
  function showForgot(open) { setForgot(open); setErrors({}); setError(''); focusFirstField(0); }
  function onRegistered(accountType, address) {
    setEmail(address); setRegister(false); setSuccess(registered[accountType]); focusFirstField();
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    data.email = data.email.trim().toLowerCase();
    const invalid = validateAccount(data, false);
    setErrors(invalid); setSuccess(''); setError('');
    if (Object.keys(invalid).length) { setError('Revisa los campos indicados.'); form.elements.namedItem(Object.keys(invalid)[0])?.focus(); return; }
    setBusy(true);
    try {
      await request('/auth/login', data);
      form.reset();
      onLogin((await request('/me')).data);
    } catch (error) {
      setError(error.message); setErrors(error.fields || {});
      if (error.status === 0) {
        // Una respuesta perdida puede haber creado la sesión. Nunca reenviamos el POST.
        try { onLogin((await request('/me')).data, error.message); }
        catch { /* El aviso incierto permanece; no se afirma que la operación falló. */ }
      }
    }
    finally { setBusy(false); }
  }
  const prefix = register ? 'register' : 'login';
  const panel = panels[prefix];
  const view = register
    ? <div key="register" className="auth-form"><span className="kicker">TU ESPACIO EN TÉCNICOYA</span><h1>Crea tu cuenta</h1>
      <RegisterWizard initialRole={intent?.mode === 'register' ? intent.role : ''} busy={busy} setBusy={setBusy} onRegistered={onRegistered}/></div>
    : forgot ? <ForgotPassword key="forgot" onBack={() => showForgot(false)}/>
    : <form key="login" className="auth-form" onSubmit={submit} noValidate aria-busy={busy}>
      <span className="kicker">TU ESPACIO EN TÉCNICOYA</span><h1>Iniciar sesión</h1>
      {success && <output className="notice" data-cy="register-success">{success}</output>}
      <Field name="email" label="Correo" errors={errors} type="email" maxLength={EMAIL_MAX_LENGTH} autoComplete="email" data-cy="login-email" value={email} onChange={e => setEmail(e.target.value)}/>
      <PasswordField name="password" label="Contraseña" toggleLabel="contraseña" errors={errors} autoComplete="current-password" data-cy="login-password"/>
      <button type="button" className="text-button auth-forgot" data-cy="show-forgot" onClick={() => showForgot(true)}>¿Olvidaste tu contraseña?</button>
      <Notice error={error}/><button type="submit" className="button primary submit" data-cy="login-submit" disabled={busy}>{busy ? 'Conectando…' : 'Ingresar'}</button>
    </form>;
  // El panel va antes del formulario en el DOM (orden de Tab de S01-TC-075); el CSS lo desliza de lado.
  return <div className={`auth-shell ${register ? 'is-register' : ''}`}>
    <aside className="auth-welcome"><span className="auth-emblem" aria-hidden="true">t</span><div className="auth-welcome-copy" key={prefix}>
      <span className="kicker">{panel.kicker}</span><h2>{panel.title}<br/><em>{panel.accent}</em></h2>
      <p>{panel.text}</p>
      <button className="button auth-switch" type="button" data-cy={panel.cy} disabled={busy} onClick={changeMode}>{panel.action}</button>
    </div><span className="auth-location">TÉCNICOYA · HUANCAYO</span></aside>
    <div className="auth-form-side" ref={formSide}>{connectionError && <div className="auth-alert" role="alert"><span className="auth-alert-icon" aria-hidden="true">!</span><p>{connectionError}</p>{onRetry && <button type="button" className="text-button" onClick={onRetry}>Reintentar conexión</button>}</div>}{view}</div>
  </div>;
}
