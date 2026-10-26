import React, {useEffect, useState} from 'react';
import {AUDIENCE_TAGS, PHASE_LABELS} from './announcementRules';

// Orden del carrusel por audiencia (D-83). Se reordena arrastrando la fila, con Subir y Bajar, o con las flechas
// sobre el asa; «Guardar orden» envía la lista completa (PUT /admin/announcements/order).
const position = (item, audience) => item.positions?.[audience] || 0;
function sorted(items, audience) {
  return items.filter(item => item.status !== 'retired' && item.audiences?.includes(audience))
    .map((item, index) => ({item, index}))
    .sort((a, b) => {
      const [pa, pb] = [position(a.item, audience), position(b.item, audience)];
      if ((pa === 0) !== (pb === 0)) return pa === 0 ? 1 : -1;
      return pa - pb || a.index - b.index;
    })
    .map(({item}) => item);
}

export default function CarouselOrder({items, run}) {
  const [audience, setAudience] = useState('client');
  const [order, setOrder] = useState(null);
  const [dragged, setDragged] = useState(null);
  const [live, setLive] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setOrder(null); setLive(''); }, [audience, items]);
  const rows = order ?? sorted(items, audience);

  function move(from, to) {
    if (to < 0 || to >= rows.length || from === to) return;
    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setOrder(next);
    setLive(`«${item.title}»: posición ${to + 1} de ${next.length}.`);
  }
  async function save() {
    setBusy(true);
    await run(['/admin/announcements/order', {audience, ids: rows.map(item => item.id)}, 'PUT'], 'Orden del carrusel guardado.');
    setBusy(false);
  }
  return <div className="carousel-order">
    <div className="carousel-order-head">
      <div className="announcement-viewports" role="group" aria-label="Audiencia del carrusel">
        {Object.entries(AUDIENCE_TAGS).map(([value, label]) =>
          <button key={value} type="button" aria-pressed={audience === value} onClick={() => setAudience(value)}>{label}</button>)}
      </div>
      <p className="muted">Arrastra las filas, usa Subir y Bajar, o enfoca el asa ⠿ y usa las flechas. Los borradores guardan su lugar para cuando se publiquen.</p>
    </div>
    {!rows.length ? <p>No hay comunicados para esta audiencia.</p> : <ol className="carousel-order-list">
      {rows.map((item, index) => <li key={item.id} draggable className={dragged === item.id ? 'is-dragging' : ''}
        onDragStart={event => { setDragged(item.id); if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'; }}
        onDragOver={event => event.preventDefault()}
        onDrop={event => { event.preventDefault(); move(rows.findIndex(row => row.id === dragged), index); setDragged(null); }}
        onDragEnd={() => setDragged(null)}>
        <button type="button" className="order-handle" aria-label={`Mover «${item.title}»`}
          onKeyDown={event => {
            if (event.key === 'ArrowUp') { event.preventDefault(); move(index, index - 1); }
            if (event.key === 'ArrowDown') { event.preventDefault(); move(index, index + 1); }
          }}><span aria-hidden="true">⠿</span></button>
        <span className="order-position" aria-hidden="true">{index + 1}</span>
        {item.image_url ? <img className="order-thumb" src={item.image_url} alt=""/> : <span className="order-thumb is-empty" aria-hidden="true">{item.source === 'genially' ? 'G' : 'T'}</span>}
        <strong>{item.title}</strong>
        <span className={`announcement-phase is-${item.phase}`}>{PHASE_LABELS[item.phase]}</span>
        <span className="order-buttons">
          <button type="button" disabled={index === 0} aria-label={`Subir «${item.title}»`} onClick={() => move(index, index - 1)}>↑</button>
          <button type="button" disabled={index === rows.length - 1} aria-label={`Bajar «${item.title}»`} onClick={() => move(index, index + 1)}>↓</button>
        </span>
      </li>)}
    </ol>}
    <p className="muted carousel-order-live" aria-live="polite">{live}</p>
    <button type="button" className="button primary" disabled={busy || !order} onClick={save}>Guardar orden</button>
  </div>;
}
