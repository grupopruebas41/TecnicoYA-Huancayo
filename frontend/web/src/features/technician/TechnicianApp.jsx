import React, {useCallback, useEffect, useState} from 'react';
import {request} from '../administration/http';
import PanelShell from '../panel/PanelShell';
import ProfilePage from '../panel/ProfilePage';
import OffersPage from './OffersPage';
import JobsPage from './JobsPage';
import {AgendaPage, ZonesPage} from './Availability';
import ProfessionalProfile from './ProfessionalProfile';
import ServicesPage from './ServicesPage';
import PortfolioPage from './PortfolioPage';
import VerificationPage from './VerificationPage';
import StatsPage from './StatsPage';
import NotificationsPage from '../client/NotificationsPage';
import {PrivacyPage} from '../client/ClientPages';
import TechnicianHome from './TechnicianHome';
import {TechnicianFaq, TechnicianHowItWorks} from './TechnicianHelp';
import TechnicianOnboarding from './TechnicianOnboarding';
import {OfferAlertWatcher, loadOfferAlerts} from './offerAlerts';
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
const TONE_ICON = {ok: 'check', info: 'clock', warn: 'alert', danger: 'alert'};

/**
 * Revisión del #63: en el menú, la verificación muestra un texto corto («Aprobado», «En revisión», «Falta 1» u «Observado»);
 * el texto completo («Falta un documento») va en el title y en el aria-label, y la página de Verificación lo sigue mostrando entero.
 */
export function verificationBadge(verification) {
  const missing = Array.isArray(verification.missing) && verification.missing.length > 0 ? verification.missing.length : 1;
  const short = {approved: 'Aprobado', in_review: 'En revisión', observed: 'Observado', missing: `Falta ${missing}`}[verification.state]
    || verification.label;
  const tone = VERIFICATION_TONE[verification.state];
  return {text: short, tone, icon: TONE_ICON[tone], label: `Verificación: ${verification.label}`};
}

/** Contadores del menú: ofertas pendientes (con punto que late), avance del perfil y estado de la verificación. */
export function technicianBadges(data) {
  if (!data?.offers || !data.progress || !data.verification) return {};
  const pending = data.offers.pending;
  const percent = data.progress.percent;
  return {
    offers: {count: pending, pulse: pending > 0, label: `${pending} ${pending === 1 ? 'oferta pendiente' : 'ofertas pendientes'}`},
    'profile-pro': {text: `${percent} %`, tone: percent === 100 ? 'ok' : 'warn', icon: percent === 100 ? 'check' : 'profile',
      label: `Perfil al ${percent} %`},
    verification: verificationBadge(data.verification),
  };
}

/** A dónde lleva cada aviso del técnico: ofertas, trabajos (asignado o cancelado, Fase T3), verificación o el Inicio. */
export function technicianTarget(item) {
  if (item.type?.startsWith('offer.')) return ['offers'];
  if (item.type === 'request.assigned' || item.type === 'request.cancelled') return ['jobs'];
  if (item.type?.startsWith('technician.verification')) return ['verification'];
  return ['home'];
}

/**
 * Panel del técnico (Fase T2, D-104): menú agrupado en Trabajo, Mi negocio, Mi desempeño y Ayuda sobre PanelShell
 * moderno. Lo que no está listo va con «Próximamente» y aria-disabled (Calificaciones en el S6
 * y Ganancias en el S8); ningún enlace lleva a una página vacía. Desde la T3: Ofertas, Mis trabajos, Mi agenda y Zonas;
 * desde la T4: Perfil profesional, Servicios y tarifas, Portafolio, Verificación y Estadísticas.
 */
export default function TechnicianApp({user, roleLabel, onLogout, onUserChange, busy, notice, onExpired}) {
  const [tick, setTick] = useState(0);
  const [tour, setTour] = useState(false);
  const refresh = useCallback(() => setTick(value => value + 1), []);
  const home = useTechnicianHome(tick);
  // Fase T5 (D-112): los avisos de oferta de la cuenta, para el vigilante y la pestaña «Avisos».
  useEffect(() => { loadOfferAlerts(user.preferences?.offer_alerts); }, [user.id]);
  const sections = [
    {id: 'home', group: 'Trabajo', label: 'Inicio', icon: 'home',
      render: ({navigate}) => <TechnicianHome user={user} home={home} navigate={navigate} onChange={refresh}/>},
    // Fase T3: Ofertas con Pendientes e Historial, Mis trabajos y Mi agenda.
    {id: 'offers', group: 'Trabajo', label: 'Ofertas', icon: 'bolt',
      render: () => <OffersPage pendingCount={home.data?.offers?.pending ?? 0} onChange={refresh}/>},
    {id: 'jobs', group: 'Trabajo', label: 'Mis trabajos', icon: 'briefcase', render: () => <JobsPage/>},
    {id: 'agenda', group: 'Trabajo', label: 'Mi agenda', icon: 'calendar', render: () => <AgendaPage onSaved={refresh}/>},
    // Fase T4: Mi negocio rediseñado (perfil con vista previa, servicios, portafolio y verificación) y Estadísticas.
    {id: 'profile-pro', group: 'Mi negocio', label: 'Perfil profesional', icon: 'profile',
      render: () => <ProfessionalProfile user={user} onSaved={refresh}/>},
    {id: 'services', group: 'Mi negocio', label: 'Servicios y tarifas', icon: 'catalog', render: () => <ServicesPage onSaved={refresh}/>},
    {id: 'portfolio', group: 'Mi negocio', label: 'Portafolio', icon: 'image', render: () => <PortfolioPage onSaved={refresh}/>},
    {id: 'zones', group: 'Mi negocio', label: 'Zonas y disponibilidad', icon: 'map', render: () => <ZonesPage onSaved={refresh}/>},
    {id: 'verification', group: 'Mi negocio', label: 'Verificación', icon: 'verify', render: () => <VerificationPage onSaved={refresh}/>},
    {id: 'stats', group: 'Mi desempeño', label: 'Estadísticas', icon: 'chart', render: () => <StatsPage/>},
    {id: 'ratings', group: 'Mi desempeño', label: 'Calificaciones', icon: 'star', soon: true},
    {id: 'earnings', group: 'Mi desempeño', label: 'Ganancias', icon: 'wallet', soon: true},
    {id: 'how', group: 'Ayuda', label: 'Cómo funciona', icon: 'book',
      render: ({navigate}) => <TechnicianHowItWorks navigate={navigate} onTour={() => setTour(true)}/>},
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
    onNavigate={refresh} modern onExpired={onExpired} notificationTarget={technicianTarget}>
    {/* Fase T5: bienvenida y tutorial la primera vez (se repite desde Cómo funciona) y avisos de ofertas nuevas. */}
    <TechnicianOnboarding user={user} replay={tour} onReplayEnd={() => setTour(false)}/>
    <OfferAlertWatcher/>
  </PanelShell>;
}
