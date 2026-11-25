import React, {useEffect, useRef, useState} from 'react';
import NotificationBell from './NotificationBell';
import useTheme from './useTheme';
import useDismiss from './useDismiss';
import useEvents from '../../lib/useEvents';
import Icon from './icons';
import AccountPanel from './AccountPanel';
import {AccessibilityContext, QuickAccessibility, canSpeak, useAccessibility, useReader} from './quickAccessibility';
import {request} from '../administration/http';
import {ShellConnectionContext, ShellContext} from './shellContext';
import './panel.css';

const store = {
  get(area, key) { try { return window[area].getItem(key); } catch { return null; } },
  set(area, key, value) { try { window[area].setItem(key, value); } catch { /* sin almacenamiento */ } },
};
const ICONS = new Set(['home', 'chart', 'users', 'verify', 'requests', 'catalog', 'announcements', 'profile', 'plus', 'search', 'bell',
  'check', 'clock', 'alert', 'close', 'image', 'star', 'menu', 'heart', 'lock', 'calendar', 'map', 'help', 'sensor', 'gift', 'book',
  'flag', 'news', 'monitor', 'snow', 'bolt', 'wallet', 'briefcase']);

/** Agrupa las secciones por su título de grupo, en el orden en que llegan; las que no tienen grupo van sueltas. */
function groupsOf(sections) {
  const groups = [];
  sections.forEach(section => {
    const last = groups.at(-1);
    if (last && last.title === (section.group || null)) last.items.push(section);
    else groups.push({title: section.group || null, key: groups.length, items: [section]});
  });
  return groups;
}

export const initials = user => {
  const parts = user.given_names ? [user.given_names, user.family_names] : (user.name || '').split(/\s+/);
  return parts.filter(Boolean).slice(0, 2).map(part => Array.from(part.trim())[0] || '').join('').toUpperCase() || '·';
};

function AvatarMenu({user, theme, onTheme, onProfile, onLogout, busy}) {
  const [open, setOpen] = useState(false);
  const button = useRef(null);
  const menu = useRef(null);
  useEffect(() => { if (open) menu.current?.querySelector('[role=menuitem]')?.focus(); }, [open]);
  const root = useDismiss(open, () => setOpen(false));
  function close() { setOpen(false); button.current?.focus(); }
  // Cierre S4-S5 (Sonar S6847): Esc dentro del contenedor cierra; se escucha como evento nativo, no en un div con onKeyDown.
  useEvents(root, {keydown: event => { if (event.key === 'Escape' && open) close(); }});
  const run = action => () => { setOpen(false); action(); };
  return <div className="panel-avatar" ref={root}>
    <button ref={button} type="button" className="panel-avatar-button" aria-label={`Menú de ${user.name}`} aria-haspopup="menu"
      aria-expanded={open} onClick={() => setOpen(!open)}>
      {user.avatar_url ? <img src={user.avatar_url} alt=""/> : <span aria-hidden="true">{initials(user)}</span>}
    </button>
    {open && <div ref={menu} className="panel-popover panel-menu" role="menu" aria-label={`Menú de ${user.name}`}>
      {onProfile && <button type="button" role="menuitem" onClick={run(onProfile)}>Mi perfil</button>}
      <button type="button" role="menuitem" onClick={run(onTheme)}>{theme === 'light' ? 'Tema oscuro' : 'Tema claro'}</button>
      <button type="button" role="menuitem" disabled={busy} onClick={run(onLogout)}>Cerrar sesión</button>
    </div>}
  </div>;
}

// Cierre S4-S5 (Sonar S3776): piezas de PanelShell separadas para bajar su complejidad; el marcado es el mismo que antes.

/** Tooltip con el menú contraído: el nombre y, si hay un estado en texto, su texto completo sin repetir el nombre. */
export function navTooltip(section, badge) {
  if (!badge?.text || badge.count) return section.label;
  return badge.label.startsWith(section.label) ? badge.label : `${section.label} · ${badge.label}`;
}

