import React, {useCallback, useEffect, useState} from 'react';
import {request} from '../administration/http';
import {Notice} from '../administration/forms';
import {REQUEST_STATUS_LABELS, formatDateTime, toQuery} from './adminRules';
import './admin.css';

const PER_PAGE = 20;
const emptyFilters = {status: '', district_id: '', specialty_id: '', created_from: '', created_to: '', q: ''};

function RequestDetail({id, onBack}) {
  const [state, setState] = useState({loading: true, data: null, error: ''});
  useEffect(() => {
    let active = true;
    request(`/admin/requests/${id}`).then(result => { if (active) setState({loading: false, data: result.data, error: ''}); })
      .catch(failure => { if (active) setState({loading: false, data: null, error: failure.message}); });
    return () => { active = false; };
  }, [id]);
  const data = state.data;
  return <section className="admin-detail" aria-busy={state.loading}>
    <button type="button" className="text-button" onClick={onBack}>← Volver a solicitudes</button>
    {state.loading && <p className="muted">Cargando solicitud…</p>}
    <Notice error={state.error}/>
    {data && <>
      <header className="admin-detail-head">
        <div>
          <h3>Solicitud N.º {data.request.id}</h3>
          <p className="muted">{data.request.specialty} · {data.request.subcategory} · {data.request.district} ·{' '}
            <span className={`admin-status is-request-${data.request.status}`}>{REQUEST_STATUS_LABELS[data.request.status]}</span></p>
        </div>
        <p className="admin-readonly">Solo lectura</p>
      </header>
      <div className="admin-detail-grid">
        <section className="panel-card" aria-labelledby="request-data">
          <h4 id="request-data">Datos</h4>
          <dl className="admin-data">
            <div><dt>Cliente</dt><dd>{data.client.name}</dd></div>
            <div><dt>Técnico asignado</dt><dd>{data.technician?.name || 'Sin asignar'}</dd></div>
            <div><dt>Modalidad</dt><dd>{data.request.mode === 'scheduled' ? `Programada · ${formatDateTime(data.request.preferred_start_at)}` : 'Lo antes posible'}</dd></div>
            <div><dt>Tarifa de referencia</dt><dd>{data.request.reference_fee ? `S/ ${data.request.reference_fee.amount}` : '—'}</dd></div>
            <div><dt>Ofertas</dt><dd>{data.offers.total} en total · {data.offers.accepted} aceptadas · {data.offers.rejected} rechazadas · {data.offers.expired} vencidas</dd></div>
            <div><dt>Descripción</dt><dd>{data.request.description}</dd></div>
            {data.request.cancellation_reason && <div><dt>Motivo de cancelación</dt><dd>{data.request.cancellation_reason}</dd></div>}
          </dl>
        </section>
        <section className="panel-card" aria-labelledby="request-timeline">
          <h4 id="request-timeline">Línea de tiempo</h4>
          {!data.timeline.length ? <p className="muted">Sin eventos registrados.</p> : <ol className="admin-timeline">
            {data.timeline.map((event, index) => <li key={index}>
              <strong>{event.summary}</strong>
              <span className="muted">{formatDateTime(event.occurred_at)}{event.to_status ? ` · ${REQUEST_STATUS_LABELS[event.to_status] || event.to_status}` : ''}{event.actor ? ` · ${event.actor}` : ''}</span>
            </li>)}
          </ol>}
        </section>
      </div>
    </>}
  </section>;
}

/** Solicitudes en solo lectura (bloque C, D-85): filtros, tabla y detalle con línea de tiempo. Sin acciones. */
export default function RequestsAdmin() {
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [state, setState] = useState({loading: true, data: null, error: ''});
  const [catalog, setCatalog] = useState({districts: [], specialties: []});
  const load = useCallback(() => {
    setState(current => ({...current, loading: true, error: ''}));
    request(`/admin/requests${toQuery({...filters, page, per_page: PER_PAGE})}`)
      .then(result => setState({loading: false, data: result.data, error: ''}))
      .catch(failure => setState({loading: false, data: null, error: failure.message}));
  }, [filters, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    Promise.all([request('/catalog/districts'), request('/catalog/specialties')])
      .then(([districts, specialties]) => setCatalog({districts: districts.data, specialties: specialties.data})).catch(() => {});
  }, []);
  const filter = name => ({value: filters[name], onChange: event => { setFilters({...filters, [name]: event.target.value}); setPage(1); }});
  if (detail) return <section className="s02-panel admin-page"><RequestDetail id={detail} onBack={() => setDetail(null)}/></section>;
  const data = state.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / PER_PAGE)) : 1;
  return <section className="s02-panel admin-page" aria-busy={state.loading}>
    <header className="admin-page-head"><h2>Solicitudes</h2><p className="admin-readonly">Solo lectura</p></header>
    <div className="admin-filters" role="group" aria-label="Filtrar solicitudes">
      <label><span>Estado</span><select {...filter('status')}><option value="">Todos</option>
        {Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label><span>Especialidad</span><select {...filter('specialty_id')}><option value="">Todas</option>
        {catalog.specialties.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label><span>Distrito</span><select {...filter('district_id')}><option value="">Todos</option>
        {catalog.districts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label><span>Desde</span><input type="date" {...filter('created_from')}/></label>
      <label><span>Hasta</span><input type="date" {...filter('created_to')}/></label>
      <label><span>N.º de solicitud</span><input type="number" min={1} inputMode="numeric" {...filter('q')}/></label>
    </div>
    <Notice error={state.error}/>
    {data && (!data.items.length ? <p className="admin-empty">Ninguna solicitud coincide con los filtros.</p> : <>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <caption className="panel-sr">Solicitudes ({data.total})</caption>
          <thead><tr><th scope="col">N.º</th><th scope="col">Servicio</th><th scope="col">Distrito</th><th scope="col">Cliente</th>
            <th scope="col">Técnico</th><th scope="col">Estado</th><th scope="col">Creada</th></tr></thead>
          <tbody>{data.items.map(item => <tr key={item.id}>
            <td><button type="button" className="admin-link" aria-label={`Ver la solicitud ${item.id}`} onClick={() => setDetail(item.id)}>{item.id}</button></td>
            <td>{item.specialty} · {item.subcategory}</td><td>{item.district}</td><td>{item.client}</td><td>{item.technician?.name || '—'}</td>
            <td><span className={`admin-status is-request-${item.status}`}>{REQUEST_STATUS_LABELS[item.status]}</span></td><td>{formatDateTime(item.created_at)}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <nav className="admin-pagination" aria-label="Páginas de solicitudes">
        <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
        <span>Página {page} de {pages} · {data.total} solicitudes</span>
        <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)}>Siguiente</button>
      </nav>
    </>)}
  </section>;
}
