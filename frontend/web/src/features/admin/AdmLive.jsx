import React, {useCallback, useEffect, useRef, useState} from 'react';
import {request} from '../administration/http';
import {useRealtimeResource} from '../realtime/Realtime';
import {ClientPage, EmptyState} from '../client/ui';
import Icon from '../panel/icons';
import {minutesLabel, shortDateTime} from './homeFormat';
import {OfferStatus, SPECIALTY_ICONS, agoLabel, plural} from './operations';
import './admin.css';

/**
 * Emparejamiento en vivo (Fase A3): solicitudes que buscan técnico con su ronda y la cuenta regresiva de cada oferta,
 * las del pendiente de 24 h y las ofertas vencidas de las últimas 24 h. Se actualiza con la señal del canal privado
 * admin.matching (Reverb) y, sin conexión en tiempo real, cada 30 s. La cuenta regresiva usa la hora del servidor.
 * Revisión del #70: resumen arriba, contador por columna, tarjetas con borde de urgencia (verde con tiempo, ámbar a
 * menos de 5 min, rojo vencida), anillo con mm:ss por oferta, y los pendientes ya vencidos aparte con «Venció hace»
 * (DEF-86: antes decían «Vence en 0 min»).
 */
const POLL_MS = 30000;
const SOON_SECONDS = 300;

const secondsLeft = (iso, now) => Math.max(0, Math.floor((Date.parse(iso) - now) / 1000));
const mmss = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
const minutesSince = (iso, now) => Math.max(0, Math.floor((now - Date.parse(iso)) / 60000));

/** Urgencia de una solicitud que busca: por la oferta abierta que vence primero (sin ofertas abiertas, vencida). */
function urgency(item, now) {
  const left = item.open_offers.map(offer => secondsLeft(offer.expires_at, now));
  if (!left.length || Math.max(...left) === 0) return 'expired';
  return Math.min(...left.filter(value => value > 0)) < SOON_SECONDS ? 'soon' : 'ok';
}

/** Mini anillo como el del Inicio del técnico: la parte que queda del plazo de la oferta. */
function MiniRing({seconds, total}) {
  const radius = 15;
  const length = 2 * Math.PI * radius;
  const share = total > 0 ? Math.min(1, seconds / total) : 0;
  return <svg viewBox="0 0 36 36" className="adm-mini-ring" data-tone={seconds === 0 ? 'danger' : seconds < SOON_SECONDS ? 'warning' : 'success'} aria-hidden="true">
    <circle cx="18" cy="18" r={radius} className="adm-mini-ring-track"/>
    <circle cx="18" cy="18" r={radius} className="adm-mini-ring-bar" strokeDasharray={length} strokeDashoffset={length * (1 - share)}/>
  </svg>;
}

function OpenOffer({offer, now}) {
  const seconds = secondsLeft(offer.expires_at, now);
  const total = offer.available_at ? Math.max(1, Math.floor((Date.parse(offer.expires_at) - Date.parse(offer.available_at)) / 1000)) : 600;
  return <li className="adm-live-offer">
    <MiniRing seconds={seconds} total={total}/>
    <span className="adm-live-offer-name">{offer.technician.name}</span>
    <OfferStatus status={seconds === 0 ? 'expired' : 'pending'}/>
    <span role="timer" aria-label={`Vencimiento de la oferta de ${offer.technician.name}`} className="adm-countdown">{seconds === 0 ? 'Venció' : mmss(seconds)}</span>
  </li>;
}

function roundLabel({round, open_offers: open}) {
  if (!round) return 'Preparando la primera ronda';
  const parts = [`Ronda ${round.round_no}`, plural(round.open_count ?? open.length, 'oferta abierta', 'ofertas abiertas')];
  if (round.expired_count) parts.push(plural(round.expired_count, 'vencida', 'vencidas'));
  return parts.join(' · ');
}

function Heading({item}) {
  return <div className="adm-live-head">
    <span className="adm-live-specialty" aria-hidden="true"><Icon name={SPECIALTY_ICONS[item.specialty_code] || 'requests'}/></span>
    <div>
      <strong>N.º {item.id} · {item.subcategory}</strong>
      <span className="adm-live-place"><Icon name="pin"/>{item.specialty} · {item.district}</span>
    </div>
  </div>;
}

function SeeButton({id, navigate}) {
  return <button type="button" className="adm-btn adm-btn-secondary" aria-label={`Ver la solicitud ${id}`} onClick={() => navigate('requests', {request: id})}>
    Ver solicitud</button>;
}

function SearchingCard({item, now, navigate}) {
  return <li className="adm-live-card" data-urgency={urgency(item, now)}>
    <Heading item={item}/>
    <p className="adm-live-wait"><Icon name="clock"/>Buscando {agoLabel(minutesSince(item.submitted_at, now))}</p>
    <p className="adm-live-round">{roundLabel(item)}</p>
    {item.open_offers.length > 0 && <ul className="adm-live-offers" aria-label={`Ofertas abiertas de la solicitud ${item.id}`}>
      {item.open_offers.map(offer => <OpenOffer key={offer.id} offer={offer} now={now}/>)}
    </ul>}
    <SeeButton id={item.id} navigate={navigate}/>
  </li>;
}

