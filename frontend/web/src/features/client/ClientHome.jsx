import React, {useCallback, useEffect, useState} from 'react';
import {request} from '../administration/http';
import RoleAnnouncements from '../administration/RoleAnnouncements';
import {NEXT_TEXT} from './RequestProgress';
import {PROBLEMS, SAFETY, TIPS} from './homeContent';
import {distanceLabel, feeLabel, initialsOf, isActive, requestGroup} from './clientRules';

/** Lee un recurso para una sección: cada sección carga y falla por su cuenta, sin tumbar al resto del Inicio. */
function useBlock(path) {
  const [state, setState] = useState({loading: Boolean(path), data: null, error: false});
  const load = useCallback(() => {
    if (!path) return undefined;
    let active = true;
    setState(current => ({...current, loading: true, error: false}));
    Promise.resolve().then(() => request(path))
      .then(result => { if (active) setState({loading: false, data: result.data, error: false}); })
      .catch(() => { if (active) setState({loading: false, data: null, error: true}); });
    return () => { active = false; };
  }, [path]);
  useEffect(load, [load]);
  return [state, load];
}

function Skeleton({label, lines = 3}) {
  return <div className="client-skeleton" aria-hidden="true">{Array.from({length: lines}, (_, index) => <span key={index}/>)}
    <span className="sr-only">{label}</span></div>;
}
function BlockError({message, onRetry}) {
  return <div className="error" role="alert">{message} <button type="button" className="text-button" onClick={onRetry}>Reintentar</button></div>;
}
// Entrada escalonada leve: cada sección se retrasa 60 ms respecto de la anterior (sin animación con movimiento reducido).
function Section({label, index, className = '', children}) {
  return <section className={`panel-card client-section ${className}`} aria-label={label} style={{'--i': index}}>{children}</section>;
}

// Pasos del pedido en curso (el borrador no cuenta como pedido en curso).
const MINI_STEPS = ['Enviada', 'Buscando', 'Ofertas', 'Elige técnico', 'Asignada'];
const MINI_CURRENT = {sent: 0, matching: 1, pending_availability: 1, awaiting_responses: 2, direct_declined: 2, awaiting_choice: 3,
  assigned: 4, in_progress: 4};
// D-91: lo que completa el perfil del cliente para el Inicio.
const PROFILE_ITEMS = [user => user.client_profile?.district_id, user => user.client_profile?.reference_address, user => user.phone, user => user.avatar_url];
const limaMonth = () => Number(new Date().toLocaleDateString('en-CA', {timeZone: 'America/Lima'}).slice(5, 7)) - 1;

function Welcome({user, home, navigate}) {
  const district = home.data?.district;
  const count = home.data?.technicians_in_zone;
  const complete = Math.round(PROFILE_ITEMS.filter(item => item(user)).length / PROFILE_ITEMS.length * 100);
  return <Section label="Bienvenida" index={0} className="client-welcome">
    <div>
      <h2>Hola, {user.given_names || user.name}</h2>
      {home.loading && <Skeleton label="Cargando tu zona…" lines={1}/>}
      {district && <p className="muted">Tu distrito principal: <strong>{district.name}</strong></p>}
      {district && Number.isInteger(count) && <p className="client-zone">{count === 1 ? '1 técnico verificado en tu zona' : `${count} técnicos verificados en tu zona`}</p>}
      {!home.loading && !home.error && !district && <p className="muted">Registra tu distrito principal para ver técnicos de tu zona.</p>}
      {complete < 100 && <div className="client-completion">
        <span>Perfil completo {complete} %</span>
        <span className="client-meter" aria-hidden="true"><span style={{width: `${complete}%`}}/></span>
        <button type="button" className="text-button" onClick={() => navigate('profile')}>Completar mi perfil</button>
      </div>}
    </div>
    <button type="button" className="button primary" onClick={() => navigate('new')}>Pedir un técnico</button>
  </Section>;
}

/** D-93: atajos por problema; el buscador con IA se conectará aquí (prop search, hoy sin uso). */
function Problems({home, onRetry, navigate}) {
  const subcategories = home.data?.subcategories || [];
  const shortcuts = PROBLEMS.map(problem => ({...problem, target: subcategories.find(sub => sub.code === problem.subcategory)}))
    .filter(problem => problem.target);
  return <Section label="¿Qué se malogró?" index={1}>
    <h3>¿Qué se malogró?</h3>
    {home.loading && <Skeleton label="Cargando problemas frecuentes…" lines={2}/>}
    {home.error && <BlockError message="No pudimos cargar los problemas frecuentes." onRetry={onRetry}/>}
    {shortcuts.length > 0 && <div className="client-problems">
      {shortcuts.map(problem => <button key={problem.key} type="button" className="client-problem"
        onClick={() => navigate('new', {preset: {specialty_id: problem.target.specialty_id, subcategory_id: problem.target.id}})}>
        <span className="client-problem-icon" aria-hidden="true">{problem.icon}</span><span>{problem.label}</span>
      </button>)}
    </div>}
  </Section>;
}

