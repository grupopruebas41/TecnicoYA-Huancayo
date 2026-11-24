import React, {useEffect, useState} from 'react';
import {request} from '../administration/http';
import PanelShell from '../panel/PanelShell';
import AdminHome from '../panel/AdminHome';
import VerificationAdmin from '../administration/VerificationAdmin';
import AnnouncementsAdmin from '../administration/AnnouncementsAdmin';
import CatalogAdmin from '../administration/CatalogAdmin';
import StatisticsPage from './StatisticsPage';
import UsersAdmin from './UsersAdmin';
import RequestsAdmin from './RequestsAdmin';
import KeywordsAdmin from './KeywordsAdmin';
import AdminOnboarding from './AdminOnboarding';
import {ClientPage, EmptyState} from '../client/ui';
import Icon from '../panel/icons';
import './adm.css';

/**
 * Panel del administrador, Fase A1 (PLAN-PANEL-ADMIN.md): menú agrupado en General, Operación, Personas, Negocio,
 * Contenido, Control, Próximamente y Ayuda, filtrado por permisos (D-119); contadores de Verificación, Solicitudes sin
 * técnico y Alertas operativas (D-118); bienvenida y tutorial de 5 pasos (D-117). Las secciones que llegan en las fases
 * A2 a A6 muestran por ahora una página «en preparación» con un camino a una sección disponible: no hay enlaces rotos.
 */

/** Secciones en preparación: ícono, tono, qué mostrarán y a qué sección disponible llevar mientras tanto. */
const UPCOMING = {
  live: ['bolt', 'blue', 'Verás las solicitudes que buscan técnico, su ronda y las ofertas abiertas con su cuenta regresiva.', 'requests'],
  alerts: ['alert', 'rose', 'Verás las solicitudes sin técnico, los pendientes por vencer y las fallas de sensores sin atender, con su acción directa.', 'requests'],
  performance: ['star', 'violet', 'Verás la aceptación, el tiempo de respuesta y los trabajos completados de cada técnico en los últimos 30 días.', 'verification'],
  zones: ['map', 'green', 'Verás los técnicos activos por zona y especialidad y las tarifas de referencia mínima, media y máxima.', 'catalog'],
  plans: ['wallet', 'amber', 'Verás los clientes Premium y Free y podrás activar o retirar Premium con motivo.', 'users'],
  promotions: ['gift', 'orange', 'Podrás crear, programar y retirar promociones para todos los clientes o solo para los Premium.', 'announcements'],
  iot: ['sensor', 'teal', 'Verás los equipos con sensor, su estado, la última lectura y las alertas abiertas.', 'home'],
  help: ['help', 'blue', 'Podrás editar y publicar las preguntas frecuentes y los consejos del mes del cliente y del técnico.', 'announcements'],
  audit: ['clock', 'slate', 'Verás el registro de acciones con buscador y filtros, el detalle de cada entrada y su exportación.', 'home'],
  rules: ['book', 'slate', 'Verás cada regla del negocio con su valor, su versión vigente y la fecha desde la que rige.', 'statistics'],
};

function UpcomingPage({id, label, sections, navigate}) {
  const [icon, tone, text, target] = UPCOMING[id];
  const destination = sections.find(section => section.id === target && section.render)
    || sections.find(section => section.id === 'home' && section.render);
  return <ClientPage id={`adm-${id}`} icon={icon} tone={tone} title={label} className="adm-page">
    <EmptyState icon={icon} tone={tone} title="Estamos preparando esta sección." text={text}>
      {destination && <button type="button" className="button outline" onClick={() => navigate(destination.id)}>
        Ir a {destination.label}</button>}
    </EmptyState>
  </ClientPage>;
}

const HOW_STEPS = [
  ['menu', 'El menú por tareas', 'Operación, Personas, Negocio, Contenido y Control agrupan lo que haces cada día.'],
  ['home', 'Inicio y pendientes', 'Los indicadores del día y las tareas que esperan una acción tuya.'],
  ['requests', 'Solicitudes y emparejamiento', 'Sigue cada solicitud y su búsqueda de técnico.'],
  ['users', 'Usuarios y verificación', 'Administra cuentas y revisa los documentos de los técnicos.'],
];

export function AdminHelp({onTour}) {
  return <ClientPage id="adm-help-page" icon="book" tone="blue" title="Cómo funciona el panel" className="adm-page"
    intro="Lo esencial para administrar TécnicoYa.">
    <ol className="adm-how">
      {HOW_STEPS.map(([icon, title, text], index) => <li key={title} className="adm-how-item">
        <span className="adm-how-icon" aria-hidden="true"><Icon name={icon}/></span>
        <div><p className="adm-how-kicker">Paso {index + 1}</p><h3>{title}</h3><p className="muted">{text}</p></div>
      </li>)}
    </ol>
    <div className="adm-how-actions">
      <button type="button" className="button primary" onClick={onTour}><Icon name="book"/> Ver el tutorial otra vez</button>
    </div>
  </ClientPage>;
}

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

/**
 * Contadores del menú desde GET /admin/dashboard (badges, D-118). Se recargan al cambiar de sección; si fallan, el menú
 * sigue sin contadores. Sin umbrales en las reglas vigentes, operational_alerts llega en null y no se muestra.
 */
