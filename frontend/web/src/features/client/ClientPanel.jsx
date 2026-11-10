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
import {isActive} from './clientRules';
import ClientOnboarding from './ClientOnboarding';
import {FaqPage, FavoritesPage, HowItWorksPage, NewsPage, PremiumPage, PrivacyPage, SpecialtiesPage} from './ClientPages';
import '../requests/requests.css';
import './client.css';

// Rediseño de la campana (Fase 4): un aviso sobre una solicitud la abre en Mis solicitudes; un comunicado, en Novedades.
const notificationTarget = item => {
  const requestId = item.context?.request_id || (item.subject?.type === 'service_request' ? item.subject.id : null);
  if (requestId) return ['requests', {open: requestId}];
  return item.type?.startsWith('announcement') ? ['news'] : null;
};

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
        // Fase 4: el contador de Mis solicitudes muestra las activas.
        const count = requests.value.data.filter(isActive).length;
        next.requests = {count, label: plural(count, 'solicitud activa', 'solicitudes activas')};
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
  const [tour, setTour] = useState(false);
  const refresh = useCallback(() => setTick(value => value + 1), []);
  const badges = useClientBadges(tick);
  const district = user.client_profile?.district_id ?? null;
  const sections = [
    {id: 'home', label: 'Inicio', icon: 'home', render: ({navigate}) => <ClientHome user={user} navigate={navigate}/>},
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
      openId={intent?.open || null} navigate={navigate} onContinue={record => navigate('new', {record})}/>},
    {id: 'favorites', group: 'Servicios', label: 'Técnicos favoritos', icon: 'heart', render: ({navigate}) => <FavoritesPage navigate={navigate}/>},
    {id: 'appointments', group: 'Servicios', label: 'Mis citas', icon: 'calendar', soon: true},
    // Fase 4 (D-98): lo premium se ve con candado y abre la presentación del plan, sin pagos. Las pantallas llegan en la Fase 6.
    ...[['equipment', 'Mis equipos', 'monitor'], ['sensors', 'Sensores IoT', 'sensor'], ['alerts', 'Alertas', 'alert'],
      ['promotions', 'Promociones', 'gift'], ['warranties', 'Garantías', 'verify']]
      .map(([id, label, icon]) => ({id, group: 'Mi hogar / Mi negocio · Premium', label, icon, premium: true})),
    {id: 'specialties', group: 'Descubre', label: 'Especialidades', icon: 'catalog', render: ({navigate}) => <SpecialtiesPage navigate={navigate}/>},
    {id: 'news', group: 'Descubre', label: 'Novedades', icon: 'news', render: () => <NewsPage/>},
    {id: 'map', group: 'Descubre', label: 'Técnicos cerca de ti', icon: 'map', soon: true},
    {id: 'how', group: 'Ayuda', label: 'Cómo funciona', icon: 'book', render: ({navigate}) => <HowItWorksPage navigate={navigate} onTour={() => setTour(true)}/>},
    {id: 'faq', group: 'Ayuda', label: 'Preguntas frecuentes', icon: 'help', render: () => <FaqPage/>},
    {id: 'report', group: 'Ayuda', label: 'Reportar un problema', icon: 'flag', soon: true},
    {id: 'privacy', group: 'Ayuda', label: 'Privacidad y términos', icon: 'verify', render: () => <PrivacyPage/>},
    // Fuera del menú (Fase 4): Notificaciones se abre desde la campana y Mi perfil desde el panel del avatar.
    {id: 'premium', nav: false, label: 'Plan Premium', icon: 'star', render: ({intent}) => <PremiumPage intent={intent}/>},
    {id: 'notifications', nav: false, label: 'Notificaciones', icon: 'bell', render: ({navigate}) => <NotificationsPage userId={user.id} onChange={refresh}
      onOpen={item => { const target = notificationTarget(item); if (target) navigate(...target); }}/>},
    {id: 'profile', nav: false, label: 'Mi perfil', icon: 'profile', render: () => <ProfilePage user={user} onUpdate={onUserChange} onExpired={onExpired}/>},
  ];
  return <RealtimeProvider>
    <PanelShell user={user} role="client" roleLabel={roleLabel} navLabel="Gestión del cliente" sections={sections}
      onLogout={onLogout} onUserChange={onUserChange} busy={busy} notice={notice} badges={badges} onNavigate={refresh}
      initialSection={searchIntent ? 'search' : undefined} initialIntent={searchIntent ? {filters: searchIntent} : null}
      locked={locked} bellKey={tick} modern onExpired={onExpired} notificationTarget={notificationTarget}>
      {/* Fase 5 (D-97): bienvenida y tutorial solo la primera vez; «Cómo funciona» repite el tutorial. */}
      <ClientOnboarding user={user} replay={tour} onReplayEnd={() => setTour(false)}/>
    </PanelShell>
  </RealtimeProvider>;
}
