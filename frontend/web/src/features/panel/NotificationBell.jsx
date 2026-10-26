import React, {useEffect, useRef, useState} from 'react';
import {request} from '../administration/http';
import useDismiss from './useDismiss';

/** Campana de la barra superior: cuenta los avisos sin leer de GET /notifications y lista los recientes. */
export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const button = useRef(null);
  useEffect(() => {
    let active = true;
    // Un fallo de la campana nunca debe tumbar el panel: cualquier error deja el aviso dentro del popover.
    Promise.resolve().then(() => request('/notifications'))
      .then(result => { if (active) setItems(Array.isArray(result?.data) ? result.data : []); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  const unread = items.filter(item => !item.read_at).length;
  const root = useDismiss(open, () => setOpen(false));
  function close() { setOpen(false); button.current?.focus(); }
  return <div className="panel-bell" ref={root} onKeyDown={event => { if (event.key === 'Escape' && open) close(); }}>
    <button ref={button} type="button" className="panel-icon-button" aria-label={`Notificaciones: ${unread} sin leer`}
      aria-expanded={open} aria-controls="panel-notifications" onClick={() => setOpen(!open)}>
      <span aria-hidden="true">🔔</span>
      {unread > 0 && <span className="panel-badge" aria-hidden="true">{unread > 9 ? '9+' : unread}</span>}
    </button>
    {open && <section id="panel-notifications" className="panel-popover" aria-label="Notificaciones recientes">
      {failed ? <p className="error" role="alert">No pudimos cargar tus notificaciones.</p>
        : items.length ? <ul>{items.slice(0, 8).map(item => <li key={item.id} className={item.read_at ? '' : 'is-unread'}>{item.title}</li>)}</ul>
          : <p className="muted">No tienes notificaciones.</p>}
    </section>}
  </div>;
}
