import React, {useCallback, useEffect, useRef, useState} from 'react';
import {request} from '../administration/http';

const KINDS = [['objeto', 'Objeto'], ['sintoma', 'Síntoma'], ['general', 'General']];
const LEVELS = {alta: 'Confianza alta', media: 'Confianza media', baja: 'Confianza baja'};
const TABS = [['phrases', 'Frases'], ['test', 'Probar una frase'], ['misses', 'Búsquedas sin resultado'], ['suggestions', 'Frases sugeridas por IA']];
const blank = {subcategory_id: '', phrase: '', kind: 'objeto', weight: '5'};

/** Validación de cliente de una frase; el servidor vuelve a validar (D-94). */
export function validateKeyword(values, editing = false) {
  const errors = {};
  if (!editing && !values.subcategory_id) errors.subcategory_id = 'Elige la subcategoría.';
  const length = Array.from(values.phrase.trim()).length;
  if (length < 2 || length > 120) errors.phrase = 'La frase debe tener entre 2 y 120 caracteres.';
  const weight = Number(values.weight);
  if (!Number.isInteger(weight) || weight < 1 || weight > 10) errors.weight = 'El peso debe estar entre 1 y 10.';
  if (!KINDS.some(([code]) => code === values.kind)) errors.kind = 'Elige el tipo.';
  return errors;
}

function useList(path) {
  const [state, setState] = useState({data: null, error: ''});
  const load = useCallback(() => {
    Promise.resolve().then(() => request(path)).then(result => setState({data: result.data, error: ''}))
      .catch(failure => setState({data: null, error: failure.message}));
  }, [path]);
  useEffect(load, [load]);
  return [state, load];
}

function PhraseForm({subcategories, editing, onSaved, onCancel}) {
  const [values, setValues] = useState(editing ? {subcategory_id: String(editing.subcategory_id), phrase: editing.phrase, kind: editing.kind,
    weight: String(editing.weight)} : blank);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = name => event => setValues({...values, [name]: event.target.value});
  async function submit(event) {
    event.preventDefault();
    const found = validateKeyword(values, Boolean(editing));
    setErrors(found); setError('');
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const body = {phrase: values.phrase.trim(), kind: values.kind, weight: Number(values.weight)};
      const result = editing
        ? await request(`/admin/keywords/${editing.id}`, {...body, expected_version: editing.version}, 'PATCH')
        : await request('/admin/keywords', {...body, subcategory_id: Number(values.subcategory_id)}, 'POST');
      setValues(blank);
      onSaved(result.data, editing ? 'Guardamos los cambios de la frase.' : 'Agregamos la frase al diccionario.');
    } catch (failure) {
      setErrors(Object.fromEntries(Object.entries(failure.fields || {}).map(([field, messages]) => [field, messages[0]])));
      setError(failure.message);
    } finally { setBusy(false); }
  }
  const field = name => ({id: `keyword-${name}`, 'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `keyword-${name}-error` : undefined});
  const hint = name => errors[name] && <span id={`keyword-${name}-error`} className="field-error">{errors[name]}</span>;
  // Etiqueta con htmlFor: si envolviera al select, su nombre accesible incluiría el texto de las opciones.
  const label = (name, text) => <label htmlFor={`keyword-${name}`}>{text}</label>;
  return <form className="panel-card admin-keyword-form" aria-label={editing ? 'Editar frase' : 'Nueva frase'} onSubmit={submit} noValidate aria-busy={busy}>
    <h3>{editing ? 'Editar frase' : 'Nueva frase'}</h3>
    <div className="admin-keyword-fields">
      <div className="form-field">{label('subcategory_id', 'Subcategoría')}
        <select value={values.subcategory_id} onChange={set('subcategory_id')} disabled={Boolean(editing)} {...field('subcategory_id')}>
          <option value="">Elige una subcategoría</option>
          {subcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.specialty} › {sub.name}</option>)}
        </select>{hint('subcategory_id')}
      </div>
      <div className="form-field">{label('phrase', 'Frase')}
        <input value={values.phrase} onChange={set('phrase')} placeholder="Ej.: no enfría" {...field('phrase')}/>{hint('phrase')}</div>
      <div className="form-field">{label('kind', 'Tipo')}
        <select value={values.kind} onChange={set('kind')} {...field('kind')}>{KINDS.map(([code, text]) => <option key={code} value={code}>{text}</option>)}</select>
        {hint('kind')}
      </div>
      <div className="form-field">{label('weight', 'Peso (1 a 10)')}
        <input type="number" min="1" max="10" value={values.weight} onChange={set('weight')} {...field('weight')}/>{hint('weight')}</div>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="admin-actions">
      <button type="submit" className="button primary" disabled={busy}>{editing ? 'Guardar cambios' : 'Agregar frase'}</button>
      {editing && <button type="button" className="button outline" onClick={onCancel}>Cancelar</button>}
    </div>
  </form>;
}

