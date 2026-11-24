import React, {useCallback, useEffect, useState} from 'react';
import {request} from '../administration/http';
import AdmActivity from '../admin/AdmActivity';
import AdmTrendChart from '../admin/AdmTrendChart';
import {clock, greeting, longDate, minutesLabel} from '../admin/homeFormat';
import {ClientPage, EmptyState} from '../client/ui';
import Icon from './icons';

/**
 * Inicio del administrador, Fase A2 (PLAN-PANEL-ADMIN.md): panel de control con saludo y fecha de Lima, 6 indicadores
 * animados (respetan «Reducir animaciones»), gráfico de 7 y 30 días, «Tareas pendientes» con los umbrales de D-118,
 * actividad reciente y accesos rápidos según permisos. Todo sale de GET /admin/dashboard: sin cifras inventadas.
 */
const KPIS = [
  ['requests_today', 'Solicitudes de hoy', 'requests', 'blue', 'Enviadas desde las 00:00'],
  ['searching_now', 'Buscando técnico ahora', 'search', 'orange', 'Enviadas o en el pendiente de 24 h'],
  ['technicians_verified', 'Técnicos activos y verificados', 'verify', 'green', 'Pueden recibir ofertas'],
  ['avg_assignment_minutes', 'Tiempo medio de asignación', 'clock', 'violet', 'Del envío a la asignación, 30 días'],
  ['premium_clients', 'Clientes Premium', 'star', 'amber', 'Con el plan activo'],
  ['iot_open_alerts', 'Alertas IoT abiertas', 'sensor', 'rose', 'Sensores fuera de rango (demostración)'],
];

const TASKS = {
  documents_to_review: ['verify', () => 'Documentos por revisar'],
  unassigned_requests: ['clock', limit => `Solicitudes sin técnico hace más de ${limit} min`],
  pending_expiring: ['alert', limit => `Pendientes de 24 h que vencen en ${minutesLabel(limit)} o menos`],
  keyword_misses: ['search', limit => `Búsquedas sin resultado de los últimos ${limit} días`],
  iot_unattended: ['sensor', limit => `Fallas de sensores sin atender hace más de ${limit} min`],
  low_performance: ['star', limit => `Técnicos con desempeño bajo en ${limit} días`],
};

// Accesos rápidos según permisos; cada uno abre su sección (y el formulario de alta si corresponde).
const QUICK_LINKS = [
  ['announcements.manage', 'announcements', 'create', 'Crear comunicado', 'plus'],
  ['users.manage', 'users', 'create', 'Crear usuario', 'users'],
  ['technicians.verify', 'verification', null, 'Revisar verificación', 'verify'],
];


