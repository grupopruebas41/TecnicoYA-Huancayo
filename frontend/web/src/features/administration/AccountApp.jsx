import React, {useEffect, useState} from 'react';
import {request} from './http';
import SessionForm from './SessionForm';
import {ResetPassword} from './PasswordRecovery';
import ProfilePage from '../panel/ProfilePage';
import AdminApp from '../admin/AdminApp';
import {Notice} from './forms';
import ClientPanel from '../client/ClientPanel';
import TechnicianApp, {technicianTarget} from '../technician/TechnicianApp';
import NotificationsPage from '../client/NotificationsPage';
import {RealtimeProvider} from '../realtime/Realtime';
import './account.css';

const roles = {client: 'Cliente', technician: 'Especialista técnico', admin: 'Administrador'};
const routes = {client: '#cuenta/cliente', technician: '#cuenta/tecnico', admin: '#cuenta/administrador'};
// D-80: enlace del correo de recuperación (#cuenta/restablecer?token=…&email=…).
const RESET_ROUTE = '#cuenta/restablecer';
// D-85: enlace de activación de una cuenta creada por un administrador (#cuenta/activar?token=…&email=…).
const ACTIVATION_ROUTE = '#cuenta/activar';
const isTokenRoute = hash => hash.startsWith(RESET_ROUTE) || hash.startsWith(ACTIVATION_ROUTE);
const resetParams = hash => Object.fromEntries(new URLSearchParams(hash.split('?')[1] || ''));
export default function AccountApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const update = () => setHash(window.location.hash);
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setBlocked(false);
    request('/me').then(result => { if (active) setUser(result.data); }).catch(error => {
      if (!active) return;
      setUser(null); setBlocked(error.status === 403);
      if (error.status !== 401) setError(error.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  useEffect(() => {
    if (loading) return;
    // El servidor decide el rol. Cambiar el hash nunca concede permisos.
    const redirect = () => {
      const hash = window.location.hash;
      // Sin sesión, el enlace de recuperación se queda en su ruta.
      if (!user && isTokenRoute(hash)) return;
      if (hash === '#cuenta' || hash === '#plataforma' || hash.startsWith('#cuenta/')) {
        const destination = routes[user?.role?.code] || '#cuenta';
        if (hash !== destination) window.location.replace(destination);
      }
    };
    redirect(); window.addEventListener('hashchange', redirect);
    return () => window.removeEventListener('hashchange', redirect);
  }, [user, loading]);
  function clearSession() { setUser(null); setBlocked(false); }
  async function reconcileLogout() {
    try { setUser((await request('/me')).data); }
    catch (error) { if (error.status === 401) clearSession(); }
  }
  async function logout() {
    if (busy) return;
    setBusy(true); setError('');
    try { await request('/auth/logout', undefined, 'POST'); clearSession(); }
    catch (error) {
      if (error.status === 401) clearSession();
      else {
        setError(error.message);
        if (error.status === 0) {
          await reconcileLogout();
        }
      }
    } finally { setBusy(false); }
  }
  // Sin sesión, la tarjeta se centra en el alto disponible bajo la cabecera (auth-page).
  if (loading) return <section className="session-page auth-page"><div className="auth-status"><span className="auth-emblem" aria-hidden="true">t</span><output>Comprobando tu sesión…</output></div></section>;
  if (blocked) return <section className="session-page auth-page"><div className="auth-status"><Notice error={error}/><button type="button" className="button primary" disabled={busy} onClick={logout}>Cerrar sesión</button></div></section>;
  if (!user && isTokenRoute(hash)) {
    const {token = '', email = ''} = resetParams(hash);
    return <section className="session-page auth-page"><ResetPassword key={token} token={token} email={email} activation={hash.startsWith(ACTIVATION_ROUTE)}/></section>;
  }
  if (!user) return <section className="session-page auth-page"><SessionForm connectionError={error} onRetry={() => setReload(reload + 1)} onLogin={(value, warning = '') => { setUser(value); setError(warning); }}/></section>;
  const role = user.role?.code;
  if (!roles[role]) return <section className="session-page"><Notice error="Tu cuenta no tiene un rol habilitado."/><Notice error={error}/><button type="button" className="button primary" disabled={busy} onClick={logout}>Cerrar sesión</button></section>;
  const expire = failure => { clearSession(); setBlocked(failure.status === 403); setError(failure.status === 403 ? failure.message : 'Tu sesión venció. Inicia sesión nuevamente.'); };
  // Panel del cliente (D-87): su propio menú agrupado sobre PanelShell.
  if (role === 'client') return <ClientPanel key={user.id} user={user} roleLabel={roles.client} onLogout={logout} onUserChange={setUser}
    busy={busy} notice={error} onExpired={expire}/>;
  // Fase T2 del panel del técnico: su propio menú (Trabajo, Mi negocio, Mi desempeño y Ayuda) e Inicio.
  if (role === 'technician') return <RealtimeProvider><TechnicianApp key={user.id} user={user} roleLabel={roles.technician} onLogout={logout}
    onUserChange={setUser} busy={busy} notice={error} onExpired={expire}/></RealtimeProvider>;
  // Fase T1 del panel del técnico: Mi perfil y Notificaciones salen del menú (avatar y campana), como en el cliente.
  const profile = {id: 'profile', nav: false, label: 'Mi perfil', icon: 'profile', render: () => <ProfilePage key={user.id} user={user} onUpdate={setUser} onExpired={expire} password={false}/>};
  const notifications = {id: 'notifications', nav: false, label: 'Notificaciones', icon: 'bell',
    render: ({navigate}) => <NotificationsPage userId={user.id} role={role} onChange={() => {}}
      onOpen={item => { const target = staffTarget(role, item); if (target) navigate(...target); }}/>};
  // Fase A1 del panel del administrador (PLAN-PANEL-ADMIN.md): menú, contadores, bienvenida y tutorial en AdminApp.
  return <RealtimeProvider><AdminApp key={user.id} user={user} roleLabel={roles[role]} extraSections={[profile, notifications]}
    notificationTarget={item => staffTarget(role, item)} onLogout={logout} onUserChange={setUser} busy={busy} notice={error}
    onExpired={expire}/></RealtimeProvider>;
}

/** Fase T1: a dónde lleva un aviso del administrador; los del técnico van en TechnicianApp (technicianTarget, Fase T2). */
export function staffTarget(role, item) {
  if (role === 'admin') return item.type?.startsWith('announcement') ? ['announcements'] : null;
  return technicianTarget(item);
}