function CurrentOrder({requests, onRetry, navigate}) {
  const rows = Array.isArray(requests.data) ? requests.data : [];
  const active = rows.filter(isActive);
  const current = active[0];
  const drafts = rows.filter(row => requestGroup(row) === 'drafts').length;
  const step = current ? MINI_CURRENT[current.phase || current.status] ?? 0 : -1;
  return <Section label="Tu pedido en curso" index={2}>
    <div className="client-block-head"><h3>Tu pedido en curso</h3>
      {active.length > 1 && <button type="button" className="text-button" onClick={() => navigate('requests')}>Ver todas ({active.length})</button>}
    </div>
    {requests.loading && <Skeleton label="Cargando tu pedido…"/>}
    {requests.error && <BlockError message="No pudimos cargar tus pedidos." onRetry={onRetry}/>}
    {current && <>
      <div><strong>{current.subcategory?.name || `Solicitud #${current.id}`}</strong>
        <small className="muted"> Solicitud #{current.id}{current.district ? ` · ${current.district.name}` : ''}</small></div>
      <ol className="client-mini-stepper" aria-label="Progreso de tu pedido">
        {MINI_STEPS.map((label, index) => <li key={label} aria-current={index === step ? 'step' : undefined}
          className={index < step ? 'is-done' : undefined}>{label}</li>)}
      </ol>
      <p className="client-next-line">{NEXT_TEXT[current.phase] || 'Estamos actualizando el estado de tu pedido.'}</p>
      <button type="button" className="button primary" onClick={() => navigate('requests', {open: current.id})}>
        {current.phase === 'awaiting_choice' ? 'Elegir técnico' : 'Ver seguimiento'}</button>
    </>}
    {!requests.loading && !requests.error && !current && <div className="client-first">
      <p><strong>Pide tu primer técnico en 3 pasos</strong></p>
      <ol>
        <li>Cuéntanos qué se malogró y agrega fotos.</li>
        <li>Te avisamos cuando técnicos verificados acepten.</li>
        <li>Elige al que prefieras por tarifa y cercanía.</li>
      </ol>
      {drafts > 0 && <p className="muted">{drafts === 1 ? 'Tienes 1 borrador sin enviar.' : `Tienes ${drafts} borradores sin enviar.`}</p>}
      <button type="button" className="button outline" onClick={() => navigate(drafts > 0 ? 'requests' : 'new')}>
        {drafts > 0 ? 'Continuar mi borrador' : 'Empezar mi pedido'}</button>
    </div>}
  </Section>;
}

function Prices({home, onRetry}) {
  const prices = home.data?.prices || [];
  return <Section label="Precios de referencia" index={3}>
    <h3>Precios de referencia</h3>
    {home.loading && <Skeleton label="Cargando precios…"/>}
    {home.error && <BlockError message="No pudimos cargar los precios de referencia." onRetry={onRetry}/>}
    {home.data && !prices.length && <p className="muted">Aún no hay tarifas publicadas.</p>}
    {prices.length > 0 && <ul className="client-prices">
      {prices.map(price => <li key={price.specialty_id}><span>{price.name}</span><strong>desde S/ {price.from_fee}</strong></li>)}
    </ul>}
    <p className="muted client-note">Orientativos, no son un cobro.</p>
  </Section>;
}

function Nearby({district, nearby, onRetry, navigate}) {
  return <Section label="Técnicos cerca de ti" index={4}>
    <div className="client-block-head"><h3>Técnicos cerca de ti</h3>
      <button type="button" className="text-button" onClick={() => navigate('search')}>Ver todos</button></div>
    {!district && <p className="muted">Registra tu distrito principal en Mi perfil para ver técnicos cerca de ti.</p>}
    {nearby.loading && <Skeleton label="Buscando técnicos cercanos…"/>}
    {nearby.error && <BlockError message="No pudimos cargar los técnicos cercanos." onRetry={onRetry}/>}
    {nearby.data?.items?.length === 0 && <p className="muted">Todavía no hay técnicos verificados con tarifa cerca de tu distrito.</p>}
    {nearby.data?.items?.length > 0 && <div className="client-nearby">
      {nearby.data.items.map(technician => <article key={technician.id} className="client-nearby-card">
        <div className="client-technician-head">
          <span className="client-avatar" aria-hidden="true">{initialsOf(technician.display_name)}</span>
          <div><strong>{technician.display_name}</strong><small className="muted">{technician.services?.[0]?.subcategory_name}</small></div>
        </div>
        <div className="client-technician-meta">
          <span className="client-chip client-distance">{distanceLabel(technician.distance)}</span>
          <span className="client-fee">{feeLabel(technician.services)}</span>
        </div>
        <button type="button" className="button outline" aria-label={`Ver perfil de ${technician.display_name}`}
          onClick={() => navigate('search', {technician})}>Ver perfil</button>
      </article>)}
    </div>}
  </Section>;
}

/**
 * Inicio del cliente aprobado en la revisión del PR #39 (D-87, D-93): bienvenida, «¿Qué se malogró?», pedido en curso,
 * precios de referencia, técnicos cerca, consejo del mes y seguridad. GET /client/home da la zona, los precios y las
 * subcategorías de los atajos; cada sección muestra su esqueleto y su error con «Reintentar».
 */
export default function ClientHome({user, navigate}) {
  const district = user.client_profile?.district_id ?? null;
  const [home, reloadHome] = useBlock('/client/home');
  const [requests, reloadRequests] = useBlock('/requests');
  const [nearby, reloadNearby] = useBlock(district ? '/technicians?sort=proximity&per_page=3' : null);
  return <div className="panel-page client-home">
    <RoleAnnouncements/>
    <Welcome user={user} home={home} navigate={navigate}/>
    <Problems home={home} onRetry={reloadHome} navigate={navigate}/>
    <div className="client-home-row">
      <CurrentOrder requests={requests} onRetry={reloadRequests} navigate={navigate}/>
      <Prices home={home} onRetry={reloadHome}/>
    </div>
    <Nearby district={district} nearby={nearby} onRetry={reloadNearby} navigate={navigate}/>
    <div className="client-home-row">
      <Section label="Consejo del mes" index={5}><h3>Consejo del mes</h3><p>{TIPS[limaMonth()]}</p></Section>
      <Section label="Tu seguridad" index={6}><h3>Tu seguridad</h3>
        <ul className="client-safety">{SAFETY.map(text => <li key={text}>{text}</li>)}</ul></Section>
    </div>
  </div>;
}