function Phrases({subcategories, onNotice}) {
  const [filters, setFilters] = useState({subcategory_id: '', q: ''});
  const [search, setSearch] = useState('');
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();
  const [list, reload] = useList(`/admin/keywords${query ? `?${query}` : ''}`);
  const [editing, setEditing] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const confirmButton = useRef(null);
  useEffect(() => { if (confirming) confirmButton.current?.focus(); }, [confirming]);
  async function toggle(keyword) {
    try {
      await request(`/admin/keywords/${keyword.id}`, {active: !keyword.active, expected_version: keyword.version}, 'PATCH');
      onNotice({success: keyword.active ? 'Desactivamos la frase: ya no cuenta en el buscador.' : 'Activamos la frase.'});
      setConfirming(null); reload();
    } catch (failure) { onNotice({error: failure.message}); setConfirming(null); }
  }
  return <div className="admin-keywords-phrases">
    <PhraseForm key={editing?.id || 'new'} subcategories={subcategories} editing={editing} onCancel={() => setEditing(null)}
      onSaved={(saved, message) => { onNotice({success: message}); setEditing(null); reload(); }}/>
    <form className="admin-filters" role="search" aria-label="Buscar frases" onSubmit={event => { event.preventDefault(); setFilters({...filters, q: search.trim()}); }}>
      <div className="form-field"><label htmlFor="keyword-filter-subcategory">Subcategoría</label>
        <select id="keyword-filter-subcategory" value={filters.subcategory_id} onChange={event => setFilters({...filters, subcategory_id: event.target.value})}>
          <option value="">Todas</option>
          {subcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.specialty} › {sub.name}</option>)}
        </select>
      </div>
      <label className="admin-filter-search"><span>Buscar frase</span><input type="search" value={search} onChange={event => setSearch(event.target.value)}/></label>
      <button type="submit" className="button outline">Buscar</button>
    </form>
    {list.error && <p className="error" role="alert">{list.error}</p>}
    {list.data && (!list.data.items.length ? <p className="admin-empty">No hay frases con estos filtros.</p> : <div className="admin-table-wrap">
      <table className="admin-table">
        <caption className="sr-only">Frases del diccionario</caption>
        <thead><tr><th scope="col">Frase</th><th scope="col">Subcategoría</th><th scope="col">Tipo</th><th scope="col">Peso</th>
          <th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>
        <tbody>{list.data.items.map(keyword => <tr key={keyword.id}>
          <td>{keyword.phrase}</td><td>{keyword.subcategory_name}</td>
          <td>{KINDS.find(([code]) => code === keyword.kind)?.[1]}</td><td>{keyword.weight}</td>
          <td><span className={'admin-status ' + (keyword.active ? 'is-active' : 'is-anonymized')}>{keyword.active ? 'Activa' : 'Inactiva'}</span></td>
          <td className="admin-row-actions">
            <button type="button" className="text-button" onClick={() => setEditing(keyword)}>Editar {keyword.phrase}</button>
            {confirming === keyword.id ? <span role="group" aria-label={`Confirmar desactivación de ${keyword.phrase}`}>
              <button ref={confirmButton} type="button" className="text-button" onClick={() => toggle(keyword)}>Sí, desactivar</button>
              <button type="button" className="text-button" onClick={() => setConfirming(null)}>Cancelar</button>
            </span> : <button type="button" className="text-button" onClick={() => (keyword.active ? setConfirming(keyword.id) : toggle(keyword))}>
              {keyword.active ? 'Desactivar' : 'Activar'} {keyword.phrase}</button>}
          </td>
        </tr>)}</tbody>
      </table>
    </div>)}
  </div>;
}

function TestPhrase() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (text.trim().length < 3) { setError('Escribe al menos 3 caracteres.'); setResult(null); return; }
    try { setResult((await request(`/admin/keywords/test?${new URLSearchParams({q: text.trim()})}`)).data); setError(''); }
    catch (failure) { setError(failure.message); setResult(null); }
  }
  return <form className="panel-card admin-keyword-test" aria-label="Probar una frase" onSubmit={submit} noValidate>
    <label>Frase de un cliente<input value={text} onChange={event => setText(event.target.value)} placeholder="Ej.: mi congeladora no enfría"/></label>
    <button type="submit" className="button primary">Probar</button>
    {error && <p className="error" role="alert">{error}</p>}
    {result && (!result.items.length ? <p className="admin-empty">El diccionario no reconoce esta frase.</p> : <>
      <p><strong>{LEVELS[result.level]}</strong></p>
      <ol className="admin-keyword-results">{result.items.map(item => <li key={item.subcategory_id}>
        {item.specialty_name} › <strong>{item.subcategory_name}</strong> · puntaje {item.score}
        <small className="muted"> (coincidió: {item.matched.join(', ')})</small>
      </li>)}</ol>
    </>)}
  </form>;
}

