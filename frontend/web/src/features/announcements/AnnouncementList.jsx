import React, {useRef, useState} from 'react';
import ConfirmDialog from '../../components/ConfirmDialog';
import useDismiss from '../panel/useDismiss';
import {AUDIENCE_TAGS, KIND_LABELS, PHASE_LABELS} from './announcementRules';

const dateFormat = new Intl.DateTimeFormat('es-PE', {day: 'numeric', month: 'short'});
const yearFormat = new Intl.DateTimeFormat('es-PE', {day: 'numeric', month: 'short', year: 'numeric'});
export function dateRange(item) {
  if (!item.starts_at || !item.ends_at) return 'Sin fechas';
  return `${dateFormat.format(new Date(item.starts_at))} – ${yearFormat.format(new Date(item.ends_at))}`;
}

/** Acciones de un comunicado según su estado (D-51 y D-83): solo el borrador se edita o publica. */
const phaseOf = item => item.phase || (item.retired_at || item.status === 'retired' ? 'retired' : item.status === 'draft' ? 'draft' : 'active');
function actionsFor(item) {
  if (phaseOf(item) === 'retired') return ['duplicate'];
  if (item.status === 'draft') return ['edit', 'publish', 'duplicate', 'retire'];
  return ['duplicate', 'unpublish', 'retire'];
}
const ACTION_LABELS = {edit: 'Editar', publish: 'Publicar', duplicate: 'Duplicar', unpublish: 'Despublicar', retire: 'Retirar'};

function ActionsMenu({item, onAction}) {
  const [open, setOpen] = useState(false);
  const button = useRef(null);
  const root = useDismiss(open, () => setOpen(false));
  const close = () => { setOpen(false); button.current?.focus(); };
  return <div className="announcement-menu" ref={root}>
    <button ref={button} type="button" className="announcement-menu-button" aria-haspopup="menu" aria-expanded={open}
      aria-label={`Acciones de «${item.title}»`} onClick={() => setOpen(!open)}><span aria-hidden="true">⋯</span></button>
    {open && <div role="menu" className="panel-popover announcement-menu-list" aria-label={`Acciones de «${item.title}»`}
      onKeyDown={event => { if (event.key === 'Escape') close(); }}>
      {actionsFor(item).map(action => <button key={action} type="button" role="menuitem"
        onClick={() => { setOpen(false); onAction(action, item); }}>{ACTION_LABELS[action]}</button>)}
    </div>}
  </div>;
}

function AnnouncementCard({item, onAction}) {
  const phase = phaseOf(item);
  return <article className="announcement-card">
    <div className="announcement-thumb">
      {item.image_url ? <img src={item.image_url} alt=""/> : <span className="announcement-thumb-empty">{item.source === 'genially' ? 'Genially' : 'Texto'}</span>}
    </div>
    <div className="announcement-card-body">
      <div className="announcement-card-top">
        <span className={`announcement-phase is-${phase}`}>{PHASE_LABELS[phase]}</span>
        <ActionsMenu item={item} onAction={onAction}/>
      </div>
      <h3>{item.title}</h3>
      <ul className="announcement-tags" aria-label="Etiquetas">
        {(item.audiences || []).map(audience => <li key={audience} className="tag is-audience">{AUDIENCE_TAGS[audience]}</li>)}
        {item.kind && <li className="tag is-kind">{KIND_LABELS[item.kind]}</li>}
        {item.source === 'genially' && <li className="tag">Genially</li>}
      </ul>
      <p className="announcement-dates muted">{dateRange(item)}</p>
    </div>
  </article>;
}

/** Listado en cuadrícula con filtros por audiencia y estado; cada tarjeta tiene su menú «⋯». */
export default function AnnouncementList({items, onEdit, run}) {
  const [audience, setAudience] = useState('');
  const [phase, setPhase] = useState('');
  const [retiring, setRetiring] = useState(null);
  const [busy, setBusy] = useState(false);
  const visible = items.filter(item => (!audience || item.audiences?.includes(audience)) && (!phase || phaseOf(item) === phase));
  const base = item => `/admin/announcements/${item.id}`;
  function action(name, item) {
    if (name === 'edit') return onEdit(item);
    if (name === 'retire') return setRetiring(item);
    const requests = {
      publish: [() => [`${base(item)}/publication`, {expected_version: item.version}], 'Comunicado publicado.'],
      unpublish: [() => [`${base(item)}/publication`, {expected_version: item.version}, 'DELETE'], 'Comunicado despublicado: volvió a borrador.'],
      duplicate: [() => [`${base(item)}/duplicates`, {}, 'POST'], 'Copia creada como borrador.'],
    };
    const [args, message] = requests[name];
    return run(args(), message);
  }
  async function retire() {
    setBusy(true);
    await run([base(retiring), undefined, 'DELETE'], 'Contenido retirado.');
    setBusy(false);
    setRetiring(null);
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
      <p className="muted">{visible.length} de {items.length}</p>
    </div>
    {items.length > 0 && !visible.length && <p>Ningún comunicado coincide con los filtros.</p>}
    {!items.length && <p>Todavía no hay comunicados. Crea el primero con «Crear comunicado».</p>}
    <div className="announcement-grid">
      {visible.map(item => <AnnouncementCard key={item.id} item={item} onAction={action}/>)}
    </div>
    {retiring && <ConfirmDialog busy={busy} title="Retirar comunicado" onCancel={() => setRetiring(null)} onConfirm={retire}
      description={`«${retiring.title}» dejará de mostrarse en los paneles. El retiro queda en la auditoría y no se puede deshacer.`}/>}
  </>;
}
