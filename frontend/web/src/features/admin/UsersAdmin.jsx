import React, {useCallback, useEffect, useState} from 'react';
import {request} from '../administration/http';
import {Notice} from '../administration/forms';
import UserDetail from './UserDetail';
import UserForm from './UserForm';
import {ROLE_LABELS, USER_STATUS_LABELS, formatDate, toQuery} from './adminRules';
import './admin.css';

const PER_PAGE = 20;
const emptyFilters = {q: '', role: '', status: '', district_id: '', created_from: '', created_to: ''};

/** Usuarios (bloque C, D-85): tabla con búsqueda y filtros, alta con enlace de activación y detalle con acciones. */
export default function UsersAdmin({currentUserId, intent}) {
  const [view, setView] = useState(intent === 'create' ? {name: 'create'} : {name: 'list'});
  const [filters, setFilters] = useState(emptyFilters);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({loading: true, data: null, error: ''});
  const [districts, setDistricts] = useState([]);
  const [notice, setNotice] = useState('');
  const load = useCallback(() => {
    setState(current => ({...current, loading: true, error: ''}));
    return request(`/admin/users${toQuery({...filters, page, per_page: PER_PAGE})}`)
      .then(result => setState({loading: false, data: result.data, error: ''}))
      .catch(failure => setState({loading: false, data: null, error: failure.message}));
  }, [filters, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { request('/catalog/districts').then(result => setDistricts(result.data)).catch(() => setDistricts([])); }, []);
  // La búsqueda se aplica al dejar de escribir (o con Enter) para no consultar en cada tecla.
  useEffect(() => {
    const timer = setTimeout(() => { setFilters(current => (current.q === search.trim() ? current : {...current, q: search.trim()})); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [search]);
  const filter = name => ({value: filters[name], onChange: event => { setFilters({...filters, [name]: event.target.value}); setPage(1); }});

  if (view.name === 'create') {
    return <section className="s02-panel admin-page">
      <UserForm onCancel={() => setView({name: 'list'})} onSaved={(message, created) => { setNotice(message); setView({name: 'detail', id: created.id}); load(); }}/>
    </section>;
  }
  if (view.name === 'detail') {
    return <section className="s02-panel admin-page">
      <Notice success={notice}/>
      <UserDetail id={view.id} currentUserId={currentUserId} onBack={() => { setNotice(''); setView({name: 'list'}); }} onChanged={load}/>
    </section>;
  }
  const data = state.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / PER_PAGE)) : 1;
  return <section className="s02-panel admin-page" aria-busy={state.loading}>
    <header className="admin-page-head">
      <h2>Usuarios</h2>
      <button type="button" className="button primary" onClick={() => { setNotice(''); setView({name: 'create'}); }}>Crear usuario</button>
    </header>
    <Notice success={notice}/>
    <form className="admin-filters" role="search" aria-label="Buscar usuarios" onSubmit={event => { event.preventDefault(); setFilters({...filters, q: search.trim()}); setPage(1); }}>
      <label className="admin-filter-search"><span>Buscar por nombre o correo</span>
        <input type="search" value={search} maxLength={120} onChange={event => setSearch(event.target.value)}/></label>
      <label><span>Rol</span><select {...filter('role')}><option value="">Todos</option>
        {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label><span>Estado</span><select {...filter('status')}><option value="">Todos (sin eliminados)</option>
        {Object.entries(USER_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label><span>Distrito</span><select {...filter('district_id')}><option value="">Todos</option>
        {districts.map(district => <option key={district.id} value={district.id}>{district.name}</option>)}</select></label>
      <label><span>Alta desde</span><input type="date" {...filter('created_from')}/></label>
      <label><span>Alta hasta</span><input type="date" {...filter('created_to')}/></label>
      <button type="button" className="text-button" onClick={() => { setSearch(''); setFilters(emptyFilters); setPage(1); }}>Limpiar filtros</button>
    </form>
    <Notice error={state.error}/>
    {data && (!data.items.length ? <p className="admin-empty">Ningún usuario coincide con la búsqueda.</p> : <>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <caption className="panel-sr">Usuarios ({data.total})</caption>
          <thead><tr><th scope="col">Nombre</th><th scope="col">Correo</th><th scope="col">Rol</th><th scope="col">Estado</th><th scope="col">Distrito</th><th scope="col">Alta</th></tr></thead>
          <tbody>{data.items.map(user => <tr key={user.id}>
            <td><button type="button" className="admin-link" onClick={() => { setNotice(''); setView({name: 'detail', id: user.id}); }}>{user.name}</button></td>
            <td>{user.email}</td><td>{ROLE_LABELS[user.role]}</td>
            <td><span className={`admin-status is-${user.status}`}>{USER_STATUS_LABELS[user.status]}</span></td>
            <td>{user.district?.name || '—'}</td><td>{formatDate(user.created_at)}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <nav className="admin-pagination" aria-label="Páginas de usuarios">
        <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
        <span>Página {page} de {pages} · {data.total} usuarios</span>
        <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)}>Siguiente</button>
      </nav>
    </>)}
  </section>;
}