function Misses() {
  const [list] = useList('/admin/keyword-misses');
  if (list.error) return <p className="error" role="alert">{list.error}</p>;
  if (!list.data) return <p className="muted">Cargando…</p>;
  return list.data.length ? <div className="admin-table-wrap"><table className="admin-table">
    <caption className="sr-only">Búsquedas sin resultado</caption>
    <thead><tr><th scope="col">Búsqueda (normalizada)</th><th scope="col">Veces</th></tr></thead>
    <tbody>{list.data.map(miss => <tr key={miss.id}><td>{miss.query}</td><td>{miss.count}</td></tr>)}</tbody>
  </table></div> : <p className="admin-empty">Todavía no hay búsquedas sin resultado.</p>;
}

function Suggestions({onNotice, onCount}) {
  const [list, reload] = useList('/admin/keyword-suggestions');
  useEffect(() => { if (list.data) onCount(list.data.length); }, [list.data, onCount]);
  async function resolve(suggestion, approve) {
    try {
      await (approve ? request(`/admin/keyword-suggestions/${suggestion.id}/approval`, {}, 'POST')
        : request(`/admin/keyword-suggestions/${suggestion.id}`, undefined, 'DELETE'));
      onNotice({success: approve ? `Agregamos «${suggestion.query}» a ${suggestion.subcategory_name}.` : `Descartamos «${suggestion.query}».`});
      reload();
    } catch (failure) { onNotice({error: failure.message}); }
  }
  if (list.error) return <p className="error" role="alert">{list.error}</p>;
  if (!list.data) return <p className="muted">Cargando…</p>;
  return list.data.length ? <ul className="admin-keyword-suggestions">{list.data.map(suggestion => <li key={suggestion.id} className="panel-card">
    <span><strong>«{suggestion.query}»</strong> → {suggestion.specialty_name} › {suggestion.subcategory_name}
      <small className="muted"> · {suggestion.count} {suggestion.count === 1 ? 'vez' : 'veces'}</small></span>
    <span className="admin-actions">
      <button type="button" className="button primary" onClick={() => resolve(suggestion, true)}>Aprobar «{suggestion.query}»</button>
      <button type="button" className="button outline" onClick={() => resolve(suggestion, false)}>Descartar «{suggestion.query}»</button>
    </span>
  </li>)}</ul> : <p className="admin-empty">No hay frases sugeridas por la IA pendientes.</p>;
}

/**
 * Catálogo › Palabras clave (D-94): diccionario del buscador «¿Qué se malogró?». Frases por subcategoría (crear, editar,
 * desactivar con confirmación), probar una frase, búsquedas sin resultado y frases sugeridas por la IA (aprobar o
 * descartar con un clic). Todo lo audita el servidor.
 */
export default function KeywordsAdmin() {
  const [tab, setTab] = useState('phrases');
  const [notice, setNotice] = useState({});
  const [pending, setPending] = useState(null);
  const [catalog] = useList('/admin/specialties');
  const subcategories = (catalog.data || []).flatMap(specialty => specialty.subcategories.map(sub => ({...sub, specialty: specialty.name})));
  const show = useCallback(next => setNotice(next), []);
  return <section className="admin-keywords" aria-label="Palabras clave del buscador">
    <p className="muted">El buscador «¿Qué se malogró?» suma los pesos de estas frases. Objeto: el equipo; síntoma: lo que le pasa;
      general: frases ambiguas que valen la mitad sin un objeto.</p>
    <div className="announcement-tabs client-tabs" role="tablist" aria-label="Vistas de palabras clave">
      {TABS.map(([code, text]) => <button key={code} type="button" role="tab" aria-selected={tab === code}
        onClick={() => { setTab(code); setNotice({}); }}>{text}{code === 'suggestions' && pending ? ` (${pending})` : ''}</button>)}
    </div>
    {notice.success && <output className="notice">{notice.success}</output>}
    {notice.error && <p className="error" role="alert">{notice.error}</p>}
    {catalog.error && <p className="error" role="alert">{catalog.error}</p>}
    {tab === 'phrases' && <Phrases subcategories={subcategories} onNotice={show}/>}
    {tab === 'test' && <TestPhrase/>}
    {tab === 'misses' && <Misses/>}
    {tab === 'suggestions' && <Suggestions onNotice={show} onCount={setPending}/>}
  </section>;
}
