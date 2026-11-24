import React, {useEffect, useRef, useState} from 'react';
import {counted, shortDay} from './homeFormat';

/**
 * Fase A2: solicitudes por día de los últimos 7 o 30 días (series del servidor, días de Lima). Líneas de 2 px en una sola
 * escala, colores categóricos validados para los dos temas (adm.css), leyenda, etiqueta directa al final de cada línea,
 * detalle del día al pasar el mouse o con las flechas, resumen en texto y la tabla equivalente.
 */
export const SERIES = [
  ['created', 'Creadas', 'creada', 'creadas'],
  ['assigned', 'Asignadas', 'asignada', 'asignadas'],
  ['cancelled', 'Canceladas', 'cancelada', 'canceladas'],
  ['expired', 'Vencidas', 'vencida', 'vencidas'],
];
const RANGES = [7, 30];
const H = 220;
// Visto en las capturas a 390 px: con un viewBox fijo el texto se encogía y las etiquetas finales se encimaban. El ancho
// del dibujo es el real del contenedor (texto a tamaño real) y, por debajo de NARROW, sin etiquetas finales: quedan la
// leyenda, el detalle del día y la tabla.
const DEFAULT_WIDTH = 640;
const NARROW = 480;
const padding = width => ({top: 12, right: width < NARROW ? 12 : 92, bottom: 28, left: 32});

