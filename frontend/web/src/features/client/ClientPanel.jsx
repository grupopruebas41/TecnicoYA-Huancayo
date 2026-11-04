import React, {useCallback, useEffect, useState} from 'react';
import {request} from '../administration/http';
import PanelShell from '../panel/PanelShell';
import ProfilePage from '../panel/ProfilePage';
import {RealtimeProvider} from '../realtime/Realtime';
import RequestWizard from '../requests/RequestWizard';
import OrderWizard from '../requests/order/OrderWizard';
import MyRequests from '../requests/MyRequests';
import TechnicianSearch from '../matching/TechnicianSearch';
import {consumeSearch} from '../../landing/config';
import ClientHome from './ClientHome';
import NotificationsPage from './NotificationsPage';
import {requestGroup} from './clientRules';
import '../requests/requests.css';
import './client.css';

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

/** Contadores del menú: solicitudes por elegir técnico y notificaciones sin leer. Si fallan, el menú sigue sin ellos. */
function useClientBadges(tick) {
  const [badges, setBadges] = useState({});
  useEffect(() => {
    let active = true;
    const read = path => Promise.resolve().then(() => request(path));
    Promise.allSettled([read('/requests'), read('/notifications?per_page=1')]).then(([requests, notifications]) => {
      if (!active) return;
      const next = {};
      if (requests.status === 'fulfilled' && Array.isArray(requests.value?.data)) {
        const count = requests.value.data.filter(row => requestGroup(row) === 'choice').length;
        next.requests = {count, label: plural(count, 'solicitud por elegir técnico', 'solicitudes por elegir técnico')};
      }
      if (notifications.status === 'fulfilled') {
        const count = notifications.value?.data?.unread_count ?? 0;
        next.notifications = {count, label: plural(count, 'notificación sin leer', 'notificaciones sin leer')};
      }
      setBadges(next);
    });
    return () => { active = false; };
  }, [tick]);
  return badges;
}

/**
 * Panel del cliente (adelanto del S5, D-87): menú agrupado sobre PanelShell. La navegación conserva la etiqueta
 * «Gestión del cliente» y los textos de los botones que usan las pruebas E2E del S3 y del S4. La búsqueda que llega
 * desde la portada (consumeSearch) abre «Buscar técnicos» con sus filtros.
 */
export default function ClientPanel({user, roleLabel, onLogout, onUserChange, busy, notice, onExpired}) {
  const [searchIntent] = useState(consumeSearch);
  const [locked, setLocked] = useState(false);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick(value => value + 1), []);
  const badges = useClientBadges(tick);
  const district = user.client_profile?.district_id ?? null;
  const sections = [
    {id: 'home', group: 'General', label: 'Inicio', icon: 'home', render: ({navigate}) => <ClientHome user={user} navigate={navigate}/>},
    // D-92: el pedido con varios rubros es el asistente por defecto; la solicitud dirigida a un técnico (un solo rubro) y
    // los borradores anteriores siguen en RequestWizard.
    {id: 'new', group: 'Servicios', label: 'Nueva solicitud', icon: 'plus', render: ({navigate, intent}) => intent?.record || intent?.technician
      ? <RequestWizard initialRecord={intent?.record || null} target={intent?.technician || null} defaultDistrictId={district}
        onBusy={setLocked} onExit={() => { setLocked(false); navigate('requests'); }}/>
      : <OrderWizard key={intent?.preset ? 'preset-' + intent.preset.subcategory_id : 'nuevo'} preset={intent?.preset || null}
        defaultDistrictId={district} onBusy={setLocked} navigate={(section, data) => { setLocked(false); navigate(section, data); }}/>},
    {id: 'search', group: 'Servicios', label: 'Buscar técnicos', icon: 'search', render: ({navigate, intent}) => <TechnicianSearch
      initialFilters={intent?.filters || {}} defaultDistrictId={district} initialTechnician={intent?.technician || null}
      onRequest={technician => navigate('new', {technician})}/>},
    {id: 'requests', group: 'Servicios', label: 'Mis solicitudes', icon: 'requests', render: ({navigate, intent}) => <MyRequests
      openId={intent?.open || null} onContinue={record => navigate('new', {record})}/>},
    {id: 'notifications', group: 'Cuenta', label: 'Notificaciones', icon: 'bell', render: () => <NotificationsPage userId={user.id} onChange={refresh}/>},
    {id: 'profile', group: 'Cuenta', label: 'Mi perfil', icon: 'profile', render: () => <ProfilePage user={user} onUpdate={onUserChange} onExpired={onExpired}/>},
  ];
  return <RealtimeProvider>
    <PanelShell user={user} role="client" roleLabel={roleLabel} navLabel="Gestión del cliente" sections={sections}
      onLogout={onLogout} onUserChange={onUserChange} busy={busy} notice={notice} badges={badges} onNavigate={refresh}
      initialSection={searchIntent ? 'search' : undefined} initialIntent={searchIntent ? {filters: searchIntent} : null}
      locked={locked} bellKey={tick}/>
  </RealtimeProvider>;
}
