import React, {useEffect, useRef, useState} from 'react';
import ConfirmDialog from '../../components/ConfirmDialog';
import useDismiss from '../panel/useDismiss';
import {AUDIENCE_TAGS, KIND_LABELS, PHASE_LABELS, phaseOf} from './announcementRules';

const dateFormat = new Intl.DateTimeFormat('es-PE', {day: 'numeric', month: 'short'});
const yearFormat = new Intl.DateTimeFormat('es-PE', {day: 'numeric', month: 'short', year: 'numeric'});
export function dateRange(item) {
  if (!item.starts_at || !item.ends_at) return 'Sin fechas';
  return `${dateFormat.format(new Date(item.starts_at))} – ${yearFormat.format(new Date(item.ends_at))}`;
}

/**
 * Acciones de un comunicado según su estado (D-83 y D-84): «Editar» siempre; publicar solo el borrador; eliminar
 * el borrador, el vencido y el retirado. Un vigente o programado muestra «Eliminar» deshabilitado con el motivo.
 */
function actionsFor(item) {
  const phase = phaseOf(item);
  if (phase === 'retired') return ['edit', 'duplicate', 'delete'];
  if (phase === 'draft') return ['edit', 'publish', 'duplicate', 'retire', 'delete'];
  return ['edit', 'duplicate', 'unpublish', 'retire', 'delete'];
}
const ACTION_LABELS = {edit: 'Editar', publish: 'Publicar', duplicate: 'Duplicar', unpublish: 'Despublicar', retire: 'Retirar', delete: 'Eliminar'};
const DELETE_BLOCKED = 'Despublícalo antes de eliminarlo.';
const deleteBlocked = item => ['active', 'scheduled'].includes(phaseOf(item));

function ActionsMenu({item, onAction}) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const button = useRef(null);
  const root = useDismiss(open, () => setOpen(false));
  const close = () => { setOpen(false); button.current?.focus(); };
  const reasonId = `announcement-delete-reason-${item.id}`;
  // En la última fila el menú se abre hacia arriba para no salir del contenido (mide unos 280 px).
  const toggle = () => {
    const rect = button.current?.getBoundingClientRect();
    setUp(Boolean(rect) && window.innerHeight - rect.bottom < 290 && rect.top > 290);
    setOpen(!open);
  };
  return <div className="announcement-menu" ref={root}>
    <button ref={button} type="button" className="announcement-menu-button" aria-haspopup="menu" aria-expanded={open}
      aria-label={`Acciones de «${item.title}»`} onClick={toggle}><span aria-hidden="true">⋯</span></button>
    {open && <div role="menu" className={'panel-popover announcement-menu-list' + (up ? ' opens-up' : '')} aria-label={`Acciones de «${item.title}»`}
      onKeyDown={event => { if (event.key === 'Escape') close(); }}>
      {actionsFor(item).map(action => {
        const blocked = action === 'delete' && deleteBlocked(item);
        return <button key={action} type="button" role="menuitem" aria-disabled={action === 'delete' ? String(blocked) : undefined}
          aria-describedby={blocked ? reasonId : undefined} className={action === 'delete' ? 'is-danger' : undefined}
          onClick={() => { if (blocked) return; setOpen(false); onAction(action, item); }}>{ACTION_LABELS[action]}</button>;
      })}
      {deleteBlocked(item) && <small id={reasonId} className="announcement-menu-reason">{DELETE_BLOCKED}</small>}
    </div>}
  </div>;
}

function AnnouncementCard({item, onAction}) {
  const phase = phaseOf(item);
  const titleId = `announcement-card-title-${item.id}`;
  // Un clic en la tarjeta abre el editor; el título es el botón para el teclado. El menú «⋯» no abre el editor.
  const open = event => { if (!event.target.closest('.announcement-menu')) onAction('edit', item); };
  return <article className="announcement-card is-clickable" aria-labelledby={titleId} onClick={open}>
    <div className="announcement-thumb">
      {item.image_url ? <img src={item.image_url} alt=""/> : <span className="announcement-thumb-empty">{item.source === 'genially' ? 'Genially' : 'Texto'}</span>}
    </div>
    <div className="announcement-card-body">
      <div className="announcement-card-top">
        <span className={`announcement-phase is-${phase}`}>{PHASE_LABELS[phase]}</span>
        <ActionsMenu item={item} onAction={onAction}/>
      </div>
      <h3 id={titleId}><button type="button" className="announcement-card-open">{item.title}</button></h3>
      <ul className="announcement-tags" aria-label="Etiquetas">
        {(item.audiences || []).map(audience => <li key={audience} className="tag is-audience">{AUDIENCE_TAGS[audience]}</li>)}
        {item.kind && <li className="tag is-kind">{KIND_LABELS[item.kind]}</li>}
        {item.source === 'genially' && <li className="tag">Genially</li>}
      </ul>
      <p className="announcement-dates muted">{dateRange(item)}</p>
    </div>
  </article>;
}