export function useAdminBadges(user) {
  const [badges, setBadges] = useState({});
  const [tick, setTick] = useState(0);
  const enabled = user?.role?.code === 'admin' && user.permissions?.includes('dashboard.view');
  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    request('/admin/dashboard').then(result => {
      if (!active) return;
      const data = result.data;
      const counts = data.badges || {verification_pending: data.technicians_pending_verification};
      const live = data.announcements_active ?? 0;
      const next = {
        verification: {count: counts.verification_pending, label: plural(counts.verification_pending, 'técnico por verificar', 'técnicos por verificar')},
        announcements: {count: live, label: plural(live, 'comunicado vigente', 'comunicados vigentes')},
      };
      if (Number.isInteger(counts.requests_unassigned)) {
        next.requests = {count: counts.requests_unassigned, label: plural(counts.requests_unassigned, 'solicitud sin técnico', 'solicitudes sin técnico')};
      }
      if (Number.isInteger(counts.operational_alerts)) {
        next.alerts = {count: counts.operational_alerts, label: plural(counts.operational_alerts, 'alerta operativa', 'alertas operativas')};
      }
      setBadges(next);
    }).catch(() => { if (active) setBadges({}); });
    return () => { active = false; };
  }, [enabled, tick]);
  return [badges, () => setTick(value => value + 1)];
}

/** Secciones del menú en orden; cada una con el permiso que la habilita (D-119). */
function adminSections(user, onTour) {
  const can = code => user.permissions?.includes(code);
  // La página en preparación busca su destino en la lista final (se lee al dibujarla, cuando ya está armada).
  let list = [];
  const upcoming = (id, group, label, permission) => can(permission) && {id, group, label, icon: UPCOMING[id][0],
    render: ({navigate}) => <UpcomingPage id={id} label={label} sections={list} navigate={navigate}/>};
  list = [
    can('dashboard.view') && {id: 'home', group: 'General', label: 'Inicio', icon: 'home',
      render: ({navigate}) => <AdminHome navigate={navigate} permissions={user.permissions}/>},
    can('dashboard.view') && {id: 'requests', group: 'Operación', label: 'Solicitudes', icon: 'requests', render: () => <RequestsAdmin/>},
    upcoming('live', 'Operación', 'Emparejamiento en vivo', 'dashboard.view'),
    upcoming('alerts', 'Operación', 'Alertas operativas', 'dashboard.view'),
    can('users.manage') && {id: 'users', group: 'Personas', label: 'Usuarios', icon: 'users',
      render: ({intent}) => <UsersAdmin currentUserId={user.id} intent={intent}/>},
    can('technicians.verify') && {id: 'verification', group: 'Personas', label: 'Verificación de técnicos', icon: 'verify',
      render: () => <VerificationAdmin/>},
    upcoming('performance', 'Personas', 'Desempeño de técnicos', 'dashboard.view'),
    can('catalog.manage') && {id: 'catalog', group: 'Negocio', label: 'Catálogo', icon: 'catalog', render: () => <CatalogAdmin/>},
    upcoming('zones', 'Negocio', 'Zonas y tarifas de referencia', 'dashboard.view'),
    upcoming('plans', 'Negocio', 'Planes y Premium', 'users.manage'),
    upcoming('promotions', 'Negocio', 'Promociones', 'announcements.manage'),
    upcoming('iot', 'Negocio', 'IoT', 'dashboard.view'),
    can('announcements.manage') && {id: 'announcements', group: 'Contenido', label: 'Comunicados', icon: 'announcements',
      render: ({intent}) => <AnnouncementsAdmin intent={intent}/>},
    can('catalog.manage') && {id: 'keywords', group: 'Contenido', label: 'Palabras clave del buscador', icon: 'search',
      render: () => <KeywordsAdmin/>},
    upcoming('help', 'Contenido', 'Preguntas frecuentes y consejos', 'content.manage'),
    can('dashboard.view') && {id: 'statistics', group: 'Control', label: 'Estadísticas e informes', icon: 'chart', render: () => <StatisticsPage/>},
    upcoming('audit', 'Control', 'Auditoría', 'audit.view'),
    upcoming('rules', 'Control', 'Reglas del negocio', 'dashboard.view'),
    ...(can('dashboard.view') ? [
      {id: 'reviews', group: 'Próximamente', label: 'Reseñas', icon: 'star', soon: 'Sprint 6'},
      {id: 'incidents', group: 'Próximamente', label: 'Incidencias', icon: 'flag', soon: 'Sprint 7'},
      {id: 'payments', group: 'Próximamente', label: 'Pagos', icon: 'wallet', soon: 'Sprint 8'},
    ] : []),
    {id: 'how', group: 'Ayuda', label: 'Cómo funciona el panel', icon: 'book', render: () => <AdminHelp onTour={onTour}/>},
  ].filter(Boolean);
  return list;
}

export default function AdminApp({user, roleLabel, extraSections, notificationTarget, onLogout, onUserChange, busy, notice, onExpired}) {
  const [badges, refreshBadges] = useAdminBadges(user);
  const [tour, setTour] = useState(false);
  const sections = [...adminSections(user, () => setTour(true)), ...extraSections];
  return <PanelShell user={user} role="admin" roleLabel={roleLabel} navLabel="Administración" sections={sections} onLogout={onLogout}
    onUserChange={onUserChange} busy={busy} notice={notice} modern onExpired={onExpired} notificationTarget={notificationTarget}
    badges={badges} onNavigate={refreshBadges}>
    <AdminOnboarding user={user} replay={tour} onReplayEnd={() => setTour(false)}/>
  </PanelShell>;
}
