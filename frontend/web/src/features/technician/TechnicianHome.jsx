import React, {useEffect, useState} from 'react';
import Icon from '../panel/icons';
import {useShell} from '../panel/shellContext';
import {prefersReducedMotion} from '../panel/quickAccessibility';
import RoleAnnouncements from '../administration/RoleAnnouncements';
import {OfferError} from '../offers/offerErrors';
import {useOffers} from '../offers/OffersInbox';
import OfferSpotlight from './OfferSpotlight';
import './technician.css';

const TZ = 'America/Lima';
const limaHour = () => Number(new Intl.DateTimeFormat('es-PE', {hour: 'numeric', hourCycle: 'h23', timeZone: TZ}).format(new Date()));
const time = iso => new Intl.DateTimeFormat('es-PE', {hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: TZ}).format(new Date(iso));
const day = iso => new Intl.DateTimeFormat('es-PE', {weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ}).format(new Date(iso));
export const greeting = (hour = limaHour()) => (hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches');
const SLOTS = [['morning', 'Mañana', '08–12'], ['afternoon', 'Tarde', '12–18'], ['night', 'Noche', '18–21']];
const JOB_STATUS = {assigned: 'Asignado', in_progress: 'En curso', completed: 'Completado', cancelled: 'Cancelado'};
const VERIFICATION_ICON = {approved: 'verify', in_review: 'clock', missing: 'alert', observed: 'alert'};
const BADGE_ICON = {verified: 'verify', complete_profile: 'profile', fast_response: 'bolt', first_jobs: 'briefcase'};

/** Cuenta de 0 al valor en 0,7 s; con «Reducir animaciones» o prefers-reduced-motion muestra el valor de inmediato. */
export function useCountUp(value) {
  const reduce = prefersReducedMotion();
  const [shown, setShown] = useState(() => (reduce || typeof value !== 'number' ? value : 0));
  useEffect(() => {
    if (reduce || typeof value !== 'number' || typeof requestAnimationFrame !== 'function') { setShown(value); return undefined; }
    let frame;
    let start;
    const step = now => {
      start ??= now;
      const progress = Math.min(1, (now - start) / 700);
      setShown(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, reduce]);
  return shown;
}

function Indicator({icon, label, value, suffix = '', detail, index}) {
  const shown = useCountUp(value);
  return <li className="tech-kpi" style={{'--i': index}}>
    <span className="tech-kpi-icon" aria-hidden="true"><Icon name={icon}/></span>
    <span className="tech-kpi-label">{label}</span>
    {/* El lector de pantalla recibe el valor final, no la animación. */}
    <strong className="tech-kpi-value" aria-hidden="true">{value === null ? '—' : `${shown}${suffix}`}</strong>
    <span className="sr-only">{value === null ? 'Sin datos todavía' : `${value}${suffix}`}</span>
    {detail && <small className="muted">{detail}</small>}
  </li>;
}

function Indicators({data}) {
  const next = data.indicators.next_visit;
  return <section className="panel-card tech-section" aria-labelledby="tech-kpis" style={{'--i': 2}}>
    <h3 id="tech-kpis">Tu actividad</h3>
    <ul className="tech-kpis">
      <Indicator index={0} icon="briefcase" label="Trabajos de hoy" value={data.indicators.jobs_today}/>
      <Indicator index={1} icon="check" label="Ofertas respondidas" value={data.indicators.offers_answered} detail="Últimos 30 días"/>
      <Indicator index={2} icon="chart" label="Tasa de aceptación" value={data.indicators.acceptance_rate} suffix=" %" detail="Últimos 30 días"/>
      <li className="tech-kpi" style={{'--i': 3}}>
        <span className="tech-kpi-icon" aria-hidden="true"><Icon name="calendar"/></span>
        <span className="tech-kpi-label">Próxima visita</span>
        {next ? <><strong className="tech-kpi-value is-text">{time(next.starts_at)}</strong>
          <small className="muted">{day(next.starts_at)} · {next.district}</small></>
          : <><strong className="tech-kpi-value is-text">—</strong><small className="muted">Sin visitas programadas</small></>}
      </li>
    </ul>
  </section>;
}

function MyDay({visits}) {
  return <section className="panel-card tech-section" aria-labelledby="tech-day" style={{'--i': 3}}>
    <h3 id="tech-day">Mi día</h3>
    {!visits.length && <p className="muted">No tienes visitas hoy. Las verás aquí por franja cuando te asignen un trabajo.</p>}
    <ol className="tech-timeline">
      {SLOTS.map(([slot, label, hours]) => {
        const items = visits.filter(visit => visit.slot === slot);
        return <li key={slot} className="tech-slot" data-slot={slot}>
          <p className="tech-slot-name"><strong>{label}</strong> <span className="muted">{hours}</span></p>
          {items.length ? <ul>{items.map(visit => <li key={visit.request_id} className="tech-visit" data-status={visit.status}>
            <span className="tech-visit-time">{time(visit.starts_at)}–{time(visit.ends_at)}</span>
            <span><strong>{visit.specialty}</strong> · {visit.subcategory}</span>
            <span className="muted"><Icon name="map"/> {visit.district}</span>
            <span className="tech-chip">{JOB_STATUS[visit.status] || visit.status}</span>
          </li>)}</ul> : <p className="muted tech-free">Libre</p>}
        </li>;
      })}
    </ol>
  </section>;
}

function Progress({data, navigate}) {
  const {openAccount} = useShell();
  const {percent, tasks} = data.progress;
  const pending = tasks.filter(task => !task.done);
  const go = task => (task.section === 'account' ? openAccount?.() : navigate(task.section));
  return <section className="panel-card tech-section tech-progress" aria-labelledby="tech-progress" style={{'--i': 4}}>
    <div className="tech-progress-head">
      <h3 id="tech-progress">Completa tu perfil</h3>
      <strong>{percent} %</strong>
    </div>
    <div className="tech-meter" role="progressbar" aria-labelledby="tech-progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}
      aria-valuetext={`${percent} % completo`}><span style={{width: `${percent}%`}}/></div>
    {pending.length ? <ul className="tech-tasks">
      {pending.map(task => <li key={task.code}>
        <span className="tech-task-dot" aria-hidden="true"/>
        <span>{task.label}</span>
        {(task.section !== 'account' || openAccount) && <button type="button" className="button outline tech-task-go" onClick={() => go(task)}>
          Hacerlo<span className="sr-only">: {task.label}</span></button>}
      </li>)}
    </ul> : <p className="tech-done"><Icon name="check"/> ¡Tu perfil está completo! Los clientes ven toda tu información.</p>}
    <h4>Insignias</h4>
    <ul className="tech-badges">
      {data.badges.map(badge => <li key={badge.code} className={'tech-badge' + (badge.earned ? ' is-earned' : '')}>
        <span className="tech-badge-icon" aria-hidden="true"><Icon name={BADGE_ICON[badge.code] || 'star'}/></span>
        <strong>{badge.label}</strong>
        <span className="tech-badge-state">{badge.earned ? 'Obtenida' : 'Pendiente'}</span>
        <small className="muted">{badge.hint}</small>
      </li>)}
    </ul>
  </section>;
}

function EmptyOffers() {
  return <div className="tech-empty">
    <svg viewBox="0 0 120 90" aria-hidden="true" className="tech-empty-art">
      <circle cx="60" cy="45" r="38" className="tech-empty-glow"/>
      <rect x="38" y="28" width="44" height="34" rx="6" className="tech-empty-line"/>
      <path d="M38 36h44M50 22v10M70 22v10" className="tech-empty-line"/>
      <path d="m52 48 6 6 11-12" className="tech-empty-check"/>
    </svg>
    <p><strong>No tienes ofertas pendientes</strong></p>
    <p className="muted">Te avisaremos apenas llegue una. Tendrás 10 minutos para responder.</p>
  </div>;
}

function LiveOffers({navigate, onChange}) {
  const {rows, serverTime, error, loading, refresh} = useOffers(null, {status: 'pending', onEvent: onChange});
  const [focus, setFocus] = useState(null);
  const pending = rows.filter(offer => offer.status === 'pending').sort((a, b) => Date.parse(a.expires_at) - Date.parse(b.expires_at));
  // La oferta respondida se queda a la vista con su mensaje hasta elegir otra.
  const current = rows.find(offer => offer.id === focus) || pending[0];
  const others = pending.filter(offer => offer.id !== current?.id);
  useEffect(() => { if (current && current.id !== focus && current.status === 'pending') setFocus(current.id); }, [current, focus]);
  return <section className="tech-live" aria-labelledby="tech-live" style={{'--i': 1}}>
    <h3 id="tech-live" className="sr-only">Ofertas</h3>
    <OfferError error={error}/>
    {loading && <div className="panel-card tech-skeleton" role="status">Cargando tus ofertas…</div>}
    {!loading && !current && !error && <div className="panel-card"><EmptyOffers/></div>}
    {current && <OfferSpotlight key={current.id} offer={current} serverTime={serverTime}
      onChange={async id => { const ok = await refresh(id); onChange?.(); return ok; }} onOpenOffers={() => navigate('offers')}/>}
    {others.length > 0 && <div className="panel-card tech-queue">
      <h4>{others.length === 1 ? 'Otra oferta pendiente' : `Otras ${others.length} ofertas pendientes`}, por vencimiento</h4>
      <ul>{others.map(offer => <li key={offer.id}>
        <span><strong>{offer.request.specialty?.name}</strong> · {offer.request.district?.name}</span>
        <span className="muted">Vence a las {time(offer.expires_at)}</span>
        <button type="button" className="button outline" onClick={() => setFocus(offer.id)}>Ver<span className="sr-only"> la oferta {offer.id}</span></button>
      </li>)}</ul>
    </div>}
  </section>;
}

/**
 * Inicio del técnico (Fase T2): saludo con la verificación, oferta en vivo con su anillo, indicadores animados, Mi día,
 * progreso del perfil con insignias y, al final, los comunicados. Todo sale de datos reales (GET /technicians/me/home y
 * GET /offers); las animaciones respetan «Reducir animaciones» y prefers-reduced-motion.
 */
export default function TechnicianHome({user, home, navigate, onChange}) {
  const data = home.data;
  const name = user.given_names || (user.name || '').split(/\s+/)[0];
  const verification = data?.verification;
  return <div className="panel-page tech-home">
    <section className="tech-hello" aria-labelledby="tech-hello" style={{'--i': 0}}>
      <div>
        <h2 id="tech-hello">{greeting()}, {name}</h2>
        <p className="muted">Este es tu resumen de hoy.</p>
      </div>
      {verification && <button type="button" className="tech-verification" data-state={verification.state} onClick={() => navigate('verification')}>
        <Icon name={VERIFICATION_ICON[verification.state] || 'verify'}/>
        <span>Verificación: <strong>{verification.label}</strong></span>
      </button>}
    </section>
    <LiveOffers navigate={navigate} onChange={onChange}/>
    {home.loading && !data && <div className="panel-card tech-skeleton" role="status">Cargando tu resumen…</div>}
    {home.error && <div className="panel-card" role="alert">
      <p>No pudimos cargar tu resumen. {home.error.message}</p>
      <button type="button" className="button outline" onClick={home.reload}>Reintentar</button>
    </div>}
    {data && <>
      <Indicators data={data}/>
      <div className="tech-row">
        <MyDay visits={data.today}/>
        <Progress data={data} navigate={navigate}/>
      </div>
    </>}
    <section className="tech-news" aria-label="Comunicados para técnicos"><RoleAnnouncements/></section>
  </div>;
}
