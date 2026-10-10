import React, {useEffect, useState} from 'react';
import {request} from './http';
import './account.css';

export default function Catalog() {
  const [specialties, setSpecialties] = useState([]);
  const [selected, setSelected] = useState('');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setError(''); setLoading(true);
    request('/catalog/specialties').then(({data}) => { if (active) { setSpecialties(data); setSelected(''); } })
      .catch(failure => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);
  useEffect(() => {
    let active = true;
    setItems([]);
    if (!selected) return;
    setLoading(true); setError('');
    request(`/catalog/subcategories?specialty_id=${encodeURIComponent(selected)}`)
      .then(({data}) => { if (active) setItems(data); })
      .catch(failure => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selected]);
  return <section className="session-page"><span className="kicker">ESPECIALIDADES</span><h1>Encuentra tu <em>especialidad.</em></h1>
    <label>Especialidad<select data-cy="specialty-select" disabled={loading} value={selected} onChange={event => setSelected(event.target.value)}><option value="">Selecciona una especialidad</option>{specialties.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    {loading && <p role="status">Cargando catálogo…</p>}
    {!loading && !error && !specialties.length && <p role="status">No hay especialidades disponibles.</p>}
    {error ? <div><p role="alert" data-cy="catalog-error">{error}</p><button type="button" className="button outline" onClick={() => { setSelected(''); setRetry(retry + 1); }}>Reintentar</button></div> : !loading && selected && <ul className="session-details" data-cy="subcategory-list">{items.map(item => <li key={item.id}>{item.name}</li>)}{!items.length && <li>No hay subcategorías disponibles.</li>}</ul>}
    <a className="button primary" href="#cuenta">Ir a mi cuenta ↗</a>
  </section>;
}