const reducedMotion = () => document.documentElement.dataset.motion === 'reduce'
  || (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/** Cuenta de 0 al valor en 0,7 s; con «Reducir animaciones», el valor final de inmediato. */
function useCountUp(target) {
  const [value, setValue] = useState(() => (reducedMotion() ? target : 0));
  useEffect(() => {
    if (reducedMotion() || !target) { setValue(target); return undefined; }
    const start = performance.now();
    let frame;
    const tick = now => {
      const progress = Math.min(1, (now - start) / 700);
      setValue(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return value;
}

function Kpi({label, icon, tone, hint, value, format}) {
  const shown = useCountUp(value ?? 0);
  const text = value === null || value === undefined ? '—' : format(shown);
  const final = value === null || value === undefined ? '—' : format(value);
  return <li className="adm-kpi" data-tone={tone} aria-label={`${label}: ${final}`}>
    <span className="adm-kpi-icon" aria-hidden="true"><Icon name={icon}/></span>
    <span className="adm-kpi-text">
      <span className="adm-kpi-value" aria-hidden="true">{text}</span>
      <span className="adm-kpi-label">{label}</span>
      <small className="muted">{hint}</small>
    </span>
  </li>;
}

function Kpis({kpis = {}}) {
  return <section className="adm-kpis-wrap" aria-labelledby="adm-kpis-title">
    <h3 id="adm-kpis-title" className="sr-only">Indicadores</h3>
    <ul className="adm-kpis">
      {KPIS.map(([key, label, icon, tone, hint]) => {
        const minutes = key === 'avg_assignment_minutes';
        return <Kpi key={key} label={label} icon={icon} tone={tone} value={kpis[key]}
          hint={minutes && kpis[key] === null ? 'Sin asignaciones en 30 días' : hint}
          format={minutes ? minutesLabel : String}/>;
      })}
    </ul>
  </section>;
}

function Tasks({tasks = [], navigate}) {
  const pending = tasks.filter(task => task.count > 0 && TASKS[task.key]);
  const total = pending.reduce((sum, task) => sum + task.count, 0);
  return <section className="adm-card adm-tasks" aria-labelledby="adm-tasks-title">
    <header className="adm-card-head">
      <h3 id="adm-tasks-title">Tareas pendientes {total > 0 && <span className="adm-count">{total}</span>}</h3>
    </header>
    {pending.length === 0
      ? <EmptyState icon="check" tone="green" title="Todo al día" text="No hay tareas que esperen una acción tuya por ahora."/>
      : <ul className="adm-task-list">{pending.map(task => {
        const [icon, label] = TASKS[task.key];
        const text = label(task.limit);
        return <li key={task.key} className="adm-task">
          <span className="adm-task-icon" aria-hidden="true"><Icon name={icon}/></span>
          <span className="adm-task-label">{text}</span>
          <strong className="adm-task-count">{task.count}</strong>
          {navigate && <button type="button" className="button outline adm-task-go" aria-label={`Revisar: ${text}`}
            onClick={() => navigate(task.section)}>Revisar</button>}
        </li>;
      })}</ul>}
  </section>;
}

export default function AdminHome({navigate, permissions = [], user = null}) {
  const [state, setState] = useState({loading: true, data: null, error: ''});
  const [attempt, setAttempt] = useState(0);
  const load = useCallback(() => {
    setAttempt(value => value + 1);
    setState(current => ({...current, loading: true, error: ''}));
    Promise.resolve().then(() => request('/admin/dashboard'))
      .then(result => setState({loading: false, data: result.data, error: ''}))
      .catch(failure => setState({loading: false, data: null, error: failure.message || 'No pudimos cargar el Inicio.'}));
  }, []);
  useEffect(load, [load]);
  const {data} = state;
  const name = user?.given_names || user?.name?.split(' ')[0];
  const quick = navigate ? QUICK_LINKS.filter(([permission]) => permissions.includes(permission)) : [];
  const now = new Date();
  return <ClientPage id="adm-home" icon="home" tone="teal" className="adm-page adm-home"
    title={`${greeting(now)}${name ? `, ${name}` : ''}`}
    intro={<>{longDate(now)}{data && <> · Actualizado a las {clock(data.generated_at)}</>}</>}
    actions={quick.length > 0 && <nav className="adm-quick" aria-label="Accesos rápidos">
      {quick.map(([, section, intent, label, icon]) => <button key={section} type="button" className="button outline"
        onClick={() => navigate(section, intent)}><Icon name={icon}/>{label}</button>)}
    </nav>}>
    {state.loading && !data && <p className="muted" aria-live="polite">Cargando el Inicio…</p>}
    {state.error && <div className="error" role="alert">{state.error} <button type="button" className="text-button" onClick={load}>Reintentar</button></div>}
    {data && <>
      <Part name="kpis" title="Indicadores" data={data} attempt={attempt} onRetry={load}>
        <Kpis kpis={data.kpis}/>
      </Part>
      <Part name="series" title="Solicitudes por día" data={data} attempt={attempt} onRetry={load}>
        <AdmTrendChart items={data.series?.items}/>
      </Part>
      {/* Revisión del #69: Tareas y Actividad lado a lado en escritorio (1200 px o más); en el celular, una debajo de otra. */}
      <div className="adm-home-pair">
        <Part name="tasks" title="Tareas pendientes" data={data} attempt={attempt} onRetry={load}>
          <Tasks tasks={data.tasks} navigate={navigate}/>
        </Part>
        <Part name="recent_events" title="Actividad reciente" data={data} attempt={attempt} onRetry={load}>
          <AdmActivity events={data.recent_events} navigate={navigate} canSeeAll={permissions.includes('audit.view')}/>
        </Part>
      </div>
    </>}
  </ClientPage>;
}

/** DEF-83: aviso de una sección que no se pudo cargar, con «Reintentar»; el resto del Inicio sigue visible. */
function PartFallback({name, title, onRetry}) {
  const id = `adm-part-${name}`;
  return <section className="adm-card adm-part-error" aria-labelledby={id}>
    <header className="adm-card-head"><h3 id={id}>{title}</h3></header>
    <p className="adm-part-message"><Icon name="alert"/>No pudimos cargar esta parte.</p>
    <button type="button" className="button outline" onClick={onRetry}>Reintentar</button>
  </section>;
}

/** DEF-83: si la sección falla al dibujarse (datos con otra forma), muestra su aviso en lugar de tumbar el Inicio. */
class SectionBoundary extends React.Component {
  constructor(props) { super(props); this.state = {failed: false}; }
  static getDerivedStateFromError() { return {failed: true}; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/** Una parte del Inicio: si el servidor la informó como fallida (failed_parts) o falla al dibujarse, su aviso. */
function Part({name, title, data, attempt, onRetry, children}) {
  const fallback = <PartFallback name={name} title={title} onRetry={onRetry}/>;
  if ((data.failed_parts || []).includes(name)) return fallback;
  // La clave con el intento vuelve a montar la sección al reintentar.
  return <SectionBoundary key={`${name}-${attempt}`} fallback={fallback}>{children}</SectionBoundary>;
}
