import React, {useCallback, useEffect, useState} from 'react';
import {request} from '../administration/http';
import {ConnectionStatus, useRealtimeResource} from '../realtime/Realtime';
import {NOTIFICATION_TYPES, formatDate} from './clientRules';

const PER_PAGE = 20;
const typeLabel = type => NOTIFICATION_TYPES.find(([code]) => code === type)?.[1] || 'Aviso';

/**
 * Bandeja completa del cliente (D-90, adelanto de HU-S08-03): filtros por estado y tipo, marcar una o todas como
 * leídas (solo las propias; el servidor responde 404 a una ajena) y recarga con notification.created.
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
  const lastPage = data?.pagination?.last_page || 1;
  return <section className="panel-page client-notifications" aria-label="Notificaciones" aria-busy={loading}>
    <div className="client-block-head">
      <h2>Notificaciones</h2>
      <button type="button" className="button outline" disabled={busy || !data?.unread_count} onClick={markAll}>Marcar todas como leídas</button>
    </div>
    <ConnectionStatus connected={connected}/>
    <div className="request-filters">
      <label>Estado
        <select value={filters.state} onChange={event => change('state', event.target.value)}>
          <option value="">Todas</option><option value="unread">No leídas</option><option value="read">Leídas</option>
        </select>
      </label>
      <label>Tipo
        <select value={filters.type} onChange={event => change('type', event.target.value)}>
          <option value="">Todos</option>
          {NOTIFICATION_TYPES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
      </label>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    {success && <output className="notice">{success}</output>}
    {loading && !data && <p className="muted">Cargando notificaciones…</p>}
    {data && !items.length && <p className="muted">No hay notificaciones con estos filtros.</p>}
    <ul className="client-inbox">
      {items.map(item => <li key={item.id} className={item.read_at ? 'is-read' : 'is-unread'}>
        <div>
          <strong>{item.title}</strong>
          <p>{item.body}</p>
          <small className="muted">{typeLabel(item.type)} · {formatDate(item.created_at)} · <span>{item.read_at ? 'Leída' : 'Sin leer'}</span></small>
        </div>
        {!item.read_at && <button type="button" className="text-button" disabled={busy} onClick={() => markOne(item)}>Marcar como leída</button>}
      </li>)}
    </ul>
    {lastPage > 1 && <nav className="request-actions" aria-label="Páginas de notificaciones">
      <button type="button" disabled={filters.page <= 1} onClick={() => setFilters({...filters, page: filters.page - 1})}>Página anterior</button>
      <span>Página {filters.page} de {lastPage}</span>
      <button type="button" disabled={filters.page >= lastPage} onClick={() => setFilters({...filters, page: filters.page + 1})}>Página siguiente</button>
    </nav>}
  </section>;
}
