import Sprint02Portal from './Sprint02Portal';
import React, {useEffect, useState} from 'react';
import {request} from './http';
import SessionForm from './SessionForm';
import {ResetPassword} from './PasswordRecovery';
import PanelShell from '../panel/PanelShell';
import AdminHome from '../panel/AdminHome';
import ProfilePage from '../panel/ProfilePage';
import CatalogAdmin from './CatalogAdmin';
import VerificationAdmin from './VerificationAdmin';
import AnnouncementsAdmin from './AnnouncementsAdmin';
import StatisticsPage from '../admin/StatisticsPage';
import UsersAdmin from '../admin/UsersAdmin';
import RequestsAdmin from '../admin/RequestsAdmin';
import {Notice} from './forms';
import './account.css';
import {verificationLabel} from './labels';

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
  const [badges, refreshBadges] = useAdminBadges(user);
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
  const can = code => user.permissions?.includes(code);
  const profile = {id: 'profile', label: 'Mi perfil', icon: 'profile', render: () => <ProfilePage key={user.id} user={user} onUpdate={setUser} onExpired={expire}/>};
  // Bloque C (D-85): menú del administrador agrupado por secciones y filtrado por permisos (sin enlaces vacíos).
  const sections = role === 'admin' ? [
    can('dashboard.view') && {id: 'home', group: 'General', label: 'Inicio', icon: 'home', render: ({navigate}) => <AdminHome navigate={navigate} permissions={user.permissions}/>},
    can('dashboard.view') && {id: 'statistics', group: 'General', label: 'Estadísticas', icon: 'chart', render: () => <StatisticsPage/>},
    can('users.manage') && {id: 'users', group: 'Gestión', label: 'Usuarios', icon: 'users', render: ({intent}) => <UsersAdmin currentUserId={user.id} intent={intent}/>},
    can('technicians.verify') && {id: 'verification', group: 'Gestión', label: 'Verificación', icon: 'verify', render: () => <VerificationAdmin/>},
    can('dashboard.view') && {id: 'requests', group: 'Gestión', label: 'Solicitudes', icon: 'requests', render: () => <RequestsAdmin/>},
    can('catalog.manage') && {id: 'catalog', group: 'Contenido', label: 'Catálogo', icon: 'catalog', render: () => <CatalogAdmin/>},
    can('announcements.manage') && {id: 'announcements', group: 'Contenido', label: 'Comunicados', icon: 'announcements', render: ({intent}) => <AnnouncementsAdmin intent={intent}/>},
    {...profile, group: 'Cuenta'},
  ].filter(Boolean) : [
    {id: 'home', label: 'Inicio', icon: 'home', render: () => <>
      {role === 'technician' && <p className="notice">Estado de verificación: {verificationLabel(user.technician_profile?.verification_status)}. La disponibilidad se habilita después de la revisión.</p>}
      <Sprint02Portal user={user}/>
    </>},
    profile,
  ];
  return <PanelShell key={user.id} user={user} role={role} roleLabel={roles[role]} navLabel={role === 'admin' ? 'Administración' : 'Mi cuenta'}
    sections={sections} onLogout={logout} onUserChange={setUser} busy={busy} notice={error}
    badges={role === 'admin' ? badges : undefined} onNavigate={role === 'admin' ? refreshBadges : undefined}/>;
}

/**
 * Bloque C (D-85): contadores del menú del administrador (técnicos por verificar y comunicados vigentes), desde
 * GET /admin/dashboard. Se recargan al cambiar de sección; si fallan, el menú sigue sin contadores.
 */
function useAdminBadges(user) {
  const [badges, setBadges] = useState({});
  const [tick, setTick] = useState(0);
  const enabled = user?.role?.code === 'admin' && user.permissions?.includes('dashboard.view');
  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    request('/admin/dashboard').then(result => {
      if (!active) return;
      const pending = result.data.technicians_pending_verification;
      const live = result.data.announcements_active ?? 0;
      setBadges({
        verification: {count: pending, label: `${pending} ${pending === 1 ? 'técnico por verificar' : 'técnicos por verificar'}`},
        announcements: {count: live, label: `${live} ${live === 1 ? 'comunicado vigente' : 'comunicados vigentes'}`},
      });
    }).catch(() => { if (active) setBadges({}); });
    return () => { active = false; };
  }, [enabled, tick]);
  return [badges, () => setTick(value => value + 1)];
}
