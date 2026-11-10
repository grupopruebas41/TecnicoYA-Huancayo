import React from 'react';
import {request} from '../administration/http';
import Icon from './icons';

/**
 * Rediseño de la campana (Fase 4): lista compartida por el panel desplegable y la página de Notificaciones. Ícono en un
 * círculo de color por categoría con su nombre en texto (nunca solo color), título, contexto del pedido, tiempo relativo,
 * marca «Nueva» y fondo distinto si no está leída, grupos Hoy, Ayer y Anteriores, y solo el aviso más reciente de un
 * mismo tipo sobre la misma solicitud.
 */
export const CATEGORIES = {
  search: {icon: 'search', label: 'Búsqueda de técnico'},
  offer: {icon: 'check', label: 'Técnico'},
  cancel: {icon: 'close', label: 'Cancelación'},
  announcement: {icon: 'announcements', label: 'Comunicado'},
  system: {icon: 'bell', label: 'Sistema'},
  iot: {icon: 'sensor', label: 'Sensor'},
};
const TYPE_CATEGORY = {
  'request.pending': 'search', 'request.submitted': 'search', 'request.searching': 'search',
  'request.awaiting_choice': 'offer', 'request.assigned': 'offer', 'offer.created': 'offer',
  'request.cancelled': 'cancel', 'request.expired': 'cancel', 'request.direct_declined': 'cancel',
};
export const categoryOf = item => item.category || TYPE_CATEGORY[item.type]
  || (item.type?.startsWith('iot.') ? 'iot' : item.type?.startsWith('announcement') ? 'announcement' : 'system');

const LIMA = 'America/Lima';
const limaDate = value => new Date(value).toLocaleDateString('en-CA', {timeZone: LIMA});

/** «hace un momento», «hace 5 min», «hace 2 h», «ayer» o «hace 3 días». */
export function relativeTime(value, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24 && limaDate(value) === limaDate(now)) return `hace ${hours} h`;
  const days = Math.round((new Date(limaDate(now)) - new Date(limaDate(value))) / 86400000);
  return days <= 1 ? 'ayer' : `hace ${days} días`;
}

export function dayGroup(value, now = Date.now()) {
  const days = Math.round((new Date(limaDate(now)) - new Date(limaDate(value))) / 86400000);
  return days <= 0 ? 'Hoy' : days === 1 ? 'Ayer' : 'Anteriores';
}

/** Deja el aviso más reciente por tipo y solicitud; los anteriores van en related para marcarlos juntos. */
export function collapse(items) {
  const seen = new Map();
  const result = [];
  items.forEach(item => {
    const key = item.subject?.id ? `${item.type}:${item.subject.type}:${item.subject.id}` : `id:${item.id}`;
    const kept = seen.get(key);
    if (kept) { kept.related.push(item); return; }
    const copy = {...item, related: []};
    seen.set(key, copy);
    result.push(copy);
  });
  return result;
}

export const isUnread = item => !item.read_at || item.related?.some(other => !other.read_at);

/** Marca como leídos el aviso y los repetidos que tenga sin leer (solo los propios: el servidor responde 404 a ajenos). */
export async function markOpened(item) {
  const ids = [item, ...(item.related || [])].filter(entry => !entry.read_at).map(entry => entry.id);
  await Promise.all(ids.map(id => request(`/notifications/${id}/read`, {}, 'POST')));
  return ids.length;
}

export function EmptyNotifications({filtered = false}) {
  return <div className="notif-empty">
    <svg viewBox="0 0 120 90" aria-hidden="true" className="notif-empty-art">
      <circle cx="60" cy="45" r="38" className="notif-empty-glow"/>
      <path d="M44 56V43a16 16 0 0 1 32 0v13l5 5H39z" className="notif-empty-bell"/>
      <path d="M54 66a6 6 0 0 0 12 0" className="notif-empty-bell"/>
      <path d="m50 44 7 7 13-14" className="notif-empty-check"/>
    </svg>
    <p><strong>{filtered ? 'No tienes notificaciones sin leer' : 'Estás al día, no tienes notificaciones nuevas'}</strong></p>
    <p className="muted">Te avisaremos aquí cuando un técnico acepte o cambie el estado de tus solicitudes.</p>
  </div>;
}

export function NotificationList({items, onOpen, now = Date.now(), headingLevel = 3}) {
  const groups = [];
  collapse(items).forEach(item => {
    const label = dayGroup(item.created_at, now);
    if (groups.at(-1)?.label === label) groups.at(-1).items.push(item);
    else groups.push({label, items: [item]});
  });
  const Heading = `h${headingLevel}`;
  return groups.map(group => <section key={group.label} className="notif-group" aria-label={group.label}>
    <Heading className="notif-group-title">{group.label}</Heading>
    <ul className="notif-list">
      {group.items.map(item => {
        const category = categoryOf(item);
        const unread = isUnread(item);
        return <li key={item.id}>
          <button type="button" className={'notif-item' + (unread ? ' is-unread' : '')} data-category={category} onClick={() => onOpen(item)}>
            <span className="notif-icon" aria-hidden="true"><Icon name={CATEGORIES[category].icon}/></span>
            <span className="notif-text">
              <strong className="notif-title">{item.title}</strong>
              <span className="notif-detail">{item.context?.label || item.body}</span>
              <span className="notif-meta">
                <span>{CATEGORIES[category].label}</span> · <time dateTime={item.created_at}>{relativeTime(item.created_at, now)}</time>
                {item.related?.length > 0 && <> · <span>{item.related.length === 1 ? '1 aviso anterior' : `${item.related.length} avisos anteriores`}</span></>}
              </span>
            </span>
            {unread && <span className="notif-new"><span className="notif-dot" aria-hidden="true"/>Nueva</span>}
          </button>
        </li>;
      })}
    </ul>
  </section>);
}
