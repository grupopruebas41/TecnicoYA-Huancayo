import React, {useCallback, useEffect, useState} from 'react';
import {request} from '../administration/http';
import RoleAnnouncements from '../administration/RoleAnnouncements';
import RequestPhase from '../requests/RequestPhase';
import {distanceLabel, feeLabel, isActive, requestGroup, statusTone} from './clientRules';

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

/**
 * Inicio del cliente (D-87): comunicados, resumen con datos reales de GET /requests, solicitudes en curso, técnicos
 * cerca (D-88) y accesos por rubro. «Próxima cita» (S5) y «Calificaciones» (S6) no se muestran hasta que existan.
 */
export default function ClientHome({user, navigate}) {
  const district = user.client_profile?.district_id ?? null;
  const [requests, reloadRequests] = useBlock('/requests');
  const [nearby, reloadNearby] = useBlock(district ? '/technicians?sort=proximity&per_page=4' : null);
  const [specialties] = useBlock('/catalog/specialties');
  const rows = Array.isArray(requests.data) ? requests.data : [];
  const active = rows.filter(isActive);
  const choice = rows.filter(row => requestGroup(row) === 'choice').length;
  return <section className="panel-page client-home">
    <RoleAnnouncements/>
    <div className="client-hero">
      <div>
        <h2>Hola, {user.given_names || user.name}</h2>
        <p className="muted">Pide un técnico verificado de tu zona y sigue tus solicitudes en un solo lugar.</p>
      </div>
      <button type="button" className="button primary" onClick={() => navigate('new')}>Pedir un técnico</button>
    </div>

    <section className="panel-cards client-summary" aria-label="Resumen de tus solicitudes" aria-busy={requests.loading}>
      {requests.error ? <BlockError message="No pudimos cargar el resumen de tus solicitudes." onRetry={reloadRequests}/> : <>
        <div className="panel-card"><h3>Solicitudes activas</h3><p className="panel-kpi">{requests.loading ? '…' : active.length}</p>
          <small>En búsqueda, por elegir o asignadas.</small></div>
        <div className="panel-card"><h3>Por elegir técnico</h3><p className="panel-kpi">{requests.loading ? '…' : choice}</p>
          {choice > 0 ? <button type="button" className="text-button" onClick={() => navigate('requests')}>Elegir ahora</button>
            : <small>Te avisaremos cuando un técnico acepte.</small>}</div>
      </>}
    </section>

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

    <section className="panel-card client-block" aria-label="Técnicos cerca de ti">
      <div className="client-block-head"><h3>Técnicos cerca de ti</h3>
        <button type="button" className="text-button" onClick={() => navigate('search')}>Ver todos</button></div>
      {!district && <p className="muted">Registra tu distrito principal en Mi perfil para ver técnicos cerca de ti.</p>}
      {nearby.loading && <p className="muted">Buscando técnicos cercanos…</p>}
      {nearby.error && <BlockError message="No pudimos cargar los técnicos cercanos." onRetry={reloadNearby}/>}
      {nearby.data?.items?.length === 0 && <p className="muted">Todavía no hay técnicos verificados con tarifa cerca de tu distrito.</p>}
      <ul className="client-nearby">
        {nearby.data?.items?.map(technician => <li key={technician.id}>
          <strong>{technician.display_name}</strong>
          <span className="client-distance">{distanceLabel(technician.distance)}</span>
          <span>{feeLabel(technician.services)}</span>
          <button type="button" className="button outline" onClick={() => navigate('new', {technician})}>Solicitar a {technician.display_name}</button>
        </li>)}
      </ul>
    </section>

    {specialties.data?.length > 0 && <nav className="panel-quick client-shortcuts" aria-label="Buscar por rubro">
      {specialties.data.map(specialty => <button key={specialty.id} type="button" className="button outline"
        onClick={() => navigate('search', {filters: {specialty_id: String(specialty.id)}})}>{specialty.name}</button>)}
    </nav>}
  </section>;
}
