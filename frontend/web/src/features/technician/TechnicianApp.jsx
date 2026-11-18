import React, {useCallback, useEffect, useState} from 'react';
import {request} from '../administration/http';
import PanelShell from '../panel/PanelShell';
import ProfilePage from '../panel/ProfilePage';
import OffersPage from './OffersPage';
import JobsPage from './JobsPage';
import {AgendaPage, ZonesPage} from './Availability';
import TechnicianPanel from '../administration/TechnicianPanel';
import NotificationsPage from '../client/NotificationsPage';
import {PrivacyPage} from '../client/ClientPages';
import TechnicianHome from './TechnicianHome';
import {TechnicianFaq, TechnicianHowItWorks} from './TechnicianHelp';
import './technician.css';

/** Datos del Inicio (GET /technicians/me/home); se recargan al navegar y cuando cambia una oferta. */
export function useTechnicianHome(tick) {
  const [state, setState] = useState({data: null, error: null, loading: true});
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setState(current => ({...current, loading: true}));
    Promise.resolve().then(() => request('/technicians/me/home'))
      .then(result => { if (active) setState({data: result?.data?.indicators ? result.data : null, error: null, loading: false}); })
      .catch(error => { if (active) setState(current => ({...current, error, loading: false})); });
    return () => { active = false; };
  }, [tick, retry]);
  return {...state, reload: () => setRetry(value => value + 1)};
}

const VERIFICATION_TONE = {approved: 'ok', in_review: 'info', missing: 'warn', observed: 'danger'};

/** Contadores del menú: ofertas pendientes (con punto que late), avance del perfil y estado de la verificación. */
export function technicianBadges(data) {
  if (!data?.offers || !data.progress || !data.verification) return {};
  const pending = data.offers.pending;
  const percent = data.progress.percent;
  return {
    offers: {count: pending, pulse: pending > 0, label: `${pending} ${pending === 1 ? 'oferta pendiente' : 'ofertas pendientes'}`},
    'profile-pro': {text: `${percent} %`, tone: percent === 100 ? 'ok' : 'warn', label: `Perfil al ${percent} %`},
    verification: {text: data.verification.label, tone: VERIFICATION_TONE[data.verification.state], label: `Verificación: ${data.verification.label}`},
  };
}

/** A dónde lleva cada aviso del técnico: ofertas, trabajos (asignado o cancelado, Fase T3), verificación o el Inicio. */
export function technicianTarget(item) {
  if (item.type?.startsWith('offer.')) return ['offers'];
  if (item.type === 'request.assigned' || item.type === 'request.cancelled') return ['jobs'];
  if (item.type?.startsWith('technician.verification')) return ['verification'];
  return ['home'];
}

function BusinessPage({title, intro, only, onSaved}) {
  return <section className="panel-page tech-business" aria-labelledby={`tech-${only}`}>
    <header className="client-page-head"><h2 id={`tech-${only}`}>{title}</h2><p className="muted">{intro}</p></header>
    <TechnicianPanel only={only} onSaved={onSaved}/>
  </section>;
}

/**
 * Panel del técnico (Fase T2, D-104): menú agrupado en Trabajo, Mi negocio, Mi desempeño y Ayuda sobre PanelShell
 * moderno. Lo que no está listo va con «Próximamente» y aria-disabled (Estadísticas en la T4, Calificaciones en el S6
 * y Ganancias en el S8); ningún enlace lleva a una página vacía. Desde la T3: Ofertas, Mis trabajos, Mi agenda y Zonas.
 */
export default function TechnicianApp({user, roleLabel, onLogout, onUserChange, busy, notice, onExpired}) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick(value => value + 1), []);
  const home = useTechnicianHome(tick);
  const sections = [
    {id: 'home', group: 'Trabajo', label: 'Inicio', icon: 'home',
      render: ({navigate}) => <TechnicianHome user={user} home={home} navigate={navigate} onChange={refresh}/>},
    // Fase T3: Ofertas con Pendientes e Historial, Mis trabajos y Mi agenda.
    {id: 'offers', group: 'Trabajo', label: 'Ofertas', icon: 'bolt',
      render: () => <OffersPage pendingCount={home.data?.offers?.pending ?? 0} onChange={refresh}/>},
    {id: 'jobs', group: 'Trabajo', label: 'Mis trabajos', icon: 'briefcase', render: () => <JobsPage/>},
    {id: 'agenda', group: 'Trabajo', label: 'Mi agenda', icon: 'calendar', render: () => <AgendaPage onSaved={refresh}/>},
    {id: 'profile-pro', group: 'Mi negocio', label: 'Perfil profesional', icon: 'profile', render: () => <BusinessPage only="profile"
      title="Perfil profesional" intro="Lo que ven los clientes en tu perfil público." onSaved={refresh}/>},
    {id: 'services', group: 'Mi negocio', label: 'Servicios y tarifas', icon: 'catalog', render: () => <BusinessPage only="services"
      title="Servicios y tarifas" intro="Tus trabajos con su tarifa referencial." onSaved={refresh}/>},
    {id: 'portfolio', group: 'Mi negocio', label: 'Portafolio', icon: 'image', render: () => <BusinessPage only="portfolio"
      title="Portafolio" intro="Muestra trabajos reales para ganar la confianza del cliente." onSaved={refresh}/>},
    {id: 'zones', group: 'Mi negocio', label: 'Zonas y disponibilidad', icon: 'map', render: () => <ZonesPage onSaved={refresh}/>},
    {id: 'verification', group: 'Mi negocio', label: 'Verificación', icon: 'verify', render: () => <BusinessPage only="verification"
      title="Verificación" intro="Tus documentos solo los ves tú y el equipo que los revisa." onSaved={refresh}/>},
    {id: 'stats', group: 'Mi desempeño', label: 'Estadísticas', icon: 'chart', soon: true},
    {id: 'ratings', group: 'Mi desempeño', label: 'Calificaciones', icon: 'star', soon: true},
    {id: 'earnings', group: 'Mi desempeño', label: 'Ganancias', icon: 'wallet', soon: true},
    {id: 'how', group: 'Ayuda', label: 'Cómo funciona', icon: 'book', render: ({navigate}) => <TechnicianHowItWorks navigate={navigate}/>},
    {id: 'faq', group: 'Ayuda', label: 'Preguntas frecuentes', icon: 'help', render: () => <TechnicianFaq/>},
    {id: 'report', group: 'Ayuda', label: 'Reportar un problema', icon: 'flag', soon: true},
    {id: 'privacy', group: 'Ayuda', label: 'Privacidad y términos', icon: 'verify', render: () => <PrivacyPage/>},
    {id: 'notifications', nav: false, label: 'Notificaciones', icon: 'bell', render: ({navigate}) => <NotificationsPage userId={user.id}
      role="technician" onChange={refresh} onOpen={item => navigate(...technicianTarget(item))}/>},
    {id: 'profile', nav: false, label: 'Mi perfil', icon: 'profile', render: () => <ProfilePage user={user} onUpdate={onUserChange}
      onExpired={onExpired} password={false}/>},
  ];
  return <PanelShell user={user} role="technician" roleLabel={roleLabel} navLabel="Gestión del técnico" sections={sections}
    onLogout={onLogout} onUserChange={onUserChange} busy={busy} notice={notice} badges={technicianBadges(home.data)}
    onNavigate={refresh} modern onExpired={onExpired} notificationTarget={technicianTarget}/>;
}
