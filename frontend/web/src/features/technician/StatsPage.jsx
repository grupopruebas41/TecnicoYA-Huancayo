import React, {useEffect, useId, useState} from 'react';
import {request} from '../administration/http';
import Icon from '../panel/icons';
import './business.css';

const PERIODS = [['week', 'Por semana', '8 semanas'], ['month', 'Por mes', '6 meses']];
const OUTCOMES = [['accepted', 'Aceptadas'], ['rejected', 'Rechazadas'], ['expired', 'Vencidas']];

/** «1 min 05 s» o «45 s»; «—» sin datos. */
export function duration(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, '0')} s`;
}
const percent = value => (value === null || value === undefined ? '—' : `${value} %`);
const unit = period => (period === 'week' ? 'semana' : 'mes');
const ofBucket = (bucket, period) => (period === 'week' ? `la semana del ${bucket.label}` : bucket.label);

/** Resumen en texto de las estadísticas, para leer sin ver los gráficos. */
export function statsSummary(data) {
  const {totals, buckets, period} = data;
  const offers = totals.accepted + totals.rejected + totals.expired;
  const span = period === 'week' ? 'las últimas 8 semanas' : 'los últimos 6 meses';
  if (!offers && !totals.completed) return `En ${span} todavía no tienes ofertas respondidas ni trabajos completados.`;
  const busiest = buckets.reduce((best, bucket) => {
    const total = bucket.accepted + bucket.rejected + bucket.expired;
    return total > best.total ? {bucket, total} : best;
  }, {bucket: null, total: 0});
  const parts = [`En ${span} aceptaste ${totals.accepted} de ${offers} ${offers === 1 ? 'oferta' : 'ofertas'} (${percent(totals.acceptance_rate)})`
    + `, dejaste vencer ${totals.expired} y completaste ${totals.completed} ${totals.completed === 1 ? 'trabajo' : 'trabajos'}.`];
  if (totals.avg_response_seconds !== null) parts.push(`Respondiste en ${duration(totals.avg_response_seconds)} en promedio.`);
  if (busiest.bucket) parts.push(`El ${unit(period)} con más ofertas fue ${ofBucket(busiest.bucket, period)} (${busiest.total}).`);
  return parts.join(' ');
}

const niceMax = value => { if (value <= 4) return 4; const step = 10 ** Math.floor(Math.log10(value)); return Math.ceil(value / step) * step; };

/**
 * Gráfico de barras en SVG (simples o apiladas), con un solo eje, cuadrícula suave, tooltip al pasar o al enfocar cada
 * barra, leyenda cuando hay más de una serie y el resumen en texto como pie. El SVG es un grupo con su título y su
 * descripción; cada barra es una imagen enfocable con su valor en texto (el tooltip solo la repite a la vista).
 */
export function BarChart({title, summary, buckets, series, format = value => String(value), max: fixedMax, line = false}) {
  const id = useId();
  const [hover, setHover] = useState(null);
  const width = 560, height = 220, left = 40, bottom = 28, top = 12;
  const plotWidth = width - left - 8, plotHeight = height - top - bottom;
  const totals = buckets.map(bucket => series.reduce((sum, [key]) => sum + (bucket[key] ?? 0), 0));
  const max = fixedMax ?? niceMax(Math.max(1, ...totals));
  const band = plotWidth / buckets.length;
  const bar = Math.min(34, band * 0.56);
  const y = value => top + plotHeight - (value / max) * plotHeight;
  const ticks = [0, max / 2, max];
  const points = buckets.map((bucket, index) => [left + band * index + band / 2, bucket[series[0][0]]]);
  return <figure className="tech-chart" aria-labelledby={`${id}-title`}>
    <figcaption className="tech-chart-head">
      <h4 id={`${id}-title`}>{title}</h4>
      {series.length > 1 && <ul className="tech-legend tech-chart-legend" aria-label="Leyenda">
        {series.map(([key, label], index) => <li key={key}><span className="tech-swatch" data-series={index + 1} aria-hidden="true"/>{label}</li>)}
      </ul>}
    </figcaption>
    <div className="tech-chart-plot">
      <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-labelledby={`${id}-title ${id}-desc`} onMouseLeave={() => setHover(null)}>
        <desc id={`${id}-desc`}>{summary}</desc>
        {ticks.map(tick => <g key={tick} className="tech-chart-grid">
          <line x1={left} x2={width - 8} y1={y(tick)} y2={y(tick)}/>
          <text x={left - 6} y={y(tick) + 4} textAnchor="end">{format(Math.round(tick))}</text>
        </g>)}
        {line && <polyline className="tech-chart-line" data-series="1"
          points={points.filter(([, value]) => value !== null && value !== undefined).map(([x, value]) => `${x},${y(value)}`).join(' ')}/>}
        {buckets.map((bucket, index) => {
          const x = left + band * index + (band - bar) / 2;
          let base = 0;
          const label = `${bucket.label}: ` + series.map(([key, name]) => `${name} ${bucket[key] === null || bucket[key] === undefined ? 'sin datos' : format(bucket[key])}`).join(', ');
          return <g key={bucket.key} className="tech-chart-bucket" data-active={hover === index} tabIndex={0} role="img" aria-label={label}
            onMouseEnter={() => setHover(index)} onFocus={() => setHover(index)} onBlur={() => setHover(null)}>
            <rect className="tech-chart-hit" x={left + band * index} y={top} width={band} height={plotHeight}/>
            {line ? (bucket[series[0][0]] !== null && bucket[series[0][0]] !== undefined
              && <circle className="tech-chart-dot" data-series="1" cx={points[index][0]} cy={y(bucket[series[0][0]])} r="5"/>)
              : series.map(([key], position) => {
                const value = bucket[key] ?? 0;
                if (!value) return null;
                const segment = (value / max) * plotHeight;
                const rect = <rect key={key} className="tech-chart-bar" data-series={position + 1} x={x} width={bar}
                  y={y(base + value)} height={Math.max(segment - (base ? 2 : 0), 1)} rx={3}/>;
                base += value;
                return rect;
              })}
            <text className="tech-chart-x" x={left + band * index + band / 2} y={height - 8} textAnchor="middle">{bucket.label}</text>
          </g>;
        })}
      </svg>
      {hover !== null && <div className="tech-chart-tip" aria-hidden="true" style={{left: `${((left + band * hover + band / 2) / width) * 100}%`}}>
        <strong>{buckets[hover].label}</strong>
        {series.map(([key, name], index) => <span key={key}>{series.length > 1 && <i className="tech-swatch" data-series={index + 1} aria-hidden="true"/>}
          {name}: {buckets[hover][key] === null || buckets[hover][key] === undefined ? 'sin datos' : format(buckets[hover][key])}</span>)}
      </div>}
    </div>
    <p className="tech-chart-summary">{summary}</p>
  </figure>;
}

/**
 * Estadísticas (Fase T4, D-104 b): tasa de aceptación, tiempo medio de respuesta, completados y vencidas por semana
 * (8) o por mes (6), con gráficos SVG, su resumen en texto y la tabla de datos. Solo datos del propio técnico.
 */
export default function StatsPage() {
  const [period, setPeriod] = useState('week');
  const [state, setState] = useState({data: null, error: null, loading: true});
  useEffect(() => {
    let active = true;
    setState(current => ({...current, loading: true}));
    request(`/technicians/me/stats?period=${period}`)
      .then(result => { if (active) setState({data: result?.data || null, error: null, loading: false}); })
      .catch(error => { if (active) setState(current => ({...current, error, loading: false})); });
    return () => { active = false; };
  }, [period]);
  const data = state.data?.period === period ? state.data : null;
  const name = unit(period);
  const kpis = data ? [
    ['Tasa de aceptación', percent(data.totals.acceptance_rate), 'check', 'Aceptadas entre todas las ofertas que respondiste o vencieron.'],
    ['Tiempo medio de respuesta', duration(data.totals.avg_response_seconds), 'clock', 'Desde que llega la oferta hasta que respondes.'],
    ['Trabajos completados', String(data.totals.completed), 'briefcase', 'Trabajos terminados en el período.'],
    ['Ofertas vencidas', String(data.totals.expired), 'alert', 'Ofertas que vencieron sin respuesta.'],
  ] : [];
  const rates = data?.buckets.filter(bucket => bucket.acceptance_rate !== null) || [];
  const best = rates.reduce((top, bucket) => (!top || bucket.acceptance_rate > top.acceptance_rate ? bucket : top), null);
  const responses = data?.buckets.filter(bucket => bucket.avg_response_seconds !== null) || [];
  const fastest = responses.reduce((top, bucket) => (!top || bucket.avg_response_seconds < top.avg_response_seconds ? bucket : top), null);
  const most = data?.buckets.reduce((top, bucket) => (!top || bucket.completed > top.completed ? bucket : top), null);

  return <section className="panel-page tech-page" aria-labelledby="tech-stats-title">
    <header className="client-page-head tech-head-row">
      <div><h2 id="tech-stats-title">Estadísticas</h2>
        <p className="muted">Cómo respondes a las ofertas y cuántos trabajos completas. Solo ves tus propios datos.</p></div>
      <div className="tech-tabs" role="tablist" aria-label="Período">
        {PERIODS.map(([value, label, hint]) => <button key={value} type="button" role="tab" aria-selected={period === value}
          title={hint} onClick={() => setPeriod(value)}>{label}</button>)}
      </div>
    </header>
    {state.error && <p className="error" role="alert">{state.error.message || 'No pudimos cargar tus estadísticas.'}</p>}
    {!data && !state.error && <div className="panel-card tech-skeleton" role="status">Cargando tus estadísticas…</div>}
    {data && <>
      <ul className="tech-kpis" aria-label="Resumen del período">
        {kpis.map(([label, value, icon, hint], index) => <li key={label} className="tech-kpi" style={{'--i': index}} title={hint}>
          <span className="tech-kpi-icon" aria-hidden="true"><Icon name={icon}/></span>
          <span className="tech-kpi-label">{label}</span>
          <strong className={'tech-kpi-value' + (value.length > 6 ? ' is-text' : '')}>{value}</strong>
        </li>)}
      </ul>
      <p className="panel-card tech-stats-summary" aria-live="polite"><Icon name="chart"/> {statsSummary(data)}</p>
      <div className="tech-charts">
        <section className="panel-card tech-section" aria-label="Ofertas">
          <BarChart title={`Ofertas por ${name}`} buckets={data.buckets} series={OUTCOMES}
            summary={`Cada barra suma las ofertas aceptadas, rechazadas y vencidas de cada ${name}. En total: ${data.totals.accepted} aceptadas, ${data.totals.rejected} rechazadas y ${data.totals.expired} vencidas.`}/>
        </section>
        <section className="panel-card tech-section" aria-label="Tasa de aceptación">
          <BarChart title={`Tasa de aceptación por ${name}`} buckets={data.buckets} series={[['acceptance_rate', 'Tasa de aceptación']]} line max={100}
            format={value => `${value} %`}
            summary={best ? `La tasa del período es ${percent(data.totals.acceptance_rate)}; la más alta fue ${best.acceptance_rate} % en ${ofBucket(best, period)}.`
              : 'Todavía no hay ofertas respondidas para calcular la tasa.'}/>
        </section>
        <section className="panel-card tech-section" aria-label="Tiempo medio de respuesta">
          <BarChart title={`Tiempo medio de respuesta por ${name} (segundos)`} buckets={data.buckets}
            series={[['avg_response_seconds', 'Tiempo medio']]} format={value => `${value} s`}
            summary={fastest ? `En promedio respondiste en ${duration(data.totals.avg_response_seconds)}; tu ${name} más rápido fue ${ofBucket(fastest, period)} (${duration(fastest.avg_response_seconds)}).`
              : 'Todavía no respondiste ofertas en este período.'}/>
        </section>
        <section className="panel-card tech-section" aria-label="Trabajos completados">
          <BarChart title={`Trabajos completados por ${name}`} buckets={data.buckets} series={[['completed', 'Completados']]}
            summary={most?.completed ? `Completaste ${data.totals.completed} trabajos; el ${name} con más fue ${ofBucket(most, period)} (${most.completed}).`
              : 'Todavía no completaste trabajos en este período.'}/>
        </section>
      </div>
      <details className="panel-card tech-stats-table">
        <summary>Ver los datos en una tabla</summary>
        <div className="tech-table-scroll">
          <table>
            <caption>Datos por {name}</caption>
            <thead><tr><th scope="col">{period === 'week' ? 'Semana del' : 'Mes'}</th><th scope="col">Aceptadas</th><th scope="col">Rechazadas</th>
              <th scope="col">Vencidas</th><th scope="col">Tasa</th><th scope="col">Tiempo medio</th><th scope="col">Completados</th></tr></thead>
            <tbody>{data.buckets.map(bucket => <tr key={bucket.key}><th scope="row">{bucket.label}</th><td>{bucket.accepted}</td><td>{bucket.rejected}</td>
              <td>{bucket.expired}</td><td>{percent(bucket.acceptance_rate)}</td><td>{duration(bucket.avg_response_seconds)}</td><td>{bucket.completed}</td></tr>)}
            </tbody>
          </table>
        </div>
      </details>
    </>}
  </section>;
}
