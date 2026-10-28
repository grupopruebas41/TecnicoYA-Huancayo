import React, {useCallback, useEffect, useState} from 'react';
import {request} from '../administration/http';
import RoleAnnouncements from '../administration/RoleAnnouncements';
import RequestPhase from '../requests/RequestPhase';
import Icon from '../panel/icons';
import {distanceLabel, feeLabel, initialsOf, isActive, nextStep, requestGroup, statusTone} from './clientRules';

/** Lee un recurso para un bloque del Inicio: cada bloque carga y falla por su cuenta, sin tumbar a los demás. */
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

function BlockError({message, onRetry}) {
  return <div className="error" role="alert">{message} <button type="button" className="text-button" onClick={onRetry}>Reintentar</button></div>;
}

function SummaryCard({icon, title, value, children}) {
  return <div className="panel-card client-stat">
    <span className="client-stat-icon" aria-hidden="true"><Icon name={icon}/></span>
    <div><h3>{title}</h3><p className="panel-kpi">{value}</p>{children}</div>
  </div>;
}

/**
 * Inicio del cliente (D-87; rediseño de la revisión del PR #39): saludo con nombre y distrito, resumen real con
 * estados vacíos y acción, última solicitud con su siguiente paso, técnicos cerca (D-88) y rubros con imagen.
 * «Próxima cita» (S5) y «Calificaciones» (S6) no se muestran hasta que existan.
 */
