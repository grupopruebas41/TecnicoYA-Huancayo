import React, {useCallback, useEffect, useState} from 'react';
import {request} from '../administration/http';
import {ConnectionStatus, useRealtimeResource} from '../realtime/Realtime';
import Pagination from './Pagination';
import Icon from '../panel/icons';
import {NOTIFICATION_TYPES, dayLabel, formatTime} from './clientRules';

const PER_PAGE = 20;
const STATES = [['', 'Todas'], ['unread', 'No leídas'], ['read', 'Leídas']];
const ICONS = {'request.awaiting_choice': 'check', 'request.pending': 'clock', 'request.direct_declined': 'alert', 'request.expired': 'close'};
const typeLabel = type => NOTIFICATION_TYPES.find(([code]) => code === type)?.[1] || 'Aviso';

/** Grupos consecutivos por día en hora de Lima: «Hoy», «Ayer» o la fecha. Los avisos llegan del más reciente al más antiguo. */
function byDay(items) {
  const groups = [];
  items.forEach(item => {
    const label = dayLabel(item.created_at);
    if (groups.at(-1)?.label === label) groups.at(-1).items.push(item);
    else groups.push({label, items: [item]});
  });
  return groups;
}

function Chips({label, options, value, onChange}) {
  return <div className="client-chip-group" role="group" aria-label={label}>
    {options.map(([code, text]) => <button key={code || 'all'} type="button" className="client-filter-chip" aria-pressed={value === code}
      onClick={() => onChange(code)}>{text}</button>)}
  </div>;
}

/**
 * Bandeja completa del cliente (D-90, adelanto de HU-S08-03): filtros por estado y tipo, marcar una o todas como
 * leídas (solo las propias; el servidor responde 404 a una ajena) y recarga con notification.created.
 * Revisión del PR #39: agrupada por día, ícono por tipo, punto en las no leídas y filtros como chips.
 */
export default function NotificationsPage({userId, onChange = () => {}}) {
  const [filters, setFilters] = useState({state: '', type: '', page: 1});
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const load = useCallback(async () => {
    const query = new URLSearchParams(Object.entries({state: filters.state, type: filters.type, per_page: PER_PAGE,
      page: filters.page > 1 ? filters.page : ''}).filter(([, value]) => value !== '')).toString();
    try {
      const result = await request(`/notifications?${query}`);
      setData(result.data); setError('');
    } catch (failure) {
      setError(failure.message || 'No pudimos cargar tus notificaciones.');
    } finally { setLoading(false); }
  }, [filters]);
  useEffect(() => { setLoading(true); load(); }, [load]);
  const connected = useRealtimeResource(`users.${userId}`, ['notification.created'], () => { load(); onChange(); });
  const change = (name, value) => { setSuccess(''); setFilters(current => ({...current, [name]: value, page: 1})); };
  async function markOne(item) {
    setBusy(true); setError(''); setSuccess('');
    try {
      const result = await request(`/notifications/${item.id}/read`, {}, 'POST');
      setData(current => ({...current, unread_count: Math.max(0, current.unread_count - 1),
        items: current.items.map(entry => (entry.id === item.id ? result.data : entry))}));
      setSuccess('Marcamos la notificación como leída.'); onChange();
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  async function markAll() {
    setBusy(true); setError(''); setSuccess('');
    try {
      const {updated} = (await request('/notifications/read-all', {}, 'POST')).data;
      await load();
      setSuccess(updated === 1 ? 'Marcamos 1 notificación como leída.' : `Marcamos ${updated} notificaciones como leídas.`); onChange();
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  const items = data?.items || [];
  return <section className="panel-page client-notifications" aria-label="Notificaciones" aria-busy={loading}>
    <div className="client-block-head">
      <h2>Notificaciones</h2>
      <button type="button" className="button primary" disabled={busy || !data?.unread_count} onClick={markAll}>Marcar todas como leídas</button>
    </div>
    <ConnectionStatus connected={connected}/>
    <div className="client-filters">
      <Chips label="Filtrar por estado" options={STATES} value={filters.state} onChange={value => change('state', value)}/>
      <Chips label="Filtrar por tipo" options={[['', 'Todos los tipos'], ...NOTIFICATION_TYPES]} value={filters.type}
        onChange={value => change('type', value)}/>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    {success && <output className="notice">{success}</output>}
    {loading && !data && <p className="muted">Cargando notificaciones…</p>}
    {data && !items.length && <div className="client-empty">
      <span aria-hidden="true"><Icon name="bell"/></span>
      <p><strong>No hay notificaciones con estos filtros</strong></p>
      <p className="muted">Te avisaremos aquí cuando un técnico acepte o cambie el estado de tus solicitudes.</p>
    </div>}
    {byDay(items).map(group => <section key={group.label} className="client-day" aria-label={group.label}>
      <h3>{group.label}</h3>
      <ul className="client-inbox">
        {group.items.map(item => <li key={item.id} className={item.read_at ? 'is-read' : 'is-unread'}>
          <span className="client-inbox-icon" aria-hidden="true"><Icon name={ICONS[item.type] || 'bell'}/></span>
          <div>
            <strong>{!item.read_at && <span className="client-unread-dot" aria-hidden="true"/>}{item.title}</strong>
            <p>{item.body}</p>
            <small className="muted">{typeLabel(item.type)} · {formatTime(item.created_at)} · <span>{item.read_at ? 'Leída' : 'Sin leer'}</span></small>
          </div>
          {!item.read_at && <button type="button" className="text-button" disabled={busy} onClick={() => markOne(item)}>Marcar como leída</button>}
        </li>)}
      </ul>
    </section>)}
    {(data?.pagination?.last_page || 1) > 1 && <Pagination label="Páginas de notificaciones" page={filters.page}
      lastPage={data.pagination.last_page} disabled={loading} onChange={page => setFilters({...filters, page})}/>}
  </section>;
}
