import React, {useCallback, useEffect, useRef, useState} from 'react';
import {download, request} from '../administration/http';
import {REQUEST_STATUS_LABELS, formatDateTime, toQuery} from './adminRules';
import {INTERVENTIONS, INTERVENTION_MIN, OfferStatus, RequestStatus, intervene, secondsLabel} from './operations';
import ReasonDialog from './ReasonDialog';
import {ClientPage, EmptyState} from '../client/ui';
import Icon from '../panel/icons';
import {shortDateTime} from './homeFormat';
import './admin.css';

/**
 * Solicitudes del panel del administrador, Fase A3: filtros, tabla que en el celular pasa a tarjetas (DEF-81), orden por
 * columna, CSV de la vista filtrada y detalle completo con la intervención de D-116 según D-120.
 */
const PER_PAGE = 20;
const emptyFilters = {status: '', district_id: '', specialty_id: '', created_from: '', created_to: '', q: ''};
const PLANS = {premium: 'Premium', free: 'Free'};

function Section({id, title, children}) {
  return <section className="adm-card adm-request-part" aria-labelledby={id}>
    <h3 id={id}>{title}</h3>
    {children}
  </section>;
}

function OffersTable({offers}) {
  if (!offers.length) return <p className="muted">Todavía no se enviaron ofertas.</p>;
  return <div className="adm-table-scroll">
    <table className="adm-table adm-offers">
      <caption className="sr-only">Ofertas enviadas</caption>
      <thead><tr><th scope="col">Técnico</th><th scope="col">Ronda</th><th scope="col">Estado</th><th scope="col">Enviada</th>
        <th scope="col">Vence</th><th scope="col">Respuesta</th></tr></thead>
      <tbody>{offers.map(offer => <tr key={offer.id}>
        <td data-label="Técnico">{offer.technician.name}</td>
        <td data-label="Ronda">{offer.search_generation > 1 ? `${offer.round_no} (búsqueda ${offer.search_generation})` : offer.round_no}</td>
        <td data-label="Estado"><OfferStatus status={offer.status}/></td>
        <td data-label="Enviada">{shortDateTime(offer.available_at)}</td>
        <td data-label="Vence">{shortDateTime(offer.expires_at)}</td>
        <td data-label="Respuesta">{secondsLabel(offer.response_seconds)}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function RequestDetail({id, onBack}) {
  const [state, setState] = useState({loading: true, data: null, error: ''});
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState('');
  const load = useCallback(() => {
    setState(current => ({...current, loading: true, error: ''}));
    request(`/admin/requests/${id}`).then(result => setState({loading: false, data: result.data, error: ''}))
      .catch(failure => setState({loading: false, data: null, error: failure.message}));
  }, [id]);
  useEffect(load, [load]);
  async function confirm(reason) {
    setDialog(current => ({...current, busy: true, error: ''}));
    try {
      await intervene(id, dialog.action, reason, state.data.request.version);
      setNotice(INTERVENTIONS[dialog.action].done);
      setDialog(null);
      load();
    } catch (failure) {
      setDialog(current => ({...current, busy: false, error: failure.message}));
    }
  }
  const data = state.data;
  const actions = data?.actions || {};
  return <ClientPage id="adm-request" icon="requests" tone="blue" title={`Solicitud N.º ${id}`} className="adm-page adm-request"
    intro={data && <>{data.request.specialty} · {data.request.district} · creada {shortDateTime(data.request.created_at)}</>}
    actions={<button type="button" className="button outline" onClick={onBack}><Icon name="chevron"/>Volver a solicitudes</button>}>
    {state.loading && !data && <p className="muted">Cargando la solicitud…</p>}
    {state.error && <p className="error" role="alert">{state.error}</p>}
    {notice && <p className="adm-notice" role="status"><Icon name="check"/>{notice}</p>}
    {data && <>
      <div className="adm-request-bar">
        <RequestStatus status={data.request.status}/>
        {(actions.cancel || actions.rematch) && <div className="adm-request-actions">
          {actions.rematch && <button type="button" className="button outline" onClick={() => setDialog({action: 'rematch'})}>
            <Icon name="bolt"/>{INTERVENTIONS.rematch.open}</button>}
          {actions.cancel && <button type="button" className="button outline adm-danger" onClick={() => setDialog({action: 'cancellation'})}>
            <Icon name="close"/>{INTERVENTIONS.cancellation.open}</button>}
        </div>}
      </div>
      <div className="adm-request-grid">
        <Section id="adm-request-summary" title="Resumen">
          <ul className="adm-chips-list" aria-label="Subcategorías">
            {(data.request.subcategories || [data.request.subcategory]).map(name => <li key={name} className="adm-chip">{name}</li>)}
          </ul>
          <dl className="adm-data">
            <div><dt>Modalidad</dt><dd>{data.request.mode === 'scheduled' ? `Programada · ${formatDateTime(data.request.preferred_start_at)}` : 'Lo antes posible'}</dd></div>
            <div><dt>Tarifa de referencia</dt><dd>{data.request.reference_fee ? `S/ ${Number(data.request.reference_fee.amount).toFixed(2).replace('.', ',')}` : '—'}</dd></div>
            <div><dt>Descripción</dt><dd>{data.request.description}</dd></div>
            {data.request.cancellation_reason && <div><dt>Motivo de cancelación</dt><dd>{data.request.cancellation_reason}</dd></div>}
          </dl>
        </Section>
        <Section id="adm-request-client" title="Cliente">
          <dl className="adm-data">
            <div><dt>Nombre</dt><dd>{data.client.name}</dd></div>
            <div><dt>Distrito</dt><dd>{data.client.district || '—'}</dd></div>
            <div><dt>Plan</dt><dd>{PLANS[data.client.plan] || data.client.plan}</dd></div>
          </dl>
        </Section>
        <Section id="adm-request-technician" title="Técnico asignado">
          <p>{data.technician?.name || 'Sin técnico asignado'}</p>
        </Section>
      </div>
      <Section id="adm-request-offers" title="Ofertas enviadas"><OffersTable offers={data.offer_list || []}/></Section>
      <Section id="adm-request-timeline" title="Línea de tiempo">
        {!data.timeline.length ? <p className="muted">Sin eventos registrados.</p> : <ol className="adm-steps">
          {data.timeline.map(event => <li key={`${event.occurred_at}-${event.event_type}`}>
            <strong>{event.summary}</strong>
            <span className="muted">{shortDateTime(event.occurred_at)}{event.to_status ? ` · ${REQUEST_STATUS_LABELS[event.to_status] || event.to_status}` : ''}
              {event.actor ? ` · ${event.actor}` : ''}</span>
          </li>)}
        </ol>}
      </Section>
    </>}
    {dialog && <ReasonDialog title={INTERVENTIONS[dialog.action].title(id)} description={INTERVENTIONS[dialog.action].description}
      confirmLabel={INTERVENTIONS[dialog.action].confirm} danger={INTERVENTIONS[dialog.action].danger} minLength={INTERVENTION_MIN}
      busy={dialog.busy} error={dialog.error} onCancel={() => setDialog(null)} onConfirm={confirm}/>}
  </ClientPage>;
}

/** Orden en el cliente de la página visible: por número o por fecha de creación. */
function sortRows(items, sort) {
  if (!sort) return items;
  const value = item => (sort.key === 'id' ? item.id : Date.parse(item.created_at));
  return [...items].sort((a, b) => (value(a) - value(b)) * (sort.dir === 'ascending' ? 1 : -1));
}

function SortHeader({label, column, sort, onSort}) {
  const active = sort?.key === column;
  return <th scope="col" aria-sort={active ? sort.dir : 'none'}>
    <button type="button" className="adm-sort" onClick={() => onSort(column)}>
      {label}<span aria-hidden="true">{active && sort.dir === 'ascending' ? ' ↑' : ' ↓'}</span>
    </button>
  </th>;
}

export default function RequestsAdmin({intent = null}) {
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(null);
  const [detail, setDetail] = useState(intent?.request ?? null);
  const [state, setState] = useState({loading: true, data: null, error: ''});
  const [exporting, setExporting] = useState({busy: false, message: '', error: ''});
  const [catalog, setCatalog] = useState({districts: [], specialties: []});
  // DEF-84: se pide la lista en cada tecla; solo se aplica la respuesta de la última consulta (las anteriores se descartan).
  const latest = useRef(0);
  const load = useCallback(() => {
    const ticket = ++latest.current;
    setState(current => ({...current, loading: true, error: ''}));
    request(`/admin/requests${toQuery({...filters, page, per_page: PER_PAGE})}`)
      .then(result => { if (ticket === latest.current) setState({loading: false, data: result.data, error: ''}); })
      .catch(failure => { if (ticket === latest.current) setState({loading: false, data: null, error: failure.message}); });
  }, [filters, page]);
  useEffect(() => { if (!detail) load(); }, [load, detail]);
  useEffect(() => {
    Promise.all([request('/catalog/districts'), request('/catalog/specialties')])
      .then(([districts, specialties]) => setCatalog({districts: districts.data, specialties: specialties.data})).catch(() => {});
  }, []);
  async function exportCsv() {
    setExporting({busy: true, message: '', error: ''});
    try {
      const {truncated} = await download(`/admin/requests/export${toQuery(filters)}`, 'solicitudes.csv');
      setExporting({busy: false, error: '', message: truncated
        ? 'El archivo trae solo las primeras 5000 filas: filtra más para ver el resto.' : 'Descargamos el CSV de la vista filtrada.'});
    } catch (failure) {
      setExporting({busy: false, message: '', error: failure.message});
    }
  }
  const filter = name => ({value: filters[name], onChange: event => { setFilters({...filters, [name]: event.target.value}); setPage(1); }});
  const toggleSort = column => setSort(current => ({key: column, dir: current?.key === column && current.dir === 'ascending' ? 'descending' : 'ascending'}));
  if (detail) return <RequestDetail id={detail} onBack={() => setDetail(null)}/>;
  const data = state.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / PER_PAGE)) : 1;
  return <ClientPage id="adm-requests" icon="requests" tone="blue" title="Solicitudes" className="adm-page adm-requests"
    intro="Busca, revisa y, si hace falta, interviene una solicitud."
    actions={<button type="button" className="button outline" disabled={exporting.busy} aria-busy={exporting.busy} onClick={exportCsv}>
      <Icon name="upload"/>Exportar CSV</button>}>
    {exporting.message && <p className="adm-notice" role="status"><Icon name="check"/>{exporting.message}</p>}
    {exporting.error && <p className="error" role="alert">{exporting.error}</p>}
    <div className="adm-filters" role="group" aria-label="Filtrar solicitudes">
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
    {state.error && <p className="error" role="alert">{state.error}</p>}
    {data && (!data.items.length
      ? <EmptyState icon="requests" tone="blue" title="Ninguna solicitud coincide con los filtros." text="Prueba con otro estado, distrito o rango de fechas."/>
      : <>
        <div className="adm-table-wrap">
          <table className="adm-table adm-responsive">
            <caption className="sr-only">Solicitudes ({data.total})</caption>
            <thead><tr><SortHeader label="N.º" column="id" sort={sort} onSort={toggleSort}/><th scope="col">Servicio</th><th scope="col">Distrito</th>
              <th scope="col">Técnico</th><th scope="col">Estado</th><SortHeader label="Creada" column="created_at" sort={sort} onSort={toggleSort}/>
              <th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>{sortRows(data.items, sort).map(item => <tr key={item.id}>
              <td data-label="N.º">{item.id}</td>
              <td data-label="Servicio">{item.specialty} · {item.subcategory}</td>
              <td data-label="Distrito">{item.district}</td>
              <td data-label="Técnico">{item.technician?.name || '—'}</td>
              <td data-label="Estado"><RequestStatus status={item.status}/></td>
              <td data-label="Creada">{shortDateTime(item.created_at)}</td>
              <td data-label="Acciones"><button type="button" className="button outline adm-row-open" aria-label={`Ver la solicitud ${item.id}`}
                onClick={() => setDetail(item.id)}>Ver</button></td>
            </tr>)}</tbody>
          </table>
        </div>
        <nav className="adm-pagination" aria-label="Páginas de solicitudes">
          <button type="button" className="button outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
          <span>Página {page} de {pages} · {data.total} solicitudes</span>
          <button type="button" className="button outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>Siguiente</button>
        </nav>
      </>)}
  </ClientPage>;
}
