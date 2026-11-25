import React, {useCallback, useEffect, useState} from 'react';
import {request} from '../administration/http';
import {formatDateTime} from './adminRules';
import {INTERVENTIONS, INTERVENTION_MIN, OfferStatus, RequestStatus, intervene, requestTone, secondsLabel} from './operations';
import ReasonDialog from './ReasonDialog';
import {ClientPage, EmptyState} from '../client/ui';
import Icon from '../panel/icons';
import {clock, limaDay, relativeTime, shortDateTime, shortDay} from './homeFormat';
import './admin.css';

/**
 * Detalle de una solicitud del panel del administrador (Fase A3; rediseño de la revisión del #70): franja y estado grande
 * del color del estado, barra de acciones de D-116 (la que no aplica por D-120 se ve desactivada con su motivo), tarjetas
 * con ícono en círculo y filas ícono + etiqueta + valor, ofertas en tabla compacta y línea de tiempo por día como la de
 * Actividad reciente (hora a la izquierda, punto de color con ícono por tipo y el motivo del administrador).
 */
const PLANS = {premium: 'Premium', free: 'Free'};

/** [título, tono, ícono] de cada tipo de evento de request_events (los mismos del seguimiento del cliente, D-89). */
const EVENTS = {
  'request.registered': ['Solicitud registrada', 'slate', 'edit'],
  'request.submitted': ['Solicitud enviada', 'info', 'requests'],
  'request.corrected': ['Solicitud corregida', 'slate', 'edit'],
  'round.opened': ['Ronda de ofertas', 'info', 'bolt'],
  'round.awaiting_choice': ['Técnicos aceptaron: falta elegir', 'success', 'users'],
  'offer.accepted': ['Oferta aceptada', 'success', 'check'],
  'offer.rejected': ['Oferta rechazada', 'slate', 'close'],
  'offer.expired': ['Oferta vencida', 'warning', 'clock'],
  'offer.withdrawn': ['Oferta retirada', 'slate', 'close'],
  'request.pending': ['Pendiente de 24 h', 'warning', 'clock'],
  'request.alternative_search': ['Búsqueda de otros técnicos', 'info', 'search'],
  'matching.direct_declined': ['El técnico elegido no aceptó', 'warning', 'close'],
  'matching.direct_unavailable': ['El técnico elegido no está disponible', 'warning', 'alert'],
  'selection.unavailable': ['El técnico elegido ya no estaba disponible', 'warning', 'alert'],
  'request.assigned': ['Técnico asignado', 'success', 'wrench'],
  'request.cancelled': ['Cancelada', 'danger', 'close'],
  'request.admin_cancelled': ['Cancelada por el administrador', 'danger', 'close'],
  'request.admin_rematched': ['Reenviada por el administrador', 'info', 'search'],
  'request.expired': ['Venció sin técnico', 'slate', 'alert'],
};

function Card({id, title, icon, tone, children}) {
  return <section className="adm-card adm-request-part" aria-labelledby={id}>
    <h3 id={id}><span className="adm-icon-circle" data-tone={tone} aria-hidden="true"><Icon name={icon}/></span>{title}</h3>
    {children}
  </section>;
}

/** Filas ícono + etiqueta + valor. */
function Rows({rows}) {
  return <dl className="adm-rows">
    {rows.filter(Boolean).map(([icon, label, value]) => <div key={label}>
      <dt><Icon name={icon}/>{label}</dt><dd>{value}</dd>
    </div>)}
  </dl>;
}