/** Ancho del contenedor con ResizeObserver; sin él (pruebas), el ancho por omisión. */
function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  useEffect(() => {
    if (!ref.current || typeof ResizeObserver !== 'function') return undefined;
    const observer = new ResizeObserver(([entry]) => { if (entry.contentRect.width) setWidth(Math.round(entry.contentRect.width)); });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}
const LABEL_GAP = 14;

/**
 * Etiquetas al final de cada línea sin encimarse: ordenadas por altura y separadas al menos LABEL_GAP. Visto en las
 * capturas: con varias series en 0 la última bajaba hasta las fechas; si se pasan de bottom, el grupo sube.
 */
function endLabels(ends, bottom) {
  const sorted = [...ends].sort((a, b) => a.y - b.y);
  sorted.forEach((label, index) => { if (index && label.y - sorted[index - 1].y < LABEL_GAP) label.y = sorted[index - 1].y + LABEL_GAP; });
  const overflow = (sorted.at(-1)?.y ?? 0) - bottom;
  if (overflow > 0) sorted.forEach(label => { label.y -= overflow; });
  return sorted;
}

export function summary(items) {
  const total = key => items.reduce((sum, item) => sum + item[key], 0);
  const [first, ...rest] = SERIES.map(([key, , one, many]) => counted(total(key), one, many));
  return `En los últimos ${items.length} días: ${[first, ...rest.slice(0, -1)].join(', ')} y ${rest.at(-1)}.`;
}

export default function AdmTrendChart({items: all = []}) {
  const [range, setRange] = useState(7);
  const [active, setActive] = useState(null);
  const [plotRef, W] = useWidth();
  const PAD = padding(W);
  const items = all.slice(-range);
  const max = Math.max(1, ...items.flatMap(item => SERIES.map(([key]) => item[key])));
  const top = Math.ceil(max / 2) * 2;
  const x = index => PAD.left + (items.length < 2 ? 0 : (index * (W - PAD.left - PAD.right)) / (items.length - 1));
  const y = value => PAD.top + (H - PAD.top - PAD.bottom) * (1 - value / top);
  const pick = index => setActive(Math.max(0, Math.min(items.length - 1, index)));
  function onKey(event) {
    const moves = {ArrowLeft: (active ?? items.length) - 1, ArrowRight: (active ?? -1) + 1, Home: 0, End: items.length - 1};
    if (event.key === 'Escape') { setActive(null); return; }
    if (!(event.key in moves)) return;
    event.preventDefault();
    pick(moves[event.key]);
  }
  function onMove(event) {
    const box = event.currentTarget.getBoundingClientRect();
    if (!box.width || items.length < 2) return;
    const svgX = ((event.clientX - box.left) / box.width) * W;
    pick(Math.round(((svgX - PAD.left) / (W - PAD.left - PAD.right)) * (items.length - 1)));
  }
  // Con 30 días, una etiqueta cada 5 contando desde hoy, para que no se encimen.
  // En pantallas angostas, con 7 días, una etiqueta cada 2.
  const every = range === 30 ? 5 : W < NARROW ? 2 : 1;
  const showTick = index => (items.length - 1 - index) % every === 0;
  const ends = items.length && W >= NARROW ? endLabels(SERIES.map(([key, label]) => ({key, label, value: items.at(-1)[key], y: y(items.at(-1)[key])})), H - PAD.bottom) : [];
  const day = active === null ? null : items[active];
  return <section className="adm-card adm-trend" aria-labelledby="adm-trend-title">
    <header className="adm-card-head">
      <h3 id="adm-trend-title">Solicitudes por día</h3>
      <div className="adm-segmented" role="group" aria-label="Período">
        {RANGES.map(days => <button key={days} type="button" aria-pressed={range === days}
          onClick={() => { setRange(days); setActive(null); }}>{days} días</button>)}
      </div>
    </header>
    <p className="adm-trend-summary">{summary(items)}</p>
    <ul className="adm-legend" aria-label="Leyenda">
      {SERIES.map(([key, label]) => <li key={key}><span className="adm-swatch" data-series={key} aria-hidden="true"/>{label}</li>)}
    </ul>
    <div className="adm-trend-plot" ref={plotRef}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Solicitudes por día en los últimos ${range} días. ${summary(items)}`} tabIndex={0}
        onKeyDown={onKey} onMouseMove={onMove} onMouseLeave={() => setActive(null)} onBlur={() => setActive(null)}>
        {[0, top / 2, top].map(tick => <g key={tick} className="adm-grid">
          <line x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)}/>
          <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end">{tick}</text>
        </g>)}
        {items.map((item, index) => (showTick(index)
          ? <text key={item.date} className="adm-axis" x={x(index)} y={H - 8}
            textAnchor={index === items.length - 1 ? 'end' : 'middle'}>{shortDay(item.date)}</text> : null))}
        {day && <line className="adm-crosshair" x1={x(active)} x2={x(active)} y1={PAD.top} y2={H - PAD.bottom}/>}
        {SERIES.map(([key]) => <polyline key={key} className="adm-line" data-series={key} fill="none"
          points={items.map((item, index) => `${x(index)},${y(item[key])}`).join(' ')}/>)}
        {day && SERIES.map(([key]) => <circle key={key} className="adm-dot" data-series={key} cx={x(active)} cy={y(day[key])} r="5"/>)}
        {ends.map(label => <text key={label.key} className="adm-end-label" x={W - PAD.right + 8} y={label.y} dy="0.32em">
          {label.label} {label.value}</text>)}
      </svg>
      {day && <div className="adm-tooltip" role="status" aria-label="Detalle del día"
        style={{left: `${(x(active) / W) * 100}%`}} data-side={active > items.length / 2 ? 'left' : 'right'}>
        <strong>{shortDay(day.date)}</strong>
        <dl>{SERIES.map(([key, label]) => <div key={key}><dt><span className="adm-swatch" data-series={key} aria-hidden="true"/>{label}</dt>
          <dd>{day[key]}</dd></div>)}</dl>
      </div>}
    </div>
    <details className="adm-table-toggle">
      <summary>Ver como tabla</summary>
      <div className="adm-table-scroll">
      <table className="adm-table">
        <caption className="sr-only">Solicitudes por día en los últimos {range} días</caption>
        <thead><tr><th scope="col">Día</th>{SERIES.map(([key, label]) => <th key={key} scope="col">{label}</th>)}</tr></thead>
        <tbody>{items.map(item => <tr key={item.date}><th scope="row">{shortDay(item.date)}</th>
          {SERIES.map(([key]) => <td key={key}>{item[key]}</td>)}</tr>)}</tbody>
      </table>
      </div>
    </details>
  </section>;
}
