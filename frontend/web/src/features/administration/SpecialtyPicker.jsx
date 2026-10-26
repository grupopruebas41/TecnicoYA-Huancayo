import React, {useEffect, useRef, useState} from 'react';

/** Rubros de una especialidad marcada: buscador, seleccionar o quitar todas, contador y error en vivo. */
function RubrosPanel({specialty, rubros, selected, onChange, onRetry, error, focusFirst, onFocused}) {
  const [query, setQuery] = useState('');
  const list = useRef(null);
  const items = rubros?.items || [];
  const shown = items.filter(item => item.name.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es')));
  // Al desplegar, el foco va al primer rubro para seguir con el teclado.
  useEffect(() => {
    if (focusFirst && rubros?.status === 'ready') {
      list.current?.querySelector('input')?.focus();
      onFocused();
    }
  }, [focusFirst, rubros?.status, onFocused]);
  const errorId = `rubros-${specialty.id}-error`;
  const toggle = id => onChange(selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id]);
  return <fieldset className="rubros-panel" aria-describedby={error ? errorId : undefined}>
    <legend>Rubros de {specialty.name} en los que trabajas</legend>
    {rubros?.status === 'loading' && <p role="status" className="muted">Cargando rubros…</p>}
    {rubros?.status === 'error' && <p className="error" role="alert">No pudimos cargar los rubros de {specialty.name}. <button type="button" className="text-button" onClick={onRetry}>Reintentar</button></p>}
    {rubros?.status === 'ready' && <>
      <div className="rubros-tools">
        <input type="search" className="rubros-search" aria-label={`Buscar rubro de ${specialty.name}`} placeholder="Buscar rubro" value={query} onChange={event => setQuery(event.target.value)}/>
        <button type="button" className="text-button" onClick={() => onChange(items.map(item => String(item.id)))}>Seleccionar todas</button>
        <button type="button" className="text-button" onClick={() => onChange([])}>Quitar todas</button>
      </div>
      <p className="rubros-count" aria-live="polite">{selected.length} de {items.length} seleccionadas</p>
      <div className="rubros-chips" ref={list}>
        {shown.map(item => <label key={item.id} className="register-chip">
          <input type="checkbox" data-cy={`register-subcategory-${item.id}`} checked={selected.includes(String(item.id))} onChange={() => toggle(String(item.id))}/>
          <span>{item.name}</span>
        </label>)}
        {!shown.length && <p className="muted">Ningún rubro coincide con «{query.trim()}».</p>}
      </div>
    </>}
    {error && <span className="field-error" id={errorId}>{error}</span>}
  </fieldset>;
}

/**
 * D-80: especialidades del técnico en dos niveles. Al marcar una especialidad se despliegan sus rubros reales
 * (GET /catalog/subcategories?specialty_id=); hace falta al menos un rubro por especialidad marcada.
 */
export default function SpecialtyPicker({specialties, selected, subcategories, rubros, errors, summary, onToggle, onRubros, onRetry}) {
  const [focusRequest, setFocusRequest] = useState(null);
  const clearFocus = useRef(() => setFocusRequest(null)).current;
  const message = errors.specialty_ids?.[0];
  return <fieldset className="register-choices specialty-picker" aria-describedby={message ? 'specialty_ids-error' : undefined}>
    <legend>Especialidades que ofreces</legend>
    <div className="specialty-list">
      {specialties.map(specialty => {
        const id = String(specialty.id);
        const open = selected.includes(id);
        return <div key={id} className={'specialty-item' + (open ? ' is-open' : '')}>
          <label className="register-chip specialty-toggle">
            <input type="checkbox" data-cy={`register-specialty-${specialty.code}`} checked={open} aria-expanded={open} aria-controls={`rubros-${id}`}
              onChange={() => { if (onToggle(id) && !open) setFocusRequest(id); }}/>
            <span>{specialty.name}</span>
          </label>
          <div id={`rubros-${id}`} className="specialty-panel" hidden={!open}>
            {open && <RubrosPanel specialty={specialty} rubros={rubros[id]} selected={subcategories[id] || []}
              onChange={ids => onRubros(id, ids)} onRetry={() => onRetry(id)} error={errors[`subcategories.${id}`]?.[0]}
              focusFirst={focusRequest === id} onFocused={clearFocus}/>}
          </div>
        </div>;
      })}
    </div>
    {message && <span className="field-error" id="specialty_ids-error">{message}</span>}
    {summary && <p className="register-summary" aria-live="polite">{summary}</p>}
  </fieldset>;
}