function OffersTable({offers}) {
  if (!offers.length) {
    return <EmptyState icon="bolt" tone="amber" title="Todavía no se enviaron ofertas."
      text="Cuando el emparejamiento abra una ronda, verás aquí a cada técnico con su respuesta."/>;
  }
  return <div className="adm-table-scroll">
    <table className="adm-table adm-offers">
      <caption className="sr-only">Ofertas enviadas</caption>
      <thead><tr><th scope="col">Técnico</th><th scope="col">Enviada</th><th scope="col">Respondida</th><th scope="col">Estado</th>
        <th scope="col">Tiempo de respuesta</th></tr></thead>
      <tbody>{offers.map(offer => <tr key={offer.id}>
        <td data-label="Técnico"><strong>{offer.technician.name}</strong>
          <small className="adm-muted-line">Ronda {offer.round_no}{offer.search_generation > 1 ? ` · búsqueda ${offer.search_generation}` : ''}</small></td>
        <td data-label="Enviada">{shortDateTime(offer.available_at)}</td>
        <td data-label="Respondida">{offer.responded_at ? shortDateTime(offer.responded_at) : '—'}</td>
        <td data-label="Estado"><OfferStatus status={offer.status}/></td>
        <td data-label="Tiempo de respuesta">{secondsLabel(offer.response_seconds)}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

/** Eventos en orden, agrupados por día de Lima («Hoy», «Ayer» o «24 nov»). */
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

function Timeline({events}) {
  if (!events.length) {
    return <EmptyState icon="clock" tone="slate" title="Sin eventos registrados." text="Los cambios de la solicitud aparecerán aquí."/>;
  }
  const now = new Date();
  return <div className="adm-timeline">
    {byDay(events, now).map(group => <div key={group.key} className="adm-day">
      <h4 className="adm-day-label">{group.label}</h4>
      <div className="adm-day-events">
        <span className="adm-timeline-line" aria-hidden="true"/>
        <ol className="adm-timeline-list">
          {group.items.map((event, index) => {
            const [title, tone, icon] = EVENTS[event.event_type] || [event.summary, 'slate', 'info'];
            return <li key={`${event.occurred_at}-${event.event_type}-${index}`} className="adm-event" data-tone={tone}>
              <time className="adm-event-time" dateTime={event.occurred_at} title={relativeTime(event.occurred_at, now)}>{clock(event.occurred_at)}</time>
              <span className="adm-event-dot" aria-hidden="true"><Icon name={icon}/></span>
              <div className="adm-event-body">
                <strong className="adm-event-title">{title}</strong>
                {title !== event.summary && <span className="adm-event-summary">{event.summary}</span>}
                {event.reason && <span className="adm-event-reason">Motivo: {event.reason}</span>}
                {event.actor && <small className="adm-event-actor">{event.actor}</small>}
              </div>
            </li>;
          })}
        </ol>
      </div>
    </div>)}
  </div>;
}

/** Barra de acciones de D-116: visible solo con el permiso (action_reasons llega null sin él). */
function ActionBar({actions, reasons, onOpen}) {
  if (!reasons && !actions.cancel && !actions.rematch) return null;
  const blocked = [['rematch', reasons?.rematch], ['cancellation', reasons?.cancel]].filter(([, reason]) => reason);
  return <div className="adm-request-toolbar">
    <div role="toolbar" aria-label="Acciones de la solicitud" className="adm-request-actions">
      {(actions.rematch || reasons?.rematch) && <button type="button" className="adm-btn adm-btn-primary" disabled={!actions.rematch}
        title={actions.rematch ? undefined : reasons.rematch} onClick={() => onOpen('rematch')}>
        <Icon name="search"/>{INTERVENTIONS.rematch.open}</button>}
      {(actions.cancel || reasons?.cancel) && <button type="button" className="adm-btn adm-btn-danger" disabled={!actions.cancel}
        title={actions.cancel ? undefined : reasons.cancel} onClick={() => onOpen('cancellation')}>
        <Icon name="close"/>{INTERVENTIONS.cancellation.open}</button>}
    </div>
    {blocked.length > 0 && <ul className="adm-action-notes">
      {blocked.map(([action, reason]) => <li key={action}><Icon name="info"/>{INTERVENTIONS[action].open}: {reason}</li>)}
    </ul>}
  </div>;
}

export default function RequestDetail({id, onBack}) {
  const [state, setState] = useState({loading: true, data: null, error: ''});
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState('');
  const load = useCallback(() => {
    setState(current => ({...current, loading: true, error: ''}));
    request(`/admin/requests/${id}`).then(result => setState({loading: false, data: result.data, error: ''}))
      .catch(failure => setState({loading: false, data: null, error: failure.message}));
  }, [id]);
  useEffect(load, [load]);
  async function confirm(reason) {
    setDialog(current => ({...current, busy: true, error: ''}));
    try {
      await intervene(id, dialog.action, reason, state.data.request.version);
      setNotice(INTERVENTIONS[dialog.action].done);
      setDialog(null);
      load();
    } catch (failure) {
      setDialog(current => ({...current, busy: false, error: failure.message}));
    }
  }
  const data = state.data;
  const r = data?.request;
  return <ClientPage id="adm-request" icon="requests" tone="blue" title={`Solicitud N.º ${id}`} className="adm-page adm-request"
    actions={<button type="button" className="adm-btn adm-btn-secondary" onClick={onBack}><Icon name="chevron"/>Volver a solicitudes</button>}>
    {state.loading && !data && <p className="muted">Cargando la solicitud…</p>}
    {state.error && <p className="error" role="alert">{state.error}</p>}
    {notice && <p className="adm-notice" role="status"><Icon name="check"/>{notice}</p>}
    {data && <>
      <header className="adm-request-head" data-tone={requestTone(r.status)}>
        <RequestStatus status={r.status} large/>
        <p className="adm-request-meta">{r.specialty} · {r.subcategory} · {r.district}<span>Creada {shortDateTime(r.created_at)}</span></p>
      </header>
      <ActionBar actions={data.actions || {}} reasons={data.action_reasons ?? null} onOpen={action => setDialog({action})}/>
      <div className="adm-request-grid">
        <Card id="adm-request-summary" title="Resumen" icon="requests" tone="blue">
          <ul className="adm-chips-list" aria-label="Subcategorías">
            {(r.subcategories || [r.subcategory]).map(name => <li key={name} className="adm-chip">{name}</li>)}
          </ul>
          <Rows rows={[
            ['tag', 'Especialidad', r.specialty],
            ['calendar', 'Modalidad', r.mode === 'scheduled' ? `Programada · ${formatDateTime(r.preferred_start_at)}` : 'Lo antes posible'],
            ['wallet', 'Tarifa de referencia', r.reference_fee ? `S/ ${Number(r.reference_fee.amount).toFixed(2).replace('.', ',')}` : '—'],
            ['chat', 'Descripción', r.description],
            r.cancellation_reason && ['alert', 'Motivo de cancelación', r.cancellation_reason],
          ]}/>
        </Card>
        <Card id="adm-request-client" title="Cliente" icon="profile" tone="teal">
          <Rows rows={[['profile', 'Nombre', data.client.name], ['pin', 'Distrito', data.client.district || '—'],
            ['star', 'Plan', PLANS[data.client.plan] || data.client.plan]]}/>
        </Card>
        <Card id="adm-request-technician" title="Técnico asignado" icon="wrench" tone="green">
          <Rows rows={[['wrench', 'Técnico', data.technician?.name || 'Sin técnico asignado'],
            ['bolt', 'Ofertas', `${data.offer_list?.length ?? 0} enviadas`]]}/>
        </Card>
      </div>
      <Card id="adm-request-offers" title="Ofertas enviadas" icon="bolt" tone="amber"><OffersTable offers={data.offer_list || []}/></Card>
      <Card id="adm-request-timeline" title="Línea de tiempo" icon="clock" tone="slate"><Timeline events={data.timeline || []}/></Card>
    </>}
    {dialog && <ReasonDialog title={INTERVENTIONS[dialog.action].title(id)} description={INTERVENTIONS[dialog.action].description}
      confirmLabel={INTERVENTIONS[dialog.action].confirm} danger={INTERVENTIONS[dialog.action].danger} minLength={INTERVENTION_MIN}
      busy={dialog.busy} error={dialog.error} onCancel={() => setDialog(null)} onConfirm={confirm}/>}
  </ClientPage>;
}
