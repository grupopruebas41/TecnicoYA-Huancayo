import React, {useEffect, useRef, useState} from 'react';
import {KIND_LABELS} from './announcementRules';
import './announcements.css';

// Carrusel de comunicados del Inicio de cliente y técnico (D-83), también usado como vista previa en el editor.
// Rota cada 6 s (12 s con Genially, que necesita más tiempo de lectura); se detiene con el botón de pausa, el
// puntero encima, el foco dentro, la pestaña oculta o prefers-reduced-motion (sin reproducción automática).
const DURATION = {genially: 12000, default: 6000};
const SWIPE = 40;
const GENIALLY_SANDBOX = 'allow-scripts allow-same-origin allow-popups';

const reducedMotion = () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);

const PATHS = {
  pause: 'M7 5h3v14H7zM14 5h3v14h-3z',
  play: 'M8 5v14l11-7z',
  previous: 'M15 6l-6 6 6 6',
  next: 'M9 6l6 6-6 6',
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  shrink: 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5',
};
function Icon({name}) {
  const filled = name === 'pause' || name === 'play';
  return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"
    fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={PATHS[name]}/>
  </svg>;
}

function Slide({item, forceMobile}) {
  const alt = item.alt_text || item.title || '';
  if (item.source === 'genially' && item.genially_url) {
    // La portada queda detrás del iframe: se ve si Genially no carga.
    return <div className="carousel-genially">
      {item.image_url && <img className="carousel-cover" src={item.image_url} alt=""/>}
      <iframe src={item.genially_url} title={alt} sandbox={GENIALLY_SANDBOX} allowFullScreen loading="lazy" referrerPolicy="no-referrer"/>
    </div>;
  }
  if (item.source === 'image' || item.source === 'genially') {
    const mobile = forceMobile && item.mobile_image_url;
    const picture = !item.image_url ? <div className="carousel-placeholder">Elige la imagen principal para ver la vista previa.</div>
      : mobile ? <img src={item.mobile_image_url} alt={alt}/>
        : <picture>{item.mobile_image_url && <source media="(max-width: 640px)" srcSet={item.mobile_image_url}/>}<img src={item.image_url} alt={alt}/></picture>;
    if (!item.link_url || !item.image_url) return picture;
    return <a className="carousel-link" href={item.link_url} target="_blank" rel="noopener noreferrer">
      {picture}<span className="sr-only">{item.link_label ? ` — ${item.link_label}` : ''} (se abre en otra pestaña)</span>
    </a>;
  }
  // Comunicado de texto del S2.
  return <div className="carousel-text">
    {item.kind && <span className="carousel-kind">{KIND_LABELS[item.kind]}</span>}
    <h3>{item.title}</h3>
    {item.body && <p>{item.body}</p>}
    {item.link_url && <a className="carousel-cta" href={item.link_url} target="_blank" rel="noopener noreferrer">{item.link_label || 'Ver más'}</a>}
  </div>;
}

export default function AnnouncementCarousel({items = [], preview = false, viewport = 'desktop', safeZone = false, label = 'Comunicados'}) {
  const count = items.length;
  const [reduced] = useState(reducedMotion);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(() => !preview && !reduced);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  const [visited, setVisited] = useState(() => new Set([0]));
  const [fullscreen, setFullscreen] = useState(false);
  const root = useRef(null);
  const touch = useRef(null);
  const current = count ? index % count : 0;
  const item = items[current];
  const duration = item?.source === 'genially' ? DURATION.genially : DURATION.default;
  const running = playing && !hovered && !focused && !hidden && count > 1;

  function go(step) {
    if (count < 2) return;
    setIndex(value => {
      const next = (value % count + step + count) % count;
      setVisited(seen => (seen.has(next) ? seen : new Set(seen).add(next)));
      return next;
    });
  }
  useEffect(() => {
    if (!running) return undefined;
    const timer = setTimeout(() => go(1), duration);
    return () => clearTimeout(timer);
    // go solo depende de count; cada cambio de diapositiva (current) vuelve a programar el temporizador.
  }, [running, current, duration]);
  useEffect(() => {
    const visibility = () => setHidden(document.hidden);
    const screenChange = () => setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('fullscreenchange', screenChange);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('fullscreenchange', screenChange);
    };
  }, []);
  if (!count) return null;

  function keys(event) {
    if (event.key === 'ArrowRight') { event.preventDefault(); go(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1); }
  }
  function touchEnd(event) {
    const start = touch.current, end = event.changedTouches?.[0];
    touch.current = null;
    if (!start || !end) return;
    const dx = end.clientX - start.x, dy = end.clientY - start.y;
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  }
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else root.current?.requestFullscreen?.()?.catch?.(() => {});
  }
  const classes = ['carousel', viewport === 'mobile' && 'is-mobile', item?.mobile_image_url && 'has-mobile', preview && 'is-preview', fullscreen && 'is-fullscreen'];
  return <section ref={root} className={classes.filter(Boolean).join(' ')} aria-roledescription="carrusel" aria-label={label} tabIndex={0}
    onKeyDown={keys} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocus={() => setFocused(true)} onBlur={event => { if (!root.current?.contains(event.relatedTarget)) setFocused(false); }}
    onTouchStart={event => { const point = event.changedTouches?.[0]; touch.current = point ? {x: point.clientX, y: point.clientY} : null; }}
    onTouchEnd={touchEnd}>
    <div className="carousel-stage">
      {items.map((slide, position) => {
        const active = position === current;
        return <div key={slide.id ?? position} className={'carousel-slide' + (active ? ' is-current' : '')} role="group"
          aria-roledescription="diapositiva" aria-label={`${position + 1} de ${count}`} aria-hidden={!active} inert={active ? undefined : ''}>
          {(active || visited.has(position)) && <Slide item={slide} forceMobile={viewport === 'mobile'}/>}
        </div>;
      })}
      {safeZone && <div className="carousel-safe-zone" aria-hidden="true"><span>Zona segura (80 %)</span></div>}
      {count > 1 && !reduced && <div className="carousel-progress" aria-hidden="true">
        <span key={`${current}-${running}`} style={{animationDuration: `${duration}ms`, animationPlayState: running ? 'running' : 'paused'}}/>
      </div>}
    </div>
    <div className="carousel-bar">
    <div className="carousel-controls">
      <button type="button" disabled={count < 2} aria-label={playing ? 'Pausar rotación' : 'Reanudar rotación'} onClick={() => setPlaying(!playing)}>
        <Icon name={playing ? 'pause' : 'play'}/></button>
      <button type="button" disabled={count < 2} aria-label="Comunicado anterior" onClick={() => go(-1)}><Icon name="previous"/></button>
      <span className="carousel-counter" data-testid="carousel-counter" aria-live={running ? 'off' : 'polite'}>{current + 1} / {count}</span>
      <button type="button" disabled={count < 2} aria-label="Comunicado siguiente" onClick={() => go(1)}><Icon name="next"/></button>
    </div>
    <div className="carousel-actions">
      {item?.source === 'genially' && item.link_url && <a className="carousel-cta" href={item.link_url} target="_blank" rel="noopener noreferrer">{item.link_label || 'Ver más'}</a>}
      <button type="button" aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'} onClick={toggleFullscreen}>
        <Icon name={fullscreen ? 'shrink' : 'expand'}/></button>
    </div>
    </div>
  </section>;
}
