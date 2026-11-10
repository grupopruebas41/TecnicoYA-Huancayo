import React, {useCallback, useEffect, useState} from 'react';
import {request} from '../administration/http';
import {ConnectionStatus, useRealtimeResource} from '../realtime/Realtime';
import Pagination from './Pagination';
import {NOTIFICATION_TYPES} from './clientRules';
import {EmptyNotifications, NotificationList, markOpened} from '../panel/notificationView';

const PER_PAGE = 20;
const TABS = [['', 'Todas'], ['unread', 'No leídas']];

/**
 * Bandeja completa del cliente (D-90, adelanto de HU-S08-03). Rediseño de la campana (Fase 4): el mismo diseño del panel
 * desplegable (encabezado con «N nuevas» y «Marcar todas como leídas», pestañas Todas y No leídas, grupos Hoy, Ayer y
 * Anteriores, contexto del pedido y tiempo relativo). Abrir un aviso lo marca como leído y lleva a su solicitud.
 * Solo se marcan los propios: el servidor responde 404 a uno ajeno. Se recarga con notification.created.
 */
export default function NotificationsPage({userId, role = 'client', onChange = () => {}, onOpen = () => {}}) {
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
  async function open(item) {
    setBusy(true); setError(''); setSuccess('');
    try {
      await markOpened(item); onChange(); onOpen(item);
      await load();
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
  const unread = data?.unread_count || 0;
  return <section className="panel-page client-notifications notif-page" aria-label="Notificaciones" aria-busy={loading}>
    <header className="notif-head">
      <h2>Notificaciones</h2>
      {unread > 0 && <span className="notif-count">{unread === 1 ? '1 nueva' : `${unread} nuevas`}</span>}
      <button type="button" className="button primary" disabled={busy || !unread} onClick={markAll}>Marcar todas como leídas</button>
    </header>
    <ConnectionStatus connected={connected}/>
    <div className="notif-tabs" role="tablist" aria-label="Filtrar notificaciones">
      {TABS.map(([code, label]) => <button key={code || 'all'} type="button" role="tab" aria-selected={filters.state === code}
        onClick={() => change('state', code)}>{label}</button>)}
    </div>
    <div className="client-chip-group" role="group" aria-label="Filtrar por tipo">
      {[['', 'Todos los tipos'], ...NOTIFICATION_TYPES].map(([code, text]) => <button key={code || 'all'} type="button"
        className="client-filter-chip" aria-pressed={filters.type === code} onClick={() => change('type', code)}>{text}</button>)}
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    {success && <output className="notice">{success}</output>}
    {loading && !data && <p className="muted">Cargando notificaciones…</p>}
    {data && !items.length && <EmptyNotifications filtered={Boolean(filters.state || filters.type)} role={role}/>}
    <div className="notif-body">
      <NotificationList items={items} onOpen={open}/>
    </div>
    {(data?.pagination?.last_page || 1) > 1 && <Pagination label="Páginas de notificaciones" page={filters.page}
      lastPage={data.pagination.last_page} disabled={loading} onChange={page => setFilters({...filters, page})}/>}
  </section>;
}
