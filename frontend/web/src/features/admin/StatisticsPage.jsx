import React, {useCallback, useEffect, useState} from 'react';
import {request} from '../administration/http';
import {ROLE_LABELS, TECHNICIAN_STATUS_LABELS, formatDuration, formatPercent} from './adminRules';
import './admin.css';

const RANGES = [7, 30, 90];
const dayFormat = new Intl.DateTimeFormat('es-PE', {day: 'numeric', month: 'short', timeZone: 'UTC'});
const day = date => dayFormat.format(new Date(`${date}T00:00:00Z`));
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

/** Columnas SVG de un solo color (una serie, sin leyenda) con tooltip al pasar o enfocar y tabla equivalente. */
function DailyChart({points}) {
  const [active, setActive] = useState(null);
  const total = points.reduce((sum, point) => sum + point.total, 0);
  const max = Math.max(...points.map(point => point.total), 0);
  if (!total) return <p className="admin-empty">Sin solicitudes en este período.</p>;
  const width = 640;
  const height = 180;
  const gap = 2;
  const barWidth = Math.max(2, (width - gap * (points.length - 1)) / points.length);
  const peak = points.find(point => point.total === max);
  const shown = active === null ? null : points[active];
  return <figure className="admin-chart">
    <div className="admin-chart-plot">
      <span className="admin-chart-max" aria-hidden="true">{max}</span>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img"
        aria-label={`Solicitudes por día: ${plural(total, 'solicitud', 'solicitudes')} en ${points.length} días; el máximo fue ${max} el ${day(peak.date)}.`}
        onMouseLeave={() => setActive(null)}>
        <line x1="0" y1={height - 0.5} x2={width} y2={height - 0.5} className="admin-chart-axis"/>
        {points.map((point, index) => {
          const barHeight = max ? (point.total / max) * (height - 8) : 0;
          const x = index * (barWidth + gap);
          return <g key={point.date} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onBlur={() => setActive(null)}
            tabIndex={0} aria-label={`${day(point.date)}: ${plural(point.total, 'solicitud', 'solicitudes')}`} className="admin-chart-hit">
            <rect x={x} y="0" width={barWidth} height={height} className="admin-chart-target"/>
            {point.total > 0 && <rect x={x} y={height - barHeight} width={barWidth} height={barHeight} rx={Math.min(2, barWidth / 2)} className={'admin-chart-bar' + (active === index ? ' is-active' : '')}/>}
          </g>;
        })}
      </svg>
      {shown && <output className="admin-chart-tip" style={{left: `${((active + 0.5) / points.length) * 100}%`}}>{day(shown.date)}: {plural(shown.total, 'solicitud', 'solicitudes')}</output>}
    </div>
    <figcaption className="admin-chart-axis-labels"><span>{day(points[0].date)}</span><span>{day(points.at(-1).date)}</span></figcaption>
    <details className="admin-chart-table">
      <summary>Ver los datos en una tabla</summary>
      <table className="admin-table">
        <caption className="panel-sr">Solicitudes por día</caption>
        <thead><tr><th scope="col">Día</th><th scope="col">Solicitudes</th></tr></thead>
        <tbody>{points.map(point => <tr key={point.date}><td>{day(point.date)}</td><td>{point.total}</td></tr>)}</tbody>
      </table>
    </details>
  </figure>;
}

/** Tabla con una barra por fila: el valor siempre se lee como texto y la barra es decorativa. */
function BarTable({caption, rows, empty, valueLabel = 'Solicitudes', format = value => value}) {
  if (!rows.length || rows.every(row => !row.total)) return <p className="admin-empty">{empty}</p>;
  const max = Math.max(...rows.map(row => row.total));
  return <table className="admin-bars">
    <caption className="panel-sr">{caption}</caption>
    <thead className="panel-sr"><tr><th scope="col">Categoría</th><th scope="col">{valueLabel}</th></tr></thead>
    <tbody>{rows.map(row => <tr key={row.name}>
      <th scope="row">{row.name}</th>
      <td><span className="admin-bar-track" aria-hidden="true"><span className="admin-bar" style={{width: `${max ? (row.total / max) * 100 : 0}%`}}/></span>
        <span className="admin-bar-value">{format(row.total, row)}</span></td>
    </tr>)}</tbody>
  </table>;
}

function Card({id, title, children, wide = false}) {
  return <section className={'panel-card' + (wide ? ' admin-wide' : '')} aria-labelledby={id}><h3 id={id}>{title}</h3>{children}</section>;
}

