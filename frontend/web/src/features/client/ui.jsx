import React, {useId} from 'react';
import Icon from '../panel/icons';
import './polish.css';

/**
 * Pulido final del panel del cliente: piezas comunes de todas las páginas. Encabezado como el de «Mis equipos» (ícono en
 * un cuadro de color, título, descripción y acción principal a la derecha), estado vacío con ilustración propia y un solo
 * rótulo de demostración por página. Las clases llevan el prefijo «cx-» para no chocar con las del técnico (DEF-70, DEF-77).
 */
export const SAMPLE_TAG = 'Ejemplo · datos de demostración';

export function ClientPage({id, icon, tone = 'teal', title, intro = null, actions = null, className = '', headingRef = null, children}) {
  return <section className={'cx-page ' + className} aria-labelledby={`cx-${id}`}>
    <header className="cx-head" data-tone={tone}>
      <span className="cx-head-icon" aria-hidden="true"><Icon name={icon}/></span>
      <div className="cx-head-text">
        <h2 id={`cx-${id}`} ref={headingRef} tabIndex={headingRef ? -1 : undefined}>{title}</h2>
        {intro && <p className="muted">{intro}</p>}
      </div>
      {actions && <div className="cx-head-actions">{actions}</div>}
    </header>
    {children}
  </section>;
}

/** Rótulo único de demostración (nunca uno por tarjeta). */
export function SampleTag({children = SAMPLE_TAG}) {
  return <p className="cx-sample" role="note"><Icon name="info"/>{children}</p>;
}

/** Ilustración SVG propia: fondo con el degradado del tono, puntos decorativos y el ícono grande. */
export function Illustration({icon, tone = 'teal', className = 'cx-art', cover = false}) {
  const gradient = useId().replaceAll(':', '');
  return <svg className={className} data-tone={tone} viewBox="0 0 160 120" preserveAspectRatio={cover ? "xMidYMid slice" : "xMidYMid meet"} aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="var(--tone-a)"/><stop offset="1" stopColor="var(--tone-b)"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="160" height="120" rx="22" fill={`url(#${gradient})`} opacity="0.16"/>
    <circle cx="80" cy="60" r="38" fill={`url(#${gradient})`}/>
    <circle cx="30" cy="28" r="6" fill="var(--tone-a)" opacity="0.45"/>
    <circle cx="132" cy="92" r="9" fill="var(--tone-b)" opacity="0.35"/>
    <circle cx="128" cy="26" r="3.5" fill="var(--tone-b)" opacity="0.6"/>
    <g transform="translate(56 36) scale(2)" color="white"><Icon name={icon} raw/></g>
  </svg>;
}

/** Estado vacío con ilustración y una acción. */
export function EmptyState({icon, tone = 'teal', title, text = null, children = null}) {
  return <div className="cx-empty" data-tone={tone}>
    <Illustration icon={icon} tone={tone}/>
    <h3>{title}</h3>
    {text && <p className="muted">{text}</p>}
    {children}
  </div>;
}

/** Retraso de la entrada escalonada de una tarjeta (máximo 8 pasos, para no demorar listas largas). */
export const rise = index => ({'--i': Math.min(index, 8)});

/** Revisión del #66: el 409 ACTIVE_REQUEST_LIMIT (D-95) no es un error del servidor; se avisa sin «Referencia». */
export const isLimitError = error => error?.code === 'ACTIVE_REQUEST_LIMIT';

/** Aviso amable del máximo de pedidos activos, con un acceso a Mis solicitudes. */
export function LimitNotice({max = 3, onList = null}) {
  return <div className="cx-limit" role="status" aria-label="Límite de pedidos activos">
    <span className="cx-dot" data-tone="blue" aria-hidden="true"><Icon name="clock"/></span>
    <p><strong>Ya tienes {max} pedidos activos.</strong> Podrás hacer otro cuando alguno se cierre.</p>
    {onList && <button type="button" className="button outline" onClick={onList}>Ver mis solicitudes</button>}
  </div>;
}
