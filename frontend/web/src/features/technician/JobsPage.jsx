import React, {useEffect, useRef, useState} from 'react';
import {request} from '../administration/http';
import Icon from '../panel/icons';
import Pagination from '../client/Pagination';
import {specialtyIcon} from '../client/specialtyIcon';
import {feeLabel} from '../offers/CandidateCard';
import {StatusTag} from './OffersPage';
import {franjaOf, legibleRange, limaDay, limaTime} from './format';
import '../client/client.css';
import './technician.css';

export const JOB_TABS = [['assigned', 'Asignados'], ['in_progress', 'En curso'], ['completed', 'Completados'], ['cancelled', 'Cancelados']];
export const JOB_STATUS = {
  assigned: {label: 'Asignado', icon: 'calendar', tone: 'info'},
  in_progress: {label: 'En curso', icon: 'clock', tone: 'warn'},
  completed: {label: 'Completado', icon: 'check', tone: 'ok'},
  cancelled: {label: 'Cancelado', icon: 'close', tone: 'muted'},
};
const EMPTY = {
  assigned: ['No tienes trabajos asignados', 'Cuando un cliente te elija, el trabajo aparecerá aquí con su dirección.'],
  in_progress: ['No tienes trabajos en curso', 'Aquí verás los trabajos que ya empezaste.'],
  completed: ['Aún no tienes trabajos completados', 'Tus trabajos terminados quedarán aquí como historial.'],
  cancelled: ['No tienes trabajos cancelados', 'Si un cliente cancela un trabajo asignado, lo verás aquí.'],
};

function JobCard({job}) {
  const specialty = job.specialty?.name || 'Trabajo';
  return <li className="tech-card" aria-label={`Trabajo de la solicitud ${job.request_id}`} data-status={job.status}>
    <span className="tech-card-icon" aria-hidden="true"><Icon name={specialtyIcon(specialty)}/></span>
    <div className="tech-card-body">
      <div className="tech-card-head">
        <h3>{specialty} · Solicitud #{job.request_id}</h3>
        <StatusTag status={job.status} map={JOB_STATUS}/>
      </div>
      <ul className="tech-chips" aria-label="Trabajos">
        {(job.subcategories || []).map(item => <li key={item.id} className="tech-chip">{item.name}</li>)}
      </ul>
      <dl className="offer-facts">
        <div><dt><Icon name="calendar"/> Visita</dt>
          <dd>{job.starts_at ? `${legibleRange(job.starts_at, job.ends_at)} (${franjaOf(job.starts_at).label})` : 'Por coordinar'}</dd></div>
        <div><dt><Icon name="map"/> Distrito</dt><dd>{job.district?.name}</dd></div>
        <div><dt><Icon name="gift"/> Tarifa</dt><dd>{feeLabel(job.reference_fee?.amount)}</dd></div>
      </dl>
      {job.address
        ? <p className="tech-address"><Icon name="home"/> <span><strong>Dirección:</strong> {job.address}</span></p>
        : <p className="muted tech-address"><Icon name="lock"/> <span>La dirección exacta solo se ve en trabajos asignados a ti.</span></p>}
      <ol className="tech-steps" aria-label="Línea de tiempo">
        {job.timeline.map(step => <li key={step.code} data-step={step.code}>
          <span className="tech-step-dot" aria-hidden="true"/>
          <span>{step.label}</span>
          {step.at && <time className="muted" dateTime={step.at}>{limaDay(step.at)}, {limaTime(step.at)}</time>}
        </li>)}
      </ol>
    </div>
  </li>;
}

/**
 * Mis trabajos (Fase T3): pestañas con contador (Asignados, En curso, Completados y Cancelados), búsqueda, paginación,
 * esqueleto de carga y estado vacío por pestaña. Solo los trabajos propios (GET /technicians/me/jobs); la dirección
 * exacta solo llega en los asignados a ese técnico. Iniciar y completar llegan con el módulo de atención (Sprint 6).
 */