/** Contador (con punto que late) o estado corto en texto con ícono (revisión del #63). */
function NavBadge({badge}) {
  if (badge?.count > 0) {
    return <span className={'panel-nav-badge' + (badge.pulse ? ' is-pulse' : '')} aria-hidden="true">
      {badge.pulse && <span className="panel-nav-pulse"/>}{badge.count > 99 ? '99+' : badge.count}</span>;
  }
  // Revisión del #63: texto corto («50 %», «Falta 1») con ícono; el completo va en title, aria-label y la descripción del ítem.
  if (!badge?.text) return null;
  return <span className="panel-nav-badge is-text" data-tone={badge.tone} title={badge.label} aria-label={badge.label} aria-hidden="true">
    {badge.icon && ICONS.has(badge.icon) && <Icon name={badge.icon}/>}<span className="panel-nav-badge-text">{badge.text}</span></span>;
}

/** Ítem del menú. Lo que no está listo va con «Próximamente» (Fase 4); lo premium lleva candado y abre la presentación. */
function NavItem({section, badge, collapsed, currentId, locked, onGo}) {
  if (section.soon) {
    // Fase A1 del administrador: soon puede traer su propio rótulo («Sprint 6»); si no, «Próximamente».
    const note = typeof section.soon === 'string' ? section.soon : 'Próximamente';
    return <button type="button" className="panel-nav-item is-soon" aria-disabled="true" data-section={section.id}
      data-tooltip={collapsed ? `${section.label} (${typeof section.soon === 'string' ? note : 'próximamente'})` : undefined} onClick={event => event.preventDefault()}>
      <span className="panel-nav-icon" aria-hidden="true"><Icon name={section.icon}/></span>
      <span className="panel-label">{section.label}<small className="panel-soon">{note}</small></span>
    </button>;
  }
  const badgeId = `panel-badge-${section.id}`;
  const described = Boolean(badge?.count > 0 || badge?.text);
  const go = () => (section.premium ? onGo('premium', {feature: section.label}) : onGo(section.id, null));
  return <>
    <button type="button" className={'panel-nav-item' + (section.premium ? ' is-locked' : '')} data-section={section.id}
      aria-current={section.id === currentId ? 'page' : undefined} data-tooltip={collapsed ? navTooltip(section, badge) : undefined}
      aria-describedby={badge?.count || badge?.text ? badgeId : undefined} disabled={locked} onClick={go}>
      <span className="panel-nav-icon" aria-hidden="true">{ICONS.has(section.icon) ? <Icon name={section.icon}/> : section.icon}</span>
      {/* Revisión del #63: texto y etiqueta juntos; si no caben lado a lado, la etiqueta baja bajo el texto (nunca se corta). */}
      {/* DEF-87: con contador numérico, el número se queda a la derecha en la misma línea y el texto se parte en dos. */}
      <span className={'panel-nav-text' + (badge?.count > 0 ? ' has-count' : '')}>
        <span className="panel-label">{section.label}{section.premium && <span className="panel-lock" aria-label="Solo Premium" role="img"><Icon name="lock"/></span>}</span>
        <NavBadge badge={badge}/>
      </span>
    </button>
    {/* Fuera del botón: el contador describe el ítem sin cambiar su nombre accesible. */}
    {described && <span id={badgeId} hidden>{badge.label}</span>}
  </>;
}

/** Fase 4: el cliente recuerda el menú contraído en su cuenta; ante un 409 relee la versión y reintenta una vez. */
function saveCollapsed(user, next, onUserChange) {
  const save = version => Promise.resolve().then(() => request('/me', {sidebar_collapsed: next, expected_version: version}, 'PATCH'));
  save(user.version)
    .catch(error => (error?.status === 409 ? request('/me').then(me => save(me.data.version)) : Promise.reject(error)))
    .then(result => { if (result?.data) onUserChange?.(result.data); }).catch(() => {});
}

/** Fase T1: un solo indicador de conexión en la barra superior. */
function ConnectionStatus({live}) {
  const text = live ? 'Conexión en tiempo real activa.' : 'Sin conexión en tiempo real. Actualiza para ver cambios.';
  return <p role="status" data-cy="connection" data-state={live ? 'live' : 'offline'} className={'panel-connection' + (live ? ' is-live' : '')} title={text}>
    <span className="panel-connection-dot" aria-hidden="true"/>
    <span className="panel-connection-text" aria-hidden="true">{live ? 'En vivo' : 'Sin conexión'}</span>
    <span className="sr-only">{text}</span>
  </p>;
}