/** Estadísticas (bloque C, D-85): solo datos reales de GET /admin/statistics, con estados vacíos honestos. */
export default function StatisticsPage() {
  const [days, setDays] = useState(30);
  const [state, setState] = useState({loading: true, data: null, error: ''});
  const load = useCallback(() => {
    setState(current => ({...current, loading: true, error: ''}));
    request(`/admin/statistics?days=${days}`).then(result => setState({loading: false, data: result.data, error: ''}))
      .catch(failure => setState({loading: false, data: null, error: failure.message || 'No pudimos cargar las estadísticas.'}));
  }, [days]);
  useEffect(() => { load(); }, [load]);
  const data = state.data;
  const funnel = data?.funnel;
  const funnelRows = funnel ? [['Enviadas', funnel.sent], ['Con ofertas', funnel.with_offers], ['Asignadas', funnel.assigned], ['Terminadas', funnel.completed]]
    .map(([name, total]) => ({name, total})) : [];
  return <section className="s02-panel admin-page" aria-busy={state.loading}>
    <header className="admin-page-head">
      <h2>Estadísticas</h2>
      <div className="admin-range" role="group" aria-label="Período">
        {RANGES.map(range => <button key={range} type="button" aria-pressed={days === range} onClick={() => setDays(range)}>{range} días</button>)}
      </div>
    </header>
    {state.loading && !data && <p className="muted">Cargando estadísticas…</p>}
    {state.error && <div className="error" role="alert">{state.error} <button type="button" className="text-button" onClick={load}>Reintentar</button></div>}
    {data && <>
      <p className="muted">Del {day(data.range.from)} al {day(data.range.to)} · datos reales, sin estimaciones.</p>
      <div className="panel-cards admin-stats">
        <Card id="stat-daily" title="Solicitudes por día" wide><DailyChart points={data.requests_per_day}/></Card>
        <Card id="stat-specialty" title="Por especialidad">
          <BarTable caption="Solicitudes por especialidad" rows={data.requests_by_specialty} empty="Sin solicitudes en este período."/>
        </Card>
        <Card id="stat-district" title="Por distrito">
          <BarTable caption="Solicitudes por distrito" rows={data.requests_by_district} empty="Sin solicitudes en este período."/>
        </Card>
        <Card id="stat-funnel" title="Embudo de solicitudes">
          <BarTable caption="Embudo: enviadas, con ofertas, asignadas y terminadas" rows={funnelRows} empty="Sin solicitudes enviadas en este período."
            format={total => (funnel.sent ? `${total} · ${Math.round((total / funnel.sent) * 100)} %` : total)}/>
        </Card>
        <Card id="stat-offers" title="Ofertas">
          {!data.offers.total ? <p className="admin-empty">Sin ofertas en este período.</p> : <dl className="admin-tiles">
            <div><dt>Tasa de aceptación</dt><dd>{data.offers.acceptance_rate === null ? 'Sin respuestas aún' : formatPercent(data.offers.acceptance_rate)}</dd></div>
            <div><dt>Tiempo medio de respuesta</dt><dd>{data.offers.avg_response_seconds === null ? 'Sin respuestas aún' : formatDuration(data.offers.avg_response_seconds)}</dd></div>
            <div><dt>Ofertas enviadas</dt><dd>{data.offers.total}</dd></div>
          </dl>}
          {data.offers.total > 0 && <p className="muted">{data.offers.accepted} aceptadas · {data.offers.rejected} rechazadas · {data.offers.expired} vencidas.</p>}
        </Card>
        <Card id="stat-technicians" title="Técnicos por estado">
          <BarTable caption="Técnicos por estado" valueLabel="Técnicos" empty="Aún no hay técnicos registrados."
            rows={Object.entries(data.technicians_by_status).map(([status, total]) => ({name: TECHNICIAN_STATUS_LABELS[status] || status, total}))}/>
        </Card>
        <Card id="stat-users" title="Usuarios nuevos">
          <BarTable caption="Usuarios nuevos por rol" valueLabel="Usuarios" empty="Sin usuarios nuevos en este período."
            rows={['client', 'technician', 'admin'].map(role => ({name: ROLE_LABELS[role], total: data.new_users_by_role[role]}))}/>
        </Card>
        <Card id="stat-announcements" title="Comunicados vigentes">
          <BarTable caption="Comunicados vigentes por audiencia" valueLabel="Comunicados" empty="No hay comunicados vigentes ahora."
            rows={[{name: 'Clientes', total: data.active_announcements_by_audience.client}, {name: 'Técnicos', total: data.active_announcements_by_audience.technician}]}/>
        </Card>
      </div>
    </>}
  </section>;
}