function PendingCard({item, now, navigate}) {
  const left = Math.ceil((Date.parse(item.pending_expires_at) - now) / 60000);
  const tone = left <= 0 ? 'expired' : left <= 120 ? 'soon' : 'ok';
  return <li className="adm-live-card" data-urgency={tone}>
    <Heading item={item}/>
    <p className="adm-live-wait"><Icon name="clock"/>{left > 0 ? `Vence en ${minutesLabel(left)}` : `Venció ${agoLabel(minutesSince(item.pending_expires_at, now))}`}</p>
    <SeeButton id={item.id} navigate={navigate}/>
  </li>;
}

function Column({id, title, count, children}) {
  return <section className="adm-card adm-live-column" aria-label={title}>
    <h3 id={id}>{title}<span className="adm-live-count" aria-hidden="true">{count}</span></h3>
    {children}
  </section>;
}

export default function AdmLive({navigate}) {
  const [state, setState] = useState({data: null, error: ''});
  const [now, setNow] = useState(() => Date.now());
  const skew = useRef(0);
  const load = useCallback(() => request('/admin/matching/live').then(result => {
    skew.current = Date.parse(result.data.server_time) - Date.now();
    setNow(Date.now() + skew.current);
    setState({data: result.data, error: ''});
  }).catch(failure => setState(current => ({...current, error: failure.message}))), []);
  const connected = useRealtimeResource('admin.matching', ['matching.changed'], load);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (connected) return undefined;
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [connected, load]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() + skew.current), 1000);
    return () => clearInterval(timer);
  }, []);
  const data = state.data;
  const overdue = data?.pending_overdue || [];
  const kpis = data ? [['search', 'Buscando ahora', data.searching.length],
    ['bolt', 'Ofertas abiertas', data.searching.reduce((sum, item) => sum + item.open_offers.length, 0)],
    ['clock', 'Pendientes de 24 h', data.pending.length]] : [];
  return <ClientPage id="adm-live" icon="bolt" tone="blue" title="Emparejamiento en vivo" className="adm-page adm-live"
    intro="Solicitudes que buscan técnico ahora, con sus ofertas abiertas."
    actions={<p role="status" aria-label="Conexión" className="adm-connection" data-live={connected}>
      <span className="adm-connection-dot" aria-hidden="true"/>{connected ? 'En vivo' : 'Actualiza cada 30 s'}</p>}>
    {state.error && <p className="error" role="alert">{state.error} <button type="button" className="text-button" onClick={load}>Reintentar</button></p>}
    {!data && !state.error && <p className="muted">Cargando el tablero…</p>}
    {data && <>
      <div className="adm-live-summary" role="group" aria-label="Resumen del emparejamiento">
        {kpis.map(([icon, label, value]) => <div key={label} className="adm-kpi">
          <span className="adm-icon-circle" data-tone="blue" aria-hidden="true"><Icon name={icon}/></span>
          <strong>{value}</strong><span>{label}</span>
        </div>)}
      </div>
      <div className="adm-live-grid">
        <Column id="adm-live-searching" title="Buscando técnico" count={data.searching.length}>
          {data.searching.length === 0
            ? <EmptyState icon="search" tone="blue" title="Nadie está buscando técnico ahora." text="Las solicitudes nuevas aparecen aquí al enviarse."/>
            : <ul className="adm-live-list">{data.searching.map(item => <SearchingCard key={item.id} item={item} now={now} navigate={navigate}/>)}</ul>}
        </Column>
        <Column id="adm-live-pending" title="En el pendiente de 24 h" count={data.pending.length}>
          {data.pending.length === 0 ? <p className="muted">No hay solicitudes en el pendiente.</p> : <ul className="adm-live-list">
            {data.pending.map(item => <PendingCard key={item.id} item={item} now={now} navigate={navigate}/>)}
          </ul>}
        </Column>
        <Column id="adm-live-expired" title="Ofertas vencidas (24 h)" count={data.expired_offers.length}>
          {data.expired_offers.length === 0 ? <p className="muted">Ninguna oferta venció en las últimas 24 horas.</p> : <ul className="adm-live-expired">
            {data.expired_offers.map(offer => <li key={offer.id}>
              <span><strong>{offer.technician.name}</strong> · N.º {offer.request_id} · {offer.subcategory}</span>
              <span className="muted">{shortDateTime(offer.expires_at)}</span>
            </li>)}
          </ul>}
        </Column>
      </div>
      {overdue.length > 0 && <section className="adm-card adm-live-overdue" aria-label="Pendientes ya vencidos">
        <h3><Icon name="alert"/>Pendientes ya vencidos</h3>
        <p className="muted">Pasaron sus 24 h: el cierre automático los vence en el próximo barrido.</p>
        <ul className="adm-live-expired">
          {overdue.map(item => <li key={item.id}>
            <span><strong>N.º {item.id} · {item.subcategory}</strong> · {item.district}</span>
            <span className="adm-overdue-time">Venció {agoLabel(minutesSince(item.pending_expires_at, now))}</span>
            <SeeButton id={item.id} navigate={navigate}/>
          </li>)}
        </ul>
      </section>}
    </>}
  </ClientPage>;
}