/** Pie del menú: contraer (paneles no modernos), ir al sitio y cerrar sesión (paneles no modernos). */
function SidebarFoot({modern, collapsed, disabled, onToggle, onLogout}) {
  const tip = text => (collapsed ? text : undefined);
  const toggleText = collapsed ? 'Expandir menú' : 'Contraer menú';
  return <div className="panel-sidebar-foot">
    {!modern && <button type="button" className="panel-nav-item panel-collapse" aria-expanded={!collapsed} onClick={onToggle}
      data-tooltip={tip('Expandir menú')}>
      <span className="panel-nav-icon" aria-hidden="true"><Icon name={collapsed ? 'expand' : 'collapse'}/></span>
      <span className="panel-label">{toggleText}</span>
    </button>}
    <a className="panel-nav-item" href="/" data-tooltip={tip('Ir al sitio')}>
      <span className="panel-nav-icon" aria-hidden="true"><Icon name="site"/></span><span className="panel-label">Ir al sitio</span></a>
    {!modern && <button type="button" className="panel-nav-item" data-cy="logout" disabled={disabled} onClick={onLogout} data-tooltip={tip('Cerrar sesión')}>
      <span className="panel-nav-icon" aria-hidden="true"><Icon name="logout"/></span><span className="panel-label">Cerrar sesión</span>
    </button>}
  </div>;
}

/** Sección con la que abre el panel: la pedida al entrar, la última de esta pestaña o la primera. */
function firstSection(sections, initialSection, saved) {
  if (sections.some(section => section.id === initialSection)) return initialSection;
  return sections.some(section => section.id === saved) ? saved : sections[0]?.id;
}

/** Menú contraído: el cliente lo trae de su cuenta (Fase 4); si no, se recuerda en este equipo. */
function firstCollapsed(modern, user) {
  if (modern && typeof user.sidebar_collapsed === 'boolean') return user.sidebar_collapsed;
  return store.get('localStorage', 'tecnicoya.panel.collapsed') === '1';
}

/** Clases del contenedor: contraído (salvo durante el tutorial, que lo expande) y en tutorial. */
function shellClass(collapsed, tourMode) {
  if (tourMode) return 'panel-shell is-touring';
  return collapsed ? 'panel-shell is-collapsed' : 'panel-shell';
}

/** Abre una sección si el panel la tiene; si no, no hay acceso (undefined o null, como antes). */
function sectionHandler(sections, id, go) {
  if (!sections.some(section => section.id === id)) return id === 'profile' ? null : undefined;
  return () => go(id);
}

/** Marca y rol; en el panel moderno, el ☰ que contrae el menú (Fase 4). */
function BrandRow({modern, collapsed, roleLabel, onToggle}) {
  return <div className={'panel-brand-row' + (modern ? ' is-modern' : '')}>
    {modern && <button type="button" className="panel-icon-button panel-brand-toggle" aria-expanded={!collapsed}
      aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'} data-tooltip={collapsed ? 'Expandir menú' : undefined}
      onClick={onToggle}><Icon name="menu"/></button>}
    <h1 className="panel-brand"><span className="panel-monogram" aria-hidden="true">t</span>
      <span className="panel-label">TécnicoYa<small>{roleLabel}</small></span></h1>
  </div>;
}

/** Grupos del menú con su título (Bloque C); las secciones sin grupo van sueltas. */
function NavGroups({sections, renderItem}) {
  return groupsOf(sections.filter(section => section.nav !== false)).map(group => (group.title
    ? <div key={group.title} className="panel-nav-group" role="group" aria-labelledby={`panel-group-${group.key}`}>
      <p id={`panel-group-${group.key}`} className="panel-nav-heading"><span className="panel-label">{group.title}</span></p>
      {group.items.map(renderItem)}
    </div>
    : group.items.map(renderItem)));
}

/** Panel moderno: leer en voz alta (si está activo), «Aa» y el avatar que abre «Tu cuenta». */
function ModernActions({a11y, reader, user, account, avatarButton, onAccount}) {
  return <>
    {a11y[0].read_aloud && canSpeak() && <button type="button" className="panel-icon-button panel-read-button"
      aria-pressed={reader[0]} aria-label={reader[0] ? 'Detener la lectura' : 'Leer la pantalla en voz alta'} onClick={() => reader[1]()}>
      <Icon name="announcements"/></button>}
    <QuickAccessibility prefs={a11y[0]} onChange={a11y[1]} reader={reader} onMore={() => onAccount('accesibilidad')}/>
    <button ref={avatarButton} type="button" className="panel-avatar-button" aria-label={`Cuenta de ${user.name}`}
      aria-haspopup="dialog" aria-expanded={account} onClick={() => onAccount()}>
      {user.avatar_url ? <img src={user.avatar_url} alt=""/> : <span aria-hidden="true">{initials(user)}</span>}
    </button>
  </>;
}