export default function JobsPage() {
  const [tab, setTab] = useState('assigned');
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({data: null, error: null, loading: true});
  const tabs = useRef({});
  useEffect(() => {
    const timer = setTimeout(() => { setQuery(text.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [text]);
  useEffect(() => {
    let active = true;
    setState(current => ({...current, loading: true}));
    const params = new URLSearchParams({tab, page: String(page), per_page: '6', ...(query ? {q: query} : {})});
    Promise.resolve().then(() => request(`/technicians/me/jobs?${params}`))
      .then(result => { if (active) setState({data: result?.data, error: null, loading: false}); })
      .catch(error => { if (active) setState(current => ({...current, error, loading: false})); });
    return () => { active = false; };
  }, [tab, page, query]);
  const counts = state.data?.counts || {};
  const items = state.data?.items || [];
  function choose(next) { setTab(next); setPage(1); }
  function keys(event) {
    const step = {ArrowRight: 1, ArrowLeft: -1}[event.key];
    if (!step) return;
    const index = JOB_TABS.findIndex(([id]) => id === tab);
    const next = JOB_TABS[(index + step + JOB_TABS.length) % JOB_TABS.length][0];
    choose(next); tabs.current[next]?.focus();
  }
  const [emptyTitle, emptyText] = EMPTY[tab];
  return <section className="panel-page tech-page" aria-labelledby="tech-jobs-title">
    <header className="client-page-head">
      <h2 id="tech-jobs-title">Mis trabajos</h2>
      <p className="muted">Tus trabajos asignados, en curso y su historial.</p>
    </header>
    <div className="tech-toolbar">
      <div className="tech-tabs" role="tablist" aria-label="Estado de los trabajos" onKeyDown={keys}>
        {JOB_TABS.map(([id, label]) => <button key={id} ref={el => { tabs.current[id] = el; }} type="button" role="tab" id={`trabajos-${id}`}
          aria-selected={tab === id} aria-controls="trabajos-panel" tabIndex={tab === id ? 0 : -1} onClick={() => choose(id)}>
          {label}<span className="tech-tab-count">{counts[id] ?? 0}</span>
        </button>)}
      </div>
      <label className="tech-search">
        <Icon name="search"/>
        <span className="sr-only">Buscar en mis trabajos</span>
        <input type="search" value={text} maxLength={60} placeholder="Buscar por trabajo, distrito o número"
          onChange={event => setText(event.target.value)}/>
      </label>
    </div>
    <div role="tabpanel" id="trabajos-panel" aria-labelledby={`trabajos-${tab}`} aria-busy={state.loading}>
      {state.error && <p className="error" role="alert">{state.error.message || 'No pudimos cargar tus trabajos.'}</p>}
      {state.loading && !state.data && <ul className="tech-cards" aria-hidden="true">{[0, 1, 2].map(key => <li key={key} className="tech-card is-skeleton"/>)}</ul>}
      {!state.loading && !state.error && !items.length && <div className="panel-card tech-empty-card">
        <span className="tech-card-icon" aria-hidden="true"><Icon name={JOB_STATUS[tab].icon}/></span>
        <p><strong>{query ? `Sin resultados para «${query}»` : emptyTitle}</strong></p>
        <p className="muted">{query ? 'Prueba con otra palabra o con el número de la solicitud.' : emptyText}</p>
        {query && <button type="button" className="button outline" onClick={() => setText('')}>Limpiar la búsqueda</button>}
      </div>}
      {items.length > 0 && <ul className="tech-cards">{items.map(job => <JobCard key={job.request_id} job={job}/>)}</ul>}
      {state.data?.pagination?.last_page > 1 && <Pagination label="Páginas de mis trabajos" page={page}
        lastPage={state.data.pagination.last_page} onChange={setPage} disabled={state.loading}/>}
    </div>
  </section>;
}
