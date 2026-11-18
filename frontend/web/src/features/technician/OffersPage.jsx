import React, {useEffect, useRef, useState} from 'react';
import {request} from '../administration/http';
import Icon from '../panel/icons';
import Pagination from '../client/Pagination';
import {specialtyIcon} from '../client/specialtyIcon';
import {feeLabel} from '../offers/CandidateCard';
import {OfferError} from '../offers/offerErrors';
import {useOffers} from '../offers/OffersInbox';
import OfferSpotlight, {slotText} from './OfferSpotlight';
import {EmptyOffers} from './TechnicianHome';
import {legibleRange} from './format';
import '../client/client.css';
import './technician.css';

/** Estado de una oferta como etiqueta de color con ícono (nunca solo color). */
export const OFFER_STATUS = {
  pending: {label: 'Pendiente', icon: 'clock', tone: 'info'},
  accepted: {label: 'Aceptada', icon: 'check', tone: 'ok'},
  rejected: {label: 'Rechazada', icon: 'close', tone: 'muted'},
  expired: {label: 'Vencida', icon: 'alert', tone: 'warn'},
  withdrawn: {label: 'Retirada', icon: 'close', tone: 'muted'},
};

export function StatusTag({status, map = OFFER_STATUS}) {
  const meta = map[status] || {label: status, icon: 'help', tone: 'muted'};
  return <span className="tech-status" data-tone={meta.tone}><Icon name={meta.icon}/>{meta.label}</span>;
}

function HistoryCard({offer}) {
  const request = offer.request;
  const specialty = request.specialty?.name || 'Solicitud';
  const answered = offer.responded_at ? `Respondiste el ${legibleRange(offer.responded_at)}`
    : offer.status === 'expired' ? `Venció el ${legibleRange(offer.expires_at)}` : `Llegó el ${legibleRange(offer.available_at)}`;
  return <li className="tech-card" aria-label={`Oferta ${offer.id}`} data-status={offer.status}>
    <span className="tech-card-icon" aria-hidden="true"><Icon name={specialtyIcon(specialty)}/></span>
    <div className="tech-card-body">
      <div className="tech-card-head">
        <h3>{specialty} · Solicitud #{request.id}</h3>
        <StatusTag status={offer.status}/>
      </div>
      <ul className="tech-chips" aria-label="Trabajos pedidos">
        {(request.subcategories || []).map(item => <li key={item.id} className="tech-chip">{item.name}</li>)}
      </ul>
      <dl className="offer-facts">
        <div><dt><Icon name="map"/> Distrito</dt><dd>{request.district?.name}</dd></div>
        <div><dt><Icon name="clock"/> Franja</dt><dd>{slotText(request)}</dd></div>
        {offer.reference_fee && <div><dt><Icon name="gift"/> Tarifa</dt><dd>{feeLabel(offer.reference_fee.amount)}</dd></div>}
      </dl>
      <p className="muted tech-card-foot">{answered}</p>
    </div>
  </li>;
}

function History() {
  const [page, setPage] = useState(1);
  const [state, setState] = useState({data: null, error: null, loading: true});
  useEffect(() => {
    let active = true;
    setState(current => ({...current, loading: true}));
    Promise.resolve().then(() => request(`/offers?status=accepted,rejected,expired,withdrawn&page=${page}&per_page=10`))
      .then(result => { if (active) setState({data: result?.data, error: null, loading: false}); })
      .catch(error => { if (active) setState({data: null, error, loading: false}); });
    return () => { active = false; };
  }, [page]);
  const items = state.data?.items || [];
  return <div className="tech-history" aria-busy={state.loading}>
    <OfferError error={state.error}/>
    {state.loading && !state.data && <ul className="tech-cards" aria-hidden="true">{[0, 1, 2].map(key => <li key={key} className="tech-card is-skeleton"/>)}</ul>}
    {!state.loading && !state.error && !items.length && <div className="panel-card tech-empty-card">
      <span className="tech-card-icon" aria-hidden="true"><Icon name="clock"/></span>
      <p><strong>Aún no tienes ofertas respondidas</strong></p>
      <p className="muted">Aquí verás las que aceptes, rechaces o dejes vencer.</p>
    </div>}
    {items.length > 0 && <ul className="tech-cards">{items.map(offer => <HistoryCard key={offer.id} offer={offer}/>)}</ul>}
    {state.data?.pagination?.last_page > 1 && <Pagination label="Páginas del historial" page={page}
      lastPage={state.data.pagination.last_page} onChange={setPage} disabled={state.loading}/>}
  </div>;
}

function Pending({onChange}) {
  const {rows, serverTime, error, loading, refresh} = useOffers(null, {status: 'pending', onEvent: onChange});
  const pending = rows.filter(offer => offer.status === 'pending').sort((a, b) => Date.parse(a.expires_at) - Date.parse(b.expires_at));
  // Las respondidas en esta visita siguen a la vista con su mensaje hasta recargar.
  const answered = rows.filter(offer => offer.status !== 'pending');
  return <div className="tech-pending">
    <OfferError error={error}/>
    {loading && <div className="panel-card tech-skeleton" role="status">Cargando tus ofertas…</div>}
    {!loading && !pending.length && !answered.length && !error && <div className="panel-card"><EmptyOffers/></div>}
    {[...pending, ...answered].map(offer => <OfferSpotlight key={offer.id} offer={offer} serverTime={serverTime}
      onChange={async id => { const ok = await refresh(id); onChange?.(); return ok; }}/>)}
  </div>;
}

/**
 * Ofertas del técnico (Fase T3): pestañas Pendientes (la misma tarjeta del Inicio, por vencimiento) e Historial
 * (aceptadas, rechazadas, vencidas y retiradas, con su estado como etiqueta de color). Conserva la región
 * «Solicitudes entrantes» de las pruebas E2E del S4.
 */
export default function OffersPage({pendingCount = 0, onChange}) {
  const [tab, setTab] = useState('pending');
  const tabs = useRef({});
  const TABS = [['pending', 'Pendientes', pendingCount], ['history', 'Historial', null]];
  function keys(event) {
    const step = {ArrowRight: 1, ArrowLeft: -1}[event.key];
    if (!step) return;
    const index = TABS.findIndex(([id]) => id === tab);
    const next = TABS[(index + step + TABS.length) % TABS.length][0];
    setTab(next); tabs.current[next]?.focus();
  }
  return <section className="panel-page tech-page" aria-label="Solicitudes entrantes">
    <header className="client-page-head">
      <h2>Ofertas</h2>
      <p className="muted">Tienes 10 minutos para responder cada oferta. La dirección exacta se ve cuando el cliente te elige.</p>
    </header>
    <div className="tech-tabs" role="tablist" aria-label="Ofertas" onKeyDown={keys}>
      {TABS.map(([id, label, count]) => <button key={id} ref={el => { tabs.current[id] = el; }} type="button" role="tab" id={`ofertas-${id}`}
        aria-selected={tab === id} aria-controls={`ofertas-panel-${id}`} tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)}>
        {label}{count !== null && <span className="tech-tab-count" aria-label={`${count} pendientes`}>{count}</span>}
      </button>)}
    </div>
    <div role="tabpanel" id={`ofertas-panel-${tab}`} aria-labelledby={`ofertas-${tab}`}>
      {tab === 'pending' ? <Pending onChange={onChange}/> : <History/>}
    </div>
  </section>;
}