/** Avisos bajo la barra superior: accesibilidad, error, guardado en curso y tema. */
function PanelNotices({a11yNotice, notice, locked, themeNotice}) {
  if (!(notice || themeNotice || locked || a11yNotice)) return null;
  return <div className="panel-notices">
    {a11yNotice && <output className="notice">{a11yNotice}</output>}
    {notice && <p className="error" role="alert">{notice}</p>}
    {locked && <output className="notice">Espera a que termine de guardarse tu solicitud.</output>}
    {themeNotice && <output className="notice">{themeNotice}</output>}
  </div>;
}

/**
 * Base común de los paneles (Fase 1, D-73): barra lateral contraíble con secciones, barra superior con campana y
 * avatar, tema claro/oscuro (D-76) y cajón en móvil. Cada sección trae su contenido; el panel no lo cambia.
 * Bloque C (D-85): secciones agrupadas con título, iconos SVG, contadores (badges) y tooltips con el menú contraído;
 * render recibe {navigate, intent} para los accesos rápidos.
 * Panel del cliente (D-87): initialSection e initialIntent abren una sección al entrar (la búsqueda de la portada),
 * locked bloquea el menú mientras una sección guarda y bellKey vuelve a cargar la campana.
 * Fase 4 del panel final (modern, solo el cliente): ☰ junto al logo que contrae el menú y lo recuerda en la cuenta,
 * campana con «Marcar todas como leídas», «Aa» de accesibilidad rápida, panel flotante del avatar con 5 pestañas y
 * menú sin la sección CUENTA. Una sección puede ser nav:false (fuera del menú), soon (Próximamente, aria-disabled) o
 * premium (candado: abre la sección «premium»).
 */