/** D-84: confirmación de la eliminación definitiva; muestra la miniatura y el título y pide escribir ELIMINAR. */
function DeleteDialog({item, busy, onCancel, onConfirm}) {
  const [typed, setTyped] = useState('');
  const root = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    root.current.querySelector('input').focus();
    return () => previous?.focus();
  }, []);
  function keys(event) {
    if (event.key === 'Escape' && !busy) onCancel();
    if (event.key !== 'Tab') return;
    const focusable = [...root.current.querySelectorAll('input, button:not(:disabled)')];
    const [first, last] = [focusable[0], focusable.at(-1)];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  const ready = typed === 'ELIMINAR';
  return <div className="s02-modal">
    <dialog open ref={root} aria-modal="true" aria-label="Eliminar comunicado" className="announcement-delete-dialog" onKeyDown={keys}>
      <h2>Eliminar comunicado</h2>
      <div className="announcement-delete-item">
        {item.image_url ? <img src={item.image_url} alt=""/> : <span className="announcement-thumb-empty">{item.source === 'genially' ? 'Genially' : 'Texto'}</span>}
        <strong>{item.title}</strong>
      </div>
      <p>Se borra para siempre junto con su lugar en el carrusel. Las imágenes que ningún otro comunicado use se retiran. La auditoría conserva una copia de sus datos.</p>
      <form noValidate onSubmit={event => { event.preventDefault(); if (ready && !busy) onConfirm(); }}>
        <label htmlFor="announcement-delete-confirmation">Escribe ELIMINAR para confirmar</label>
        <input id="announcement-delete-confirmation" autoComplete="off" value={typed} disabled={busy} onChange={event => setTyped(event.target.value)}/>
        <div className="announcement-delete-actions">
          <button type="button" disabled={busy} onClick={onCancel}>Cancelar</button>
          <button type="submit" className="is-danger" disabled={!ready || busy} aria-busy={busy}>Eliminar definitivamente</button>
        </div>
      </form>
    </dialog>
  </div>;
}

/** Listado en cuadrícula con filtros por audiencia y estado; cada tarjeta tiene su menú «⋯». */
export default function AnnouncementList({items, onEdit, run}) {
  const [audience, setAudience] = useState('');
  const [phase, setPhase] = useState('');
  const [showRetired, setShowRetired] = useState(false);
  const [retiring, setRetiring] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  // Los retirados se ocultan por defecto; el filtro de estado «Retirado» los muestra aparte.
  const visible = items.filter(item => (!audience || item.audiences?.includes(audience))
    && (phase ? phaseOf(item) === phase : showRetired || phaseOf(item) !== 'retired'));
  const base = item => `/admin/announcements/${item.id}`;
  function action(name, item) {
    if (name === 'edit') return onEdit(item);
    if (name === 'retire') return setRetiring(item);
    if (name === 'delete') return setDeleting(item);
    const requests = {
      publish: [() => [`${base(item)}/publication`, {expected_version: item.version}], 'Comunicado publicado.'],
      unpublish: [() => [`${base(item)}/publication`, {expected_version: item.version}, 'DELETE'], 'Comunicado despublicado: volvió a borrador.'],
      duplicate: [() => [`${base(item)}/duplicates`, {}, 'POST'], 'Copia creada como borrador.'],
    };
    const [args, message] = requests[name];
    return run(args(), message);
  }
  async function confirm(args, message, close) {
    setBusy(true);
    await run(args, message);
    setBusy(false);
    close(null);
  }
  return <>
    <div className="announcement-filters">
      <label><span>Filtrar por audiencia</span>
        <select value={audience} onChange={event => setAudience(event.target.value)}>
          <option value="">Todas</option><option value="client">Clientes</option><option value="technician">Técnicos</option>
        </select></label>
      <label><span>Filtrar por estado</span>
        <select value={phase} onChange={event => setPhase(event.target.value)}>
          <option value="">Todos</option>
          {Object.entries(PHASE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
      <label className="announcement-show-retired">
        <input type="checkbox" checked={showRetired} onChange={event => setShowRetired(event.target.checked)}/>
        <span>Mostrar retirados</span>
      </label>
      <p className="muted">{visible.length} de {items.length}</p>
    </div>
    {items.length > 0 && !visible.length && <p>Ningún comunicado coincide con los filtros.</p>}
    {!items.length && <p>Todavía no hay comunicados. Crea el primero con «Crear comunicado».</p>}
    <div className="announcement-grid">
      {visible.map(item => <AnnouncementCard key={item.id} item={item} onAction={action}/>)}
    </div>
    {retiring && <ConfirmDialog busy={busy} title="Retirar comunicado" onCancel={() => setRetiring(null)}
      onConfirm={() => confirm([base(retiring), undefined, 'DELETE'], 'Contenido retirado.', setRetiring)}
      description={`«${retiring.title}» dejará de mostrarse en los paneles. El retiro queda en la auditoría; luego puedes restaurarlo como borrador.`}/>}
    {deleting && <DeleteDialog item={deleting} busy={busy} onCancel={() => setDeleting(null)}
      onConfirm={() => confirm([`${base(deleting)}/permanent`, {expected_version: deleting.version, confirmation: 'ELIMINAR'}, 'DELETE'],
        'Comunicado eliminado definitivamente.', setDeleting)}/>}
  </>;
}