export default function ClientHome({user, navigate}) {
  const district = user.client_profile?.district_id ?? null;
  const [requests, reloadRequests] = useBlock('/requests');
  const [nearby, reloadNearby] = useBlock(district ? '/technicians?sort=proximity&per_page=4' : null);
  const [specialties] = useBlock('/catalog/specialties');
  const [districts] = useBlock(district ? '/catalog/districts' : null);
  const rows = Array.isArray(requests.data) ? requests.data : [];
  const active = rows.filter(isActive);
  const choice = rows.filter(row => requestGroup(row) === 'choice').length;
  const drafts = rows.filter(row => requestGroup(row) === 'drafts').length;
  const last = rows[0];
  const districtName = Array.isArray(districts.data) ? districts.data.find(item => item.id === district)?.name : null;
  return <section className="panel-page client-home">
    <RoleAnnouncements/>
    <div className="client-hero">
      <div>
        <h2>Hola, {user.given_names || user.name}</h2>
        <p className="muted">{districtName ? <>Tu distrito: <strong>{districtName}</strong></> : 'Pide un técnico verificado de tu zona.'}</p>
      </div>
      <button type="button" className="button primary" onClick={() => navigate('new')}>Pedir un técnico</button>
    </div>

    <section className="panel-cards client-summary" aria-label="Resumen de tus solicitudes" aria-busy={requests.loading}>
      {requests.error && <BlockError message="No pudimos cargar el resumen de tus solicitudes." onRetry={reloadRequests}/>}
      {requests.loading && <p className="muted">Cargando tu resumen…</p>}
      {!requests.loading && !requests.error && !active.length && <div className="panel-card client-empty">
        <span aria-hidden="true"><Icon name="requests"/></span>
        <p><strong>Aún no tienes solicitudes activas.</strong></p>
        <p className="muted">Cuéntanos qué necesitas y lo enviamos a técnicos verificados cerca de ti.</p>
        <button type="button" className="button outline" onClick={() => navigate('new')}>Crear mi primera solicitud</button>
      </div>}
      {!requests.loading && !requests.error && active.length > 0 && <>
        <SummaryCard icon="requests" title="Solicitudes activas" value={active.length}>
          <button type="button" className="text-button" onClick={() => navigate('requests')}>Ver mis solicitudes</button>
        </SummaryCard>
        <SummaryCard icon="users" title="Por elegir técnico" value={choice}>
          {choice > 0 ? <button type="button" className="text-button" onClick={() => navigate('requests')}>Elegir ahora</button>
            : <small>Te avisaremos cuando un técnico acepte.</small>}
        </SummaryCard>
      </>}
      {!requests.loading && drafts > 0 && <SummaryCard icon="plus" title="Borradores" value={drafts}>
        <button type="button" className="text-button" onClick={() => navigate('requests')}>Continuar borradores</button>
      </SummaryCard>}
    </section>

    {last && <section className="panel-card client-block client-last" aria-label="Tu última solicitud">
      <h3>Tu última solicitud</h3>
      <div className="client-last-body">
        <div>
          <strong>{last.subcategory?.name || `Solicitud #${last.id}`}</strong>
          <small className="muted">Solicitud #{last.id}{last.district ? ` · ${last.district.name}` : ''}</small>
        </div>
        {last.phase && <RequestPhase phase={last.phase} className={'client-status ' + statusTone(last)}/>}
      </div>
      <p className="client-next-line">{nextStep(last)}</p>
      <button type="button" className="button outline" onClick={() => navigate('requests', {open: last.id})}>Ver seguimiento</button>
    </section>}

    <section className="panel-card client-block" aria-label="Solicitudes en curso">
      <h3>Solicitudes en curso</h3>
      {requests.loading && <p className="muted">Cargando solicitudes…</p>}
      {!requests.loading && !requests.error && !active.length && <p className="muted">No tienes solicitudes en curso.</p>}
      <ul className="client-active-list">
        {active.slice(0, 3).map(row => <li key={row.id}>
          <span><strong>Solicitud #{row.id}</strong>{row.subcategory && <small>{row.subcategory.name}</small>}</span>
          <RequestPhase phase={row.phase} className={'client-status ' + statusTone(row)}/>
          <button type="button" className="text-button" onClick={() => navigate('requests', {open: row.id})}>Ver solicitud #{row.id}</button>
        </li>)}
      </ul>
    </section>

    <section className="client-block client-section" aria-label="Técnicos cerca de ti">
      <div className="client-block-head"><h3>Técnicos cerca de ti</h3>
        <button type="button" className="text-button" onClick={() => navigate('search')}>Ver todos</button></div>
      {!district && <p className="muted">Registra tu distrito principal en Mi perfil para ver técnicos cerca de ti.</p>}
      {nearby.loading && <p className="muted">Buscando técnicos cercanos…</p>}
      {nearby.error && <BlockError message="No pudimos cargar los técnicos cercanos." onRetry={reloadNearby}/>}
      {nearby.data?.items?.length === 0 && <p className="muted">Todavía no hay técnicos verificados con tarifa cerca de tu distrito.</p>}
      <ul className="client-nearby">
        {nearby.data?.items?.map(technician => <li key={technician.id} className="panel-card">
          <div className="client-technician-head">
            <span className="client-avatar" aria-hidden="true">{initialsOf(technician.display_name)}</span>
            <div><strong>{technician.display_name}</strong>
              <small className="muted">{technician.services?.[0]?.subcategory_name}</small></div>
          </div>
          <div className="client-technician-meta">
            <span className="client-chip client-distance">{distanceLabel(technician.distance)}</span>
            <span className="client-fee">{feeLabel(technician.services)}</span>
          </div>
          <button type="button" className="button primary" onClick={() => navigate('new', {technician})}>Solicitar a {technician.display_name}</button>
        </li>)}
      </ul>
    </section>

    {specialties.data?.length > 0 && <section className="client-block client-section" aria-labelledby="client-needs">
      <h3 id="client-needs">¿Qué necesitas hoy?</h3>
      <nav className="client-shortcuts" aria-label="Buscar por rubro">
        {specialties.data.map(specialty => <button key={specialty.id} type="button" className="client-shortcut"
          onClick={() => navigate('search', {filters: {specialty_id: String(specialty.id)}})}>
          {specialty.image_url ? <img src={specialty.image_url} alt="" loading="lazy"/> : <span className="client-shortcut-icon" aria-hidden="true"><Icon name="search"/></span>}
          <span>{specialty.name}</span>
        </button>)}
      </nav>
    </section>}
  </section>;
}
