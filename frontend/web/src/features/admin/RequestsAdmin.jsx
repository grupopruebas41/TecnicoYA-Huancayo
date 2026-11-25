import React, {useCallback, useEffect, useRef, useState} from 'react';
import {download, request} from '../administration/http';
import {REQUEST_STATUS_LABELS, toQuery} from './adminRules';
import {RequestStatus} from './operations';
import RequestDetail from './RequestDetail';
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
              <td data-label="Acciones"><button type="button" className="adm-btn adm-btn-secondary adm-row-open" aria-label={`Ver la solicitud ${item.id}`}
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
