import React, {useEffect, useState} from 'react';
import {request} from './http';
import SessionForm from './SessionForm';
import ProfileForm from './ProfileForm';
import {Notice} from './forms';
import './account.css';
import {permissionLabel, verificationLabel} from './labels';

const roles = {client: 'Cliente', technician: 'Especialista técnico', admin: 'Administrador'};
const routes = {client: '#cuenta/cliente', technician: '#cuenta/tecnico', admin: '#cuenta/administrador'};
export default function AccountApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setBlocked(false);
    request('/me').then(result => { if (active) setUser(result.data); }).catch(failure => {
      if (!active) return;
      setUser(null); setBlocked(failure.status === 403);
      if (failure.status !== 401) setError(failure.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  useEffect(() => {
    if (loading) return;
    // El servidor decide el rol. Cambiar el hash nunca concede permisos.
    const redirect = () => {
      const hash = window.location.hash;
      if (hash === '#cuenta' || hash === '#plataforma' || hash.startsWith('#cuenta/')) {
        const destination = routes[user?.role?.code] || '#cuenta';
        if (hash !== destination) window.location.replace(destination);
      }
    };
    redirect(); window.addEventListener('hashchange', redirect);
    return () => window.removeEventListener('hashchange', redirect);
  }, [user, loading]);
  function clearSession() { setUser(null); setBlocked(false); }
  async function logout() {
    if (busy) return;
    setBusy(true); setError('');
    try { await request('/auth/logout', undefined, 'POST'); clearSession(); }
    catch (failure) {
      if (failure.status === 401) clearSession();
      else {
        setError(failure.message);
        if (failure.status === 0) {
          try { setUser((await request('/me')).data); }
          catch (refreshFailure) { if (refreshFailure.status === 401) clearSession(); }
        }
      }
    } finally { setBusy(false); }
  }
  if (loading) return <section className="session-page" role="status">Comprobando tu sesión…</section>;
  if (blocked) return <section className="session-page"><Notice error={error}/><button type="button" className="button primary" disabled={busy} onClick={logout}>Cerrar sesión</button></section>;
  if (!user) return <section className="session-page"><Notice error={error}/>{error && <button type="button" className="button outline" onClick={() => setReload(reload + 1)}>Reintentar conexión</button>}<SessionForm onLogin={(value, warning = '') => { setUser(value); setError(warning); }}/></section>;
  const role = user.role?.code;
  if (!roles[role]) return <section className="session-page"><Notice error="Tu cuenta no tiene un rol habilitado."/><Notice error={error}/><button type="button" className="button primary" disabled={busy} onClick={logout}>Cerrar sesión</button></section>;
  return <section className="session-page" data-cy={'portal-' + role}>
    <div className="session-heading"><div><span className="kicker">{roles[role]}</span><h1>Hola, <em>{user.name}</em></h1><p>Tu cuenta, tus datos y tu acceso en un solo lugar.</p></div><button type="button" className="button outline" data-cy="logout" disabled={busy} onClick={logout}>Cerrar sesión</button></div>
    <Notice error={error}/>{role === 'technician' && <p className="notice">Estado de verificación: {verificationLabel(user.technician_profile?.verification_status)}. La disponibilidad se habilita después de la revisión.</p>}
    <div className="session-grid"><ProfileForm key={user.id} user={user} onUpdate={setUser} onExpired={failure => { clearSession(); setBlocked(failure.status === 403); setError(failure.status === 403 ? failure.message : 'Tu sesión venció. Inicia sesión nuevamente.'); }}/>
      <aside className="session-details"><h2>Tu acceso</h2><p>{roles[role]}</p>{user.permissions?.length ? <ul>{user.permissions.map(code => <li key={code}>{permissionLabel(code)}</li>)}</ul> : <p>Acceso a tu perfil personal.</p>}<a className="button glass" href="#catalogo">Explorar especialidades ↗</a></aside></div>
  </section>;
}
