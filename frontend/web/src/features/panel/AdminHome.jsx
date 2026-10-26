import React, {useCallback, useEffect, useState} from 'react';
import {request} from '../administration/http';

// Estados de service_requests en el orden del ciclo de vida (contrato S07 §7).
const statusLabels = {
  registered: 'Borradores', sent: 'Enviadas', pending_availability: 'Pendientes de disponibilidad', assigned: 'Asignadas',
  in_progress: 'En curso', completed: 'Completadas', closed: 'Cerradas', unrated: 'Sin calificar', cancelled: 'Canceladas',
  expired: 'Vencidas',
};
const roleLabels = {client: ['cliente', 'clientes'], technician: ['técnico', 'técnicos'], admin: ['administrador', 'administradores']};

function Card({id, title, children}) {
  return <section className="panel-card" aria-labelledby={id}><h3 id={id}>{title}</h3>{children}</section>;
}
function NewUsers({label, counts}) {
  return <p><strong>{counts.total}</strong> {label}
    <small>{Object.entries(roleLabels).map(([role, [one, many]]) => `${counts[role]} ${counts[role] === 1 ? one : many}`).join(' · ')}</small></p>;
}

/** Inicio del administrador: indicadores reales de GET /admin/dashboard, sin cifras inventadas. */
export default function AdminHome() {
  const [state, setState] = useState({loading: true, data: null, error: ''});
  const load = useCallback(() => {
    setState(current => ({...current, loading: true, error: ''}));
    Promise.resolve().then(() => request('/admin/dashboard'))
      .then(result => setState({loading: false, data: result.data, error: ''}))
      .catch(failure => setState({loading: false, data: null, error: failure.message || 'No pudimos cargar los indicadores.'}));
  }, []);
  useEffect(load, [load]);
  const {data} = state;
  return <section className="panel-page" aria-busy={state.loading}>
    <h2>Inicio</h2>
    {state.loading && !data && <p className="muted">Cargando indicadores…</p>}
    {state.error && <div className="error" role="alert">{state.error} <button type="button" className="text-button" onClick={load}>Reintentar</button></div>}
    {data && <>
      <p className="muted">Actualizado: {new Date(data.generated_at).toLocaleTimeString('es-PE', {hour: '2-digit', minute: '2-digit'})}</p>
      <div className="panel-cards">
        <Card id="kpi-requests" title="Solicitudes">
          <p className="panel-kpi">{data.requests_total}</p>
          {data.requests_total === 0 ? <p className="muted">Aún no hay solicitudes registradas.</p>
            : <dl className="panel-statuses">{Object.entries(data.requests_by_status).map(([status, total]) =>
              <div key={status}><dt>{statusLabels[status] || status}</dt><dd>{total}</dd></div>)}</dl>}
        </Card>
        <Card id="kpi-technicians" title="Técnicos por verificar">
          <p className="panel-kpi">{data.technicians_pending_verification}</p>
          {data.technicians_pending_verification === 0 && <p className="muted">No hay técnicos esperando verificación.</p>}
        </Card>
        <Card id="kpi-users" title="Usuarios nuevos">
          <NewUsers label="en los últimos 7 días" counts={data.new_users.last_7_days}/>
          <NewUsers label="en los últimos 30 días" counts={data.new_users.last_30_days}/>
        </Card>
        <Card id="kpi-ratings" title="Calificaciones">
          {data.ratings.available
            ? <p className="panel-kpi">{data.ratings.average}</p>
            : <p className="muted">No disponible hasta el {data.ratings.available_from}: las calificaciones todavía no existen.</p>}
        </Card>
      </div>
    </>}
  </section>;
}
