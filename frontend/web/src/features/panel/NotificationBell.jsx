import React, {useCallback, useEffect, useRef, useState} from 'react';
import {request} from '../administration/http';
import {useRealtimeResource} from '../realtime/Realtime';
import useDismiss from './useDismiss';
import Icon from './icons';
import {EmptyNotifications, NotificationList, markOpened} from './notificationView';

const TABS = [['all', 'Todas'], ['unread', 'No leídas']];

/**
 * Campana de la barra superior. DEF-49: la bandeja responde {items, pagination, unread_count} (contrato S4 §7.1, D-90) y
 * el contador viene de unread_count. Se recarga con notification.created.
 * Rediseño (Fase 4): encabezado con «N nuevas» y «Marcar todas como leídas», pestañas Todas y No leídas, lista con
 * contexto y tiempo relativo, estado vacío ilustrado y «Ver todas las notificaciones». Al abrir un aviso lo marca como
 * leído y lleva a su destino (onOpen). Esc cierra y devuelve el foco a la campana; el número de no leídas se anuncia.
 */
export default function NotificationBell({userId, onOpenAll, onOpen}) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const button = useRef(null);
  const tabs = useRef({});
  const active = useRef(true);
  const load = useCallback(() => Promise.resolve().then(() => request(tab === 'unread' ? '/notifications?state=unread&per_page=20' : '/notifications'))
    .then(result => {
      if (!active.current) return;
      const list = Array.isArray(result?.data?.items) ? result.data.items : [];
      setItems(list); setFailed(false);
      setUnread(Number.isInteger(result.data.unread_count) ? result.data.unread_count : list.filter(item => !item.read_at).length);
    })
    // Un fallo de la campana nunca debe tumbar el panel: cualquier error deja el aviso dentro del panel.
    .catch(() => { if (active.current) setFailed(true); }), [tab]);
  useEffect(() => { active.current = true; load(); return () => { active.current = false; }; }, [load]);
  useEffect(() => { if (open) (tabs.current.unread?.getAttribute('aria-selected') === 'true' ? tabs.current.unread : tabs.current.all)?.focus(); }, [open]);
  useRealtimeResource(userId ? `users.${userId}` : null, ['notification.created'], load);
  const root = useDismiss(open, () => setOpen(false));
  function close() { setOpen(false); button.current?.focus(); }
  async function markAll() {
    setBusy(true); setError('');
    try { await request('/notifications/read-all', {}); await load(); }
    catch (failure) { setError(failure.message || 'No pudimos marcar tus notificaciones.'); }
    finally { setBusy(false); }
  }
  async function openItem(item) {
    setError('');
    try { await markOpened(item); } catch (failure) { setError(failure.message || 'No pudimos marcar la notificación.'); }
    setOpen(false);
    load();
    onOpen?.(item);
  }
  function arrows(event) {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const next = tab === 'all' ? 'unread' : 'all';
    setTab(next); tabs.current[next]?.focus();
  }
  return <div className="panel-bell" ref={root} onKeyDown={event => { if (event.key === 'Escape' && open) close(); }}>
    <button ref={button} type="button" className="panel-icon-button" aria-label={`Notificaciones: ${unread} sin leer`}
      aria-expanded={open} aria-controls="panel-notifications" onClick={() => setOpen(!open)}>
      <Icon name="bell"/>
      {unread > 0 && <span className="panel-badge" aria-hidden="true">{unread > 9 ? '9+' : unread}</span>}
    </button>
    <span className="sr-only" aria-live="polite">{unread === 1 ? '1 notificación sin leer' : `${unread} notificaciones sin leer`}</span>
    {open && <section id="panel-notifications" className="panel-popover notif-panel" aria-label="Notificaciones recientes">
      <header className="notif-head">
        <h2>Notificaciones</h2>
        {unread > 0 && <span className="notif-count">{unread === 1 ? '1 nueva' : `${unread} nuevas`}</span>}
        <button type="button" className="text-button notif-mark-all" disabled={busy || unread === 0} onClick={markAll}>Marcar todas como leídas</button>
        <button type="button" className="panel-icon-button notif-close" aria-label="Cerrar notificaciones" onClick={close}><Icon name="close"/></button>
      </header>
      <div className="notif-tabs" role="tablist" aria-label="Filtrar notificaciones" onKeyDown={arrows}>
        {TABS.map(([id, label]) => <button key={id} ref={el => { tabs.current[id] = el; }} type="button" role="tab" aria-selected={tab === id}
          tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)}>{label}</button>)}
      </div>
      <div className="notif-body" role="tabpanel">
        {error && <p className="error" role="alert">{error}</p>}
        {failed ? <p className="error" role="alert">No pudimos cargar tus notificaciones.</p>
          : items.length ? <NotificationList items={items} onOpen={openItem}/> : <EmptyNotifications filtered={tab === 'unread'}/>}
      </div>
      {onOpenAll && <footer className="notif-foot">
        <button type="button" className="button outline notif-all" onClick={() => { setOpen(false); onOpenAll(); }}>Ver todas las notificaciones</button>
      </footer>}
    </section>}
  </div>;
}
