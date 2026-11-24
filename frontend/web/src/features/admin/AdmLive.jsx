import React, {useCallback, useEffect, useRef, useState} from 'react';
import {request} from '../administration/http';
import {useRealtimeResource} from '../realtime/Realtime';
import {ClientPage, EmptyState} from '../client/ui';
import Icon from '../panel/icons';
import {minutesLabel, shortDateTime} from './homeFormat';
import './admin.css';

/**
 * Emparejamiento en vivo (Fase A3): solicitudes que buscan técnico con su ronda y la cuenta regresiva de cada oferta,
 * las del pendiente de 24 h y las ofertas vencidas de las últimas 24 h. Se actualiza con la señal del canal privado
 * admin.matching (Reverb) y, sin conexión en tiempo real, cada 30 s. La cuenta regresiva usa la hora del servidor.
 */
const POLL_MS = 30000;

/** «08:00» hasta el vencimiento; «Venció» al llegar a cero. */
function countdown(expiresAt, now) {
  const seconds = Math.max(0, Math.floor((Date.parse(expiresAt) - now) / 1000));
  if (seconds === 0) return 'Venció';
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function SearchingCard({item, now, navigate}) {
  return <li className="adm-live-card">
    <div className="adm-live-head">
      <strong>N.º {item.id} · {item.subcategory}</strong>
      <span className="muted">{item.specialty} · {item.district}</span>
    </div>
    <p className="adm-live-round">{item.round ? `Ronda ${item.round.round_no}` : 'Preparando la primera ronda'}</p>
    {item.open_offers.length > 0 && <ul className="adm-live-offers" aria-label={`Ofertas abiertas de la solicitud ${item.id}`}>
      {item.open_offers.map(offer => <li key={offer.id}>
        <span>{offer.technician.name}</span>
        <span role="timer" aria-label={`Vencimiento de la oferta de ${offer.technician.name}`} className="adm-countdown">{countdown(offer.expires_at, now)}</span>
      </li>)}
    </ul>}
    <button type="button" className="button outline" aria-label={`Ver la solicitud ${item.id}`} onClick={() => navigate('requests', {request: item.id})}>Ver solicitud</button>
  </li>;
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
  return <ClientPage id="adm-live" icon="bolt" tone="blue" title="Emparejamiento en vivo" className="adm-page adm-live"
    intro="Solicitudes que buscan técnico ahora, con sus ofertas abiertas."
    actions={<p role="status" aria-label="Conexión" className="adm-connection" data-live={connected}>
      <span className="adm-connection-dot" aria-hidden="true"/>{connected ? 'En vivo' : 'Actualiza cada 30 s'}</p>}>
    {state.error && <p className="error" role="alert">{state.error} <button type="button" className="text-button" onClick={load}>Reintentar</button></p>}
    {!data && !state.error && <p className="muted">Cargando el tablero…</p>}
    {data && <div className="adm-live-grid">
      <section className="adm-card" aria-labelledby="adm-live-searching">
        <h3 id="adm-live-searching">Buscando técnico</h3>
        {data.searching.length === 0
          ? <EmptyState icon="search" tone="blue" title="Nadie está buscando técnico ahora." text="Las solicitudes nuevas aparecen aquí al enviarse."/>
          : <ul className="adm-live-list">{data.searching.map(item => <SearchingCard key={item.id} item={item} now={now} navigate={navigate}/>)}</ul>}
      </section>
      <section className="adm-card" aria-labelledby="adm-live-pending">
        <h3 id="adm-live-pending">En el pendiente de 24 h</h3>
        {data.pending.length === 0 ? <p className="muted">No hay solicitudes en el pendiente.</p> : <ul className="adm-live-list">
          {data.pending.map(item => <li key={item.id} className="adm-live-card">
            <div className="adm-live-head"><strong>N.º {item.id} · {item.subcategory}</strong><span className="muted">{item.specialty} · {item.district}</span></div>
            <p className="adm-live-round"><Icon name="clock"/>Vence en {minutesLabel(Math.max(0, Math.round((Date.parse(item.pending_expires_at) - now) / 60000)))}</p>
            <button type="button" className="button outline" aria-label={`Ver la solicitud ${item.id}`} onClick={() => navigate('requests', {request: item.id})}>Ver solicitud</button>
          </li>)}
        </ul>}
      </section>
      <section className="adm-card" aria-labelledby="adm-live-expired">
        <h3 id="adm-live-expired">Ofertas vencidas (24 h)</h3>
        {data.expired_offers.length === 0 ? <p className="muted">Ninguna oferta venció en las últimas 24 horas.</p> : <ul className="adm-live-expired">
          {data.expired_offers.map(offer => <li key={offer.id}>
            <span><strong>{offer.technician.name}</strong> · N.º {offer.request_id} · {offer.subcategory}</span>
            <span className="muted">{shortDateTime(offer.expires_at)}</span>
          </li>)}
        </ul>}
      </section>
    </div>}
  </ClientPage>;
}
