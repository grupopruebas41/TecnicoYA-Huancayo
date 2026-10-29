import React, {useEffect, useId, useRef, useState} from 'react';
import {request} from '../administration/http';
import Icon from '../panel/icons';

const DEBOUNCE = 300;
const MIN_LENGTH = 3;

/** Ícono de línea de la especialidad de una sugerencia (por su nombre; el catálogo no guarda íconos). */
function specialtyIcon(name = '') {
  const plain = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (plain.includes('refrig')) return 'snow';
  if (plain.includes('electr')) return 'bolt';
  if (plain.includes('comput')) return 'monitor';
  return 'catalog';
}

/**
 * D-94 (RECO-01): buscador «¿Qué se malogró?» (combobox ARIA 1.2 con lista). Pide sugerencias a GET /catalog/suggestions
 * 300 ms después de la última tecla; flechas, Enter y Escape; la primera sugerencia lleva «Más probable». Al elegir,
 * onSelect recibe especialidad y subcategoría. Sin coincidencias ofrece elegir la categoría (onNoMatch). Los chips
 * rellenan el buscador y muestran sus sugerencias de inmediato.
 *
 * Las sugerencias van en un panel propio justo debajo del campo y dentro del flujo de la página: empuja los chips y las
 * tarjetas siguientes, así ninguna lo tapa ni lo corta. Se cierra con Escape, con un clic fuera o al vaciar el campo.
 */
export default function ProblemSearch({onSelect, onNoMatch, chips = [], label = '¿Qué se malogró?'}) {
  const [text, setText] = useState('');
  const [state, setState] = useState({status: 'idle', items: [], query: ''});
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const timer = useRef(null);
  const latest = useRef('');
  const input = useRef(null);
  const root = useRef(null);
  const id = useId();
  const listId = `${id}-lista`;
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return undefined;
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [open]);

  async function search(query) {
    latest.current = query;
    setState({status: 'loading', items: [], query});
    setActive(-1);
    setOpen(true);
    try {
      const result = await request('/catalog/suggestions?' + new URLSearchParams({q: query}));
      if (latest.current !== query) return; // llegó tarde: ya se escribió otra cosa
      setState({status: result.data.items.length ? 'ready' : 'empty', items: result.data.items, query});
      setActive(result.data.items.length ? 0 : -1);
      setOpen(true);
    } catch (failure) {
      if (latest.current === query) setState({status: 'error', items: [], query, message: failure.message});
    }
  }
  function change(value) {
    setText(value);
    clearTimeout(timer.current);
    const query = value.trim();
    if (query.length < MIN_LENGTH) {
      latest.current = '';
      setState({status: 'idle', items: [], query: ''});
      setOpen(false);
      return;
    }
    timer.current = setTimeout(() => search(query), DEBOUNCE);
  }
  function choose(item) {
    setOpen(false);
    setText(`${item.specialty_name} › ${item.subcategory_name}`);
    onSelect({specialty_id: item.specialty_id, subcategory_id: item.subcategory_id, item});
  }
  function fill(chip) {
    setText(chip);
    clearTimeout(timer.current);
    input.current?.focus();
    search(chip);
  }
  function keys(event) {
    const count = state.items.length;
    if (event.key === 'ArrowDown' && count) {
      event.preventDefault();
      setOpen(true);
      setActive(current => (current + 1) % count);
    } else if (event.key === 'ArrowUp' && count) {
      event.preventDefault();
      setOpen(true);
      setActive(current => (current <= 0 ? count - 1 : current - 1));
    } else if (event.key === 'Enter' && open && state.items[active]) {
      event.preventDefault();
      choose(state.items[active]);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
    }
  }
  const expanded = open && state.status === 'ready';
  return <div className="problem-search" ref={root}>
    <label className="problem-search-label" htmlFor={`${id}-input`}>{label}</label>
    <div className="problem-search-box">
      <span className="problem-search-icon" aria-hidden="true"><Icon name="search"/></span>
      <input id={`${id}-input`} ref={input} type="text" role="combobox" autoComplete="off" maxLength={120}
        placeholder="Ej.: mi congeladora no enfría" value={text} aria-autocomplete="list" aria-expanded={expanded}
        aria-controls={expanded ? listId : undefined} aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
        aria-describedby={`${id}-ayuda`} onChange={event => change(event.target.value)} onKeyDown={keys}/>
    </div>
    <p id={`${id}-ayuda`} className="sr-only">Escribe al menos 3 letras; usa las flechas para elegir una sugerencia.</p>
    {open && state.status !== 'idle' && <div className="problem-search-panel" role="group" aria-labelledby={`${id}-titulo`}>
      <p id={`${id}-titulo`} className="problem-search-panel-head">Sugerencias para «{state.query}»</p>
      {state.status === 'loading' && <div className="problem-search-loading" aria-hidden="true">
        {[0, 1, 2].map(row => <span key={row} className="problem-search-skeleton"/>)}
      </div>}
      {state.status === 'ready' && <ul id={listId} role="listbox" aria-label="Sugerencias" className="problem-search-list">
        {state.items.map((item, index) => <li key={item.subcategory_id} id={`${listId}-${index}`} role="option"
          aria-selected={index === active} className={index === active ? 'is-active' : undefined}
          onMouseDown={event => event.preventDefault()} onClick={() => choose(item)}>
          <span className="problem-search-specialty" aria-hidden="true"><Icon name={specialtyIcon(item.specialty_name)}/></span>
          <span className="problem-search-text"><strong>{item.subcategory_name}</strong><small>{item.specialty_name}</small></span>
          {index === 0 && <span className="client-chip is-likely">Más probable</span>}
          <span className="problem-search-go" aria-hidden="true"><Icon name="chevron"/></span>
        </li>)}
      </ul>}
      {state.status === 'empty' && <div className="problem-search-empty" role="alert">
        <span>No reconocimos el problema. Elige la categoría</span>
        {onNoMatch && <button type="button" className="button outline" onClick={onNoMatch}>Elegir la categoría</button>}
      </div>}
      {state.status === 'error' && <p className="error" role="alert">{state.message || 'No pudimos buscar ahora.'}</p>}
      {state.status === 'ready' && onNoMatch && <div className="problem-search-foot">
        <button type="button" className="text-button" onClick={onNoMatch}>¿No es ninguno? Elegir categoría</button>
      </div>}
    </div>}
    <p className="sr-only" role="status" aria-live="polite">
      {state.status === 'loading' ? 'Buscando…' : state.status === 'ready' ? `${state.items.length === 1 ? '1 sugerencia' : `${state.items.length} sugerencias`}.` : ''}
    </p>
    {chips.length > 0 && <div className="problem-chips" role="group" aria-label="Problemas frecuentes">
      {chips.map(chip => <button key={chip} type="button" className="client-filter-chip" onClick={() => fill(chip)}>{chip}</button>)}
    </div>}
  </div>;
}
