import React from 'react';
import ConfirmDialog from '../../components/ConfirmDialog';
import Icon from '../panel/icons';
import {feeLabel} from '../offers/CandidateCard';
import {clock, useCountdown} from '../offers/OfferCountdown';
import {OfferError} from '../offers/offerErrors';
import {useOfferResponse} from '../offers/OffersInbox';

const SLOTS = [[12, 'Mañana (08–12)'], [18, 'Tarde (12–18)'], [24, 'Noche (18–21)']];
const limaHour = iso => Number(new Intl.DateTimeFormat('es-PE', {hour: 'numeric', hourCycle: 'h23', timeZone: 'America/Lima'}).format(new Date(iso)));
const limaDay = iso => new Intl.DateTimeFormat('es-PE', {weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Lima'}).format(new Date(iso));
const limaTime = iso => new Intl.DateTimeFormat('es-PE', {hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Lima'}).format(new Date(iso));

/** Franja pedida en texto: «Tarde (12–18) · jue. 13 nov., 14:00–16:00» o «Lo antes posible». */
export function slotText(request) {
  if (!request.preferred_start_at) return 'Lo antes posible';
  const slot = SLOTS.find(([limit]) => limaHour(request.preferred_start_at) < limit)?.[1];
  return `${slot} · ${limaDay(request.preferred_start_at)}, ${limaTime(request.preferred_start_at)}–${limaTime(request.preferred_end_at)}`;
}

/** Tono del anillo: verde con más de 5 minutos, ámbar hasta 2 y rojo en los últimos 2 (también en texto). */
export const ringTone = seconds => (seconds > 300 ? 'ok' : seconds > 120 ? 'warn' : 'danger');
const TONE_TEXT = {ok: 'Tienes tiempo', warn: 'Quedan pocos minutos', danger: 'Responde ya'};

/** Anillo de cuenta regresiva de 10 minutos (Fase T2): SVG con el tiempo también en texto y un aviso por minuto. */
export function OfferRing({seconds, total}) {
  const radius = 52;
  const length = 2 * Math.PI * radius;
  const known = Number.isFinite(seconds);
  const tone = known ? ringTone(seconds) : 'ok';
  const minutes = known ? Math.ceil(seconds / 60) : null;
  return <div className="offer-ring" data-tone={tone}>
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r={radius} className="offer-ring-track"/>
      <circle cx="60" cy="60" r={radius} className="offer-ring-bar" strokeDasharray={length}
        strokeDashoffset={known ? length * (1 - Math.min(1, seconds / total)) : 0}/>
    </svg>
    <div className="offer-ring-text">
      <span role="timer" aria-live="off" className="offer-ring-time">{known ? clock(seconds) : '--:--'}</span>
      <small>{known ? (seconds === 0 ? 'Plazo vencido' : TONE_TEXT[tone]) : 'Calculando…'}</small>
    </div>
    {/* Un aviso por minuto para lectores de pantalla, no cada segundo. */}
    <span className="sr-only" aria-live="polite">{!known ? '' : seconds === 0 ? 'Plazo vencido'
      : `Quedan ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} para responder`}</span>
  </div>;
}

/**
 * Oferta en vivo del Inicio del técnico (Fase T2): tarjeta destacada con el anillo, especialidad y subcategorías,
 * distrito (nunca la dirección), franja, tarifa referencial y urgencia, y botones grandes Aceptar y Rechazar con la
 * misma respuesta idempotente de la bandeja del S4.
 */
export default function OfferSpotlight({offer, serverTime, onChange, onOpenOffers}) {
  const {expired, setExpired, busy, reject, setReject, reason, setReason, error, message, respond} = useOfferResponse(offer, onChange);
  const seconds = useCountdown(offer.expires_at, serverTime, () => setExpired(true));
  const total = Math.max(1, (Date.parse(offer.expires_at) - Date.parse(offer.available_at)) / 1000) || 600;
  const request = offer.request;
  const pending = offer.status === 'pending';
  const subcategories = request.subcategories?.length ? request.subcategories : [request.subcategory].filter(Boolean);
  return <article className="offer-spotlight panel-card" aria-label={`Oferta ${offer.id}`} data-urgent={request.urgency === 'urgente' || undefined}>
    <div className="offer-spotlight-head">
      <p className="kicker">{pending ? 'Oferta en vivo' : 'Oferta respondida'}</p>
      {request.urgency === 'urgente' && <span className="tech-chip is-urgent"><Icon name="alert"/> Urgente</span>}
    </div>
    <div className="offer-spotlight-body">
      {pending && <OfferRing seconds={seconds} total={total}/>}
      <div className="offer-spotlight-info">
        <h3>{request.specialty?.name || 'Solicitud'} · Solicitud #{request.id}</h3>
        <ul className="tech-chips" aria-label="Trabajos pedidos">
          {subcategories.map(item => <li key={item.id} className="tech-chip">{item.name}</li>)}
        </ul>
        <dl className="offer-facts">
          <div><dt><Icon name="map"/> Distrito</dt><dd>{request.district?.name}</dd></div>
          <div><dt><Icon name="clock"/> Franja</dt><dd>{slotText(request)}</dd></div>
          {offer.reference_fee && <div><dt><Icon name="gift"/> Tarifa</dt><dd>{feeLabel(offer.reference_fee.amount)}</dd></div>}
        </dl>
        {request.description && <p className="offer-description">{request.description}</p>}
      </div>
    </div>
    <OfferError error={error} technician/>
    {message && <p role="status" className="notice">{message}</p>}
    {pending && <div className="offer-actions">
      <button type="button" className="button primary offer-accept" disabled={busy || expired || !serverTime} aria-busy={busy}
        onClick={() => respond('accept')}><Icon name="check"/> Aceptar</button>
      <button type="button" className="button outline offer-reject" disabled={busy || expired || !serverTime}
        onClick={() => setReject(true)}><Icon name="close"/> Rechazar</button>
    </div>}
    {onOpenOffers && <button type="button" className="text-button" onClick={onOpenOffers}>Ver todas mis ofertas</button>}
    {/* DEF-64: el motivo va dentro del diálogo; detrás del fondo modal no se podía escribir. */}
    {reject && <ConfirmDialog title="Rechazar oferta" description="El cliente podrá buscar otro técnico. ¿Deseas rechazar esta oferta?"
      busy={busy} onCancel={() => setReject(false)} onConfirm={() => respond('reject')}>
      <label className="offer-reason">Motivo del rechazo (opcional)
        <textarea value={reason} onChange={event => setReason(event.target.value)} disabled={busy} maxLength={500}/>
      </label>
    </ConfirmDialog>}
  </article>;
}
