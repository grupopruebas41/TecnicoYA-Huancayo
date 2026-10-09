import React, {useEffect, useState} from 'react';
import {request} from './http';
import SessionForm from './SessionForm';
import ProfileForm from './ProfileForm';
import {Notice} from './forms';
import './account.css';
import {permissionLabel, verificationLabel} from './labels';

const roles = {client: 'Cliente', technician: 'Especialista técnico', admin: 'Administrador'};
export default function AccountApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    request('/me').then(result => { if (active) setUser(result.data); }).catch(failure => {
      if (active && failure.status !== 401) setError(failure.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  async function logout() {
    setBusy(true); setError('');
    try { await request('/auth/logout', undefined, 'POST'); setUser(null); }
    catch (failure) { if (failure.status === 401) setUser(null); else setError(failure.message); }
    finally { setBusy(false); }
  }
  if (loading) return <section className="session-page" role="status">Comprobando tu sesión…</section>;
  if (!user) return <section className="session-page"><Notice error={error}/>{error && <button className="button outline" onClick={() => setReload(reload + 1)}>Reintentar conexión</button>}<SessionForm onLogin={value => { setUser(value); setError(''); }}/></section>;
  const role = user.role?.code;
  if (!roles[role]) return <section className="session-page"><Notice error="Tu cuenta no tiene un rol habilitado."/><button className="button primary" onClick={logout}>Cerrar sesión</button></section>;
  return <section className="session-page" data-cy={`portal-${role}`}>
    <div className="session-heading"><div><span className="kicker">{roles[role]}</span><h1>Hola, <em>{user.name}</em></h1><p>Tu cuenta, tus datos y tu acceso en un solo lugar.</p></div><button className="button outline" data-cy="logout" disabled={busy} onClick={logout}>Cerrar sesión</button></div>
    <Notice error={error}/>{role === 'technician' && <p className="notice">Estado de verificación: {verificationLabel(user.technician_profile?.verification_status)}. La disponibilidad se habilita después de la revisión.</p>}
    <div className="session-grid"><ProfileForm user={user} onUpdate={setUser} onExpired={() => { setUser(null); setError('Tu sesión venció. Inicia sesión nuevamente.'); }}/>
      <aside className="session-details"><h2>Tu acceso</h2><p>{roles[role]}</p>{user.permissions?.length ? <ul>{user.permissions.map(code => <li key={code}>{permissionLabel(code)}</li>)}</ul> : <p>Acceso a tu perfil personal.</p>}<a className="button glass" href="#catalogo">Explorar especialidades ↗</a></aside></div>
  </section>;
}
