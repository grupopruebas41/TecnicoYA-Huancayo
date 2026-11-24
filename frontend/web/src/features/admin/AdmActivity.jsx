import React, {useState} from 'react';
import {eventLabel} from './adminRules';
import {clock, limaDay, relativeTime, shortDay} from './homeFormat';
import {EmptyState} from '../client/ui';
import Icon from '../panel/icons';

/**
 * Revisión del #69: «Actividad reciente» del Inicio del administrador como línea de tiempo. Hora de Lima en su columna
 * (con «hace N h» en el title), agrupada por día, un punto de color con ícono sobre la línea y, siempre, una etiqueta de
 * tipo en texto (el color nunca es lo único). Chips de filtro en el cliente sobre los eventos recibidos y pie hacia
 * Auditoría. Clases con el prefijo adm-.
 */
const TYPES = {users: 'Usuarios', technicians: 'Técnicos', content: 'Contenido', other: 'Otros'};
const FILTERS = [['all', 'Todo'], ['users', 'Usuarios'], ['technicians', 'Técnicos'], ['content', 'Contenido']];

const DANGER = new Set(['user.blocked', 'user.anonymized', 'technician.suspended']);
const SUCCESS = new Set(['user.unblocked', 'technician.reactivated', 'technician.review', 'technician.reviewed',
  'technician.verification.approved', 'catalog.keyword_suggestion_approved']);

/** Tipo (para el filtro y la etiqueta), tono (color) e ícono de una acción de auditoría. */
function categoryOf(action) {
  if (action.startsWith('user.') || action.startsWith('client.plan')) return 'users';
  if (action.startsWith('technician.')) return 'technicians';
  if (action.startsWith('announcement.') || action.startsWith('catalog.')) return 'content';
  return 'other';
}

function contentIcon(action) {
  if (action.includes('keyword')) return 'search';
  return action.startsWith('catalog.') ? 'catalog' : 'announcements';
}

export function classify(action = '') {
  const category = categoryOf(action);
  if (DANGER.has(action)) return {category, tone: 'danger', icon: 'lock'};
  if (SUCCESS.has(action)) return {category, tone: 'success', icon: category === 'technicians' ? 'verify' : 'check'};
  if (category === 'content') return {category, tone: 'info', icon: contentIcon(action)};
  if (category === 'users') return {category, tone: 'warning', icon: action.startsWith('client.plan') ? 'star' : 'users'};
  if (category === 'technicians') return {category, tone: 'warning', icon: 'verify'};
  return {category, tone: 'slate', icon: 'info'};
}

/** Grupos por día de Lima, en el orden recibido (de lo más nuevo a lo más antiguo). */
function byDay(events, now) {
  const today = limaDay(now);
  const yesterday = limaDay(new Date(now.getTime() - 86400000));
  const groups = [];
  events.forEach(event => {
    const key = limaDay(new Date(event.occurred_at));
    let label = shortDay(key);
    if (key === today) label = 'Hoy';
    else if (key === yesterday) label = 'Ayer';
    if (groups.at(-1)?.key !== key) groups.push({key, label, items: []});
    groups.at(-1).items.push(event);
  });
  return groups;
}

function Event({event, index, now}) {
  const {tone, icon, category} = classify(event.action);
  return <li className="adm-event" data-tone={tone} style={{'--i': Math.min(index, 9)}}>
    <time className="adm-event-time" dateTime={event.occurred_at} title={relativeTime(event.occurred_at, now)}>{clock(event.occurred_at)}</time>
    <span className="adm-event-dot" aria-hidden="true"><Icon name={icon}/></span>
    <div className="adm-event-body">
      <div className="adm-event-head">
        <strong className="adm-event-title">{eventLabel(event.action)}</strong>
        <span className="adm-event-type">{TYPES[category]}</span>
      </div>
      {event.reason && <span className="adm-event-reason" title={event.reason}>{event.reason}</span>}
      {event.actor && <small className="adm-event-actor">{event.actor}</small>}
    </div>
  </li>;
}

export default function AdmActivity({events = [], navigate = null, canSeeAll = false}) {
  const [filter, setFilter] = useState('all');
  const now = new Date();
  const shown = filter === 'all' ? events : events.filter(event => classify(event.action).category === filter);
  let index = 0;
  return <section className="adm-card adm-activity" aria-labelledby="adm-activity-title">
    <header className="adm-card-head">
      <h3 id="adm-activity-title">Actividad reciente</h3>
      {events.length > 0 && <div className="adm-chips" role="group" aria-label="Filtrar actividad">
        {FILTERS.map(([key, label]) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}
      </div>}
    </header>
    {events.length === 0 && <EmptyState icon="clock" tone="slate" title="Todavía no hay actividad"
      text="Aquí verás lo último que se hizo en el panel: altas, revisiones, comunicados y más."/>}
    {events.length > 0 && shown.length === 0 && <p className="muted adm-activity-none">No hay actividad de este tipo en las últimas acciones.</p>}
    {shown.length > 0 && <div className="adm-timeline">
      {byDay(shown, now).map(group => <div key={group.key} className="adm-day">
        <h4 className="adm-day-label">{group.label}</h4>
        <div className="adm-day-events">
          <span className="adm-timeline-line" aria-hidden="true"/>
          <ol className="adm-timeline-list">
            {group.items.map(event => <Event key={`${event.occurred_at}-${event.action}-${event.reason}`} event={event} index={index++} now={now}/>)}
          </ol>
        </div>
      </div>)}
    </div>}
    {events.length > 0 && canSeeAll && navigate && <footer className="adm-activity-foot">
      <button type="button" className="text-button" onClick={() => navigate('audit')}>Ver toda la actividad <Icon name="chevron"/></button>
    </footer>}
  </section>;
}