export default function PanelShell({user, role, roleLabel, navLabel, sections, onLogout, onUserChange, busy, notice, badges, onNavigate,
  initialSection, initialIntent = null, locked = false, bellKey, modern = false, onExpired, notificationTarget, children}) {
  const sectionKey = `tecnicoya.panel.${user.id}.section`;
  const [active, setActive] = useState(() => firstSection(sections, initialSection, store.get('sessionStorage', sectionKey)));
  const [collapsed, setCollapsed] = useState(() => firstCollapsed(modern, user));
  const [account, setAccount] = useState(false);
  // «Más ajustes en tu cuenta» del panel «Aa» abre la cuenta directamente en Accesibilidad.
  const [accountTab, setAccountTab] = useState('cuenta');
  const openAccount = (tab = 'cuenta') => { setAccountTab(tab); setAccount(true); };
  // Fase T1: un solo indicador de conexión en la barra superior, con el estado de la suscripción de la campana.
  const [live, setLive] = useState(null);
  const avatarButton = useRef(null);
  // Fase 5 (D-97): el cliente guarda sus ajustes en la cuenta; los demás roles solo en este equipo.
  const a11y = useAccessibility(modern ? user : null);
  const reader = useReader();
  const content = useRef(null);
  const [drawer, setDrawer] = useState(false);
  // Tutorial (Fase 5): expande el menú y abre el cajón sin guardar ni mover el foco; al terminar vuelven a su estado.
  const [tourMode, setTourMode] = useState(false);
  const [tourDrawer, setTourDrawer] = useState(false);
  const drawerButton = useRef(null);
  const nav = useRef(null);
  const sidebar = useRef(null);
  // Cierre S4-S5 (Sonar S6847): Esc dentro del menú lateral abierto como cajón lo cierra (evento nativo del aside).
  useEvents(sidebar, {keydown: event => { if (event.key === 'Escape' && drawer) closeDrawer(); }});
  const {theme, toggle, notice: themeNotice} = useTheme(user, onUserChange);
  useEffect(() => { if (drawer) nav.current?.querySelector('button')?.focus(); }, [drawer]);
  const [intent, setIntent] = useState(initialIntent);
  const [visit, setVisit] = useState(0);
  const current = sections.find(section => section.id === active) || sections[0];
  // intent: lo que la sección debe abrir al llegar (p. ej. el formulario de alta desde un acceso rápido del Inicio).
  function go(id, nextIntent = null) {
    if (!sections.some(section => section.id === id)) return;
    setActive(id); setIntent(nextIntent); setVisit(visit + 1); store.set('sessionStorage', sectionKey, id); setDrawer(false);
    onNavigate?.(id);
  }
  // Un aviso de la campana lleva a su sección (y a lo que debe abrir); «Ver todas» va a Notificaciones si existe.
  function openNotification(item) {
    const target = notificationTarget?.(item);
    if (target) go(target[0], target[1] || null);
  }
  const openAllNotifications = sectionHandler(sections, 'notifications', go);
  const openProfile = sectionHandler(sections, 'profile', go);
  const navButton = section => <NavItem key={section.id} section={section} badge={badges?.[section.id]} collapsed={collapsed}
    currentId={current?.id} locked={locked} onGo={go}/>;
  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next); store.set('localStorage', 'tecnicoya.panel.collapsed', next ? '1' : '0');
    // Fase 4: el cliente lo recuerda en su cuenta; si falla, queda en este equipo.
    if (modern) saveCollapsed(user, next, onUserChange);
  }
  function closeDrawer() { setDrawer(false); drawerButton.current?.focus(); }
  return <AccessibilityContext.Provider value={{prefs: a11y[0], update: a11y[1]}}>
  <ShellContext.Provider value={{setTourMode, setTourDrawer, openAccount: modern ? () => openAccount() : undefined}}>
  <div className={shellClass(collapsed, tourMode)} data-cy={`portal-${role}`} data-role={role}>
    {/* Fase 5 (WCAG 2.4.1): salta al contenido sin cambiar el hash, que usa el enrutado de la cuenta. */}
    {modern && <a className="skip-link" href="#contenido" onClick={event => { event.preventDefault(); content.current?.focus(); }}>Saltar al contenido</a>}
    <aside ref={sidebar} className={'panel-sidebar' + (drawer || tourDrawer ? ' is-open' : '')}>
      {/* Encabezado principal de la página: la marca y el rol (la sección activa es el h2 de su contenido). */}
      <BrandRow modern={modern} collapsed={collapsed} roleLabel={roleLabel} onToggle={toggleCollapsed}/>
      <nav ref={nav} aria-label={navLabel}>
        <NavGroups sections={sections} renderItem={navButton}/>
      </nav>
      <SidebarFoot modern={modern} collapsed={collapsed} disabled={busy || locked} onToggle={toggleCollapsed} onLogout={onLogout}/>
    </aside>
    {drawer && <div className="panel-backdrop" aria-hidden="true" onClick={closeDrawer}/>}
    <div className="panel-main">
      <header className="panel-topbar">
        <button ref={drawerButton} type="button" className="panel-icon-button panel-drawer-toggle" aria-label="Abrir menú"
          aria-expanded={drawer} onClick={() => setDrawer(!drawer)}><Icon name="menu"/></button>
        <span className="panel-title">{current?.label}</span>
        <div className="panel-actions">
          {modern && live !== null && <ConnectionStatus live={live}/>}
          <NotificationBell key={bellKey} userId={user.id} role={role} onConnection={modern ? setLive : undefined}
            onOpen={openNotification} onOpenAll={openAllNotifications}/>
          {modern
            ? <ModernActions a11y={a11y} reader={reader} user={user} account={account} avatarButton={avatarButton} onAccount={openAccount}/>
            : <AvatarMenu user={user} theme={theme} onTheme={toggle} onProfile={openProfile} onLogout={onLogout} busy={busy}/>}
        </div>
      </header>
      <PanelNotices a11yNotice={a11y[2]} notice={notice} locked={locked} themeNotice={themeNotice}/>
      {/* AccountApp ya está dentro del <main> de App: el contenido va en un div. */}
      <ShellConnectionContext.Provider value={modern}>
        <div className="panel-content" id="contenido" tabIndex={-1} ref={content} key={`${current?.id}-${visit}`}>{current?.render({navigate: go, intent})}</div>
      </ShellConnectionContext.Provider>
    </div>
    {modern && account && <AccountPanel user={user} onUpdate={onUserChange} onExpired={onExpired} onClose={() => setAccount(false)}
      onLogout={onLogout} busy={busy} theme={theme} onTheme={toggle} a11y={a11y} reader={reader} returnFocus={avatarButton.current} roleLabel={roleLabel}
      initialTab={accountTab}/>}
    {children}
  </div>
  </ShellContext.Provider>
  </AccessibilityContext.Provider>;
}
