import React, {useCallback, useEffect, useRef, useState} from 'react';
import {request} from '../administration/http';
import {useRealtimeResource} from '../realtime/Realtime';
import useDismiss from './useDismiss';
import Icon from './icons';

/**
 * Campana de la barra superior: lista los avisos recientes de GET /notifications y cuenta los sin leer.
 * DEF-49: la bandeja responde {items, pagination, unread_count} (contrato S4 §7.1 y D-90), no un arreglo; el contador
 * viene de unread_count, que incluye los avisos fuera de la primera página. Se recarga con notification.created.
 */
export default function NotificationBell({userId, onOpenAll}) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const button = useRef(null);
  const active = useRef(true);
  const load = useCallback(() => Promise.resolve().then(() => request('/notifications'))
    .then(result => {
      if (!active.current) return;
      const list = Array.isArray(result?.data?.items) ? result.data.items : [];
      setItems(list); setFailed(false);
      setUnread(Number.isInteger(result.data.unread_count) ? result.data.unread_count : list.filter(item => !item.read_at).length);
    })
    // Un fallo de la campana nunca debe tumbar el panel: cualquier error deja el aviso dentro del popover.
    .catch(() => { if (active.current) setFailed(true); }), []);
  useEffect(() => { active.current = true; load(); return () => { active.current = false; }; }, [load]);
  useRealtimeResource(userId ? `users.${userId}` : null, ['notification.created'], load);
  const root = useDismiss(open, () => setOpen(false));
  function close() { setOpen(false); button.current?.focus(); }
  return <div className="panel-bell" ref={root} onKeyDown={event => { if (event.key === 'Escape' && open) close(); }}>
    <button ref={button} type="button" className="panel-icon-button" aria-label={`Notificaciones: ${unread} sin leer`}
      aria-expanded={open} aria-controls="panel-notifications" onClick={() => setOpen(!open)}>
      <Icon name="bell"/>
      {unread > 0 && <span className="panel-badge" aria-hidden="true">{unread > 9 ? '9+' : unread}</span>}
    </button>
    {open && <section id="panel-notifications" className="panel-popover" aria-label="Notificaciones recientes">
      {failed ? <p className="error" role="alert">No pudimos cargar tus notificaciones.</p>
        : items.length ? <ul>{items.slice(0, 8).map(item => <li key={item.id} className={item.read_at ? '' : 'is-unread'}>{item.title}</li>)}</ul>
          : <p className="muted">No tienes notificaciones.</p>}
      {onOpenAll && <button type="button" className="text-button" onClick={() => { setOpen(false); onOpenAll(); }}>Ver todas</button>}
    </section>}
  </div>;
}
