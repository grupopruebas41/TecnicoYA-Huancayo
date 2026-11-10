import React, {useEffect, useRef, useState} from 'react';
import NotificationBell from './NotificationBell';
import useTheme from './useTheme';
import useDismiss from './useDismiss';
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
  'flag', 'news', 'monitor', 'snow', 'bolt']);

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
  const run = action => () => { setOpen(false); action(); };
  return <div className="panel-avatar" ref={root} onKeyDown={event => { if (event.key === 'Escape' && open) close(); }}>
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
  const [active, setActive] = useState(() => {
    const saved = store.get('sessionStorage', sectionKey);
    if (sections.some(section => section.id === initialSection)) return initialSection;
    return sections.some(section => section.id === saved) ? saved : sections[0]?.id;
  });
  const [collapsed, setCollapsed] = useState(() => (modern && typeof user.sidebar_collapsed === 'boolean')
    ? user.sidebar_collapsed : store.get('localStorage', 'tecnicoya.panel.collapsed') === '1');
  const [account, setAccount] = useState(false);
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
  function navButton(section) {
    const badge = badges?.[section.id];
    const badgeId = `panel-badge-${section.id}`;
    // Fase 4: lo que no está listo se ve desactivado con «Próximamente»; lo premium lleva candado y abre la presentación.
    if (section.soon) {
      return <button key={section.id} type="button" className="panel-nav-item is-soon" aria-disabled="true"
        data-tooltip={collapsed ? `${section.label} (próximamente)` : undefined} onClick={event => event.preventDefault()}>
        <span className="panel-nav-icon" aria-hidden="true"><Icon name={section.icon}/></span>
        <span className="panel-label">{section.label}<small className="panel-soon">Próximamente</small></span>
      </button>;
    }
    const target = section.premium ? 'premium' : section.id;
    return <React.Fragment key={section.id}><button type="button" className={'panel-nav-item' + (section.premium ? ' is-locked' : '')} data-section={section.id}
      aria-current={section.id === current?.id ? 'page' : undefined} data-tooltip={collapsed ? section.label : undefined}
      aria-describedby={badge?.count ? badgeId : undefined} disabled={locked}
      onClick={() => go(target, section.premium ? {feature: section.label} : null)}>
      <span className="panel-nav-icon" aria-hidden="true">{ICONS.has(section.icon) ? <Icon name={section.icon}/> : section.icon}</span>
      <span className="panel-label">{section.label}{section.premium && <span className="panel-lock" aria-label="Solo Premium" role="img"><Icon name="lock"/></span>}</span>
      {badge?.count > 0 && <span className="panel-nav-badge" aria-hidden="true">{badge.count > 99 ? '99+' : badge.count}</span>}
    </button>
    {/* Fuera del botón: el contador describe el ítem sin cambiar su nombre accesible. */}
    {badge?.count > 0 && <span id={badgeId} hidden>{badge.label}</span>}</React.Fragment>;
  }
  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next); store.set('localStorage', 'tecnicoya.panel.collapsed', next ? '1' : '0');
    // Fase 4: el cliente lo recuerda en su cuenta; si falla, queda en este equipo.
    if (modern) {
      const save = version => Promise.resolve().then(() => request('/me', {sidebar_collapsed: next, expected_version: version}, 'PATCH'));
      // Si otra pestaña cambió la cuenta (409), se relee la versión y se reintenta una sola vez.
      save(user.version)
        .catch(error => error?.status === 409 ? request('/me').then(me => save(me.data.version)) : Promise.reject(error))
        .then(result => { if (result?.data) onUserChange?.(result.data); }).catch(() => {});
    }
  }
  function closeDrawer() { setDrawer(false); drawerButton.current?.focus(); }
  const profile = sections.find(section => section.id === 'profile');
  return <AccessibilityContext.Provider value={{prefs: a11y[0], update: a11y[1]}}>
  <ShellContext.Provider value={{setTourMode, setTourDrawer}}>
  <div className={'panel-shell' + (collapsed && !tourMode ? ' is-collapsed' : '') + (tourMode ? ' is-touring' : '')} data-cy={`portal-${role}`}>
    {/* Fase 5 (WCAG 2.4.1): salta al contenido sin cambiar el hash, que usa el enrutado de la cuenta. */}
    {modern && <a className="skip-link" href="#contenido" onClick={event => { event.preventDefault(); content.current?.focus(); }}>Saltar al contenido</a>}
    <aside className={'panel-sidebar' + (drawer || tourDrawer ? ' is-open' : '')} onKeyDown={event => { if (event.key === 'Escape' && drawer) closeDrawer(); }}>
      {/* Encabezado principal de la página: la marca y el rol (la sección activa es el h2 de su contenido). */}
      <div className={'panel-brand-row' + (modern ? ' is-modern' : '')}>
        {modern && <button type="button" className="panel-icon-button panel-brand-toggle" aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'} data-tooltip={collapsed ? 'Expandir menú' : undefined}
          onClick={toggleCollapsed}><Icon name="menu"/></button>}
        <h1 className="panel-brand"><span className="panel-monogram" aria-hidden="true">t</span>
          <span className="panel-label">TécnicoYa<small>{roleLabel}</small></span></h1>
      </div>
      <nav ref={nav} aria-label={navLabel}>
        {groupsOf(sections.filter(section => section.nav !== false)).map(group => group.title
          ? <div key={group.title} className="panel-nav-group" role="group" aria-labelledby={`panel-group-${group.key}`}>
            <p id={`panel-group-${group.key}`} className="panel-nav-heading"><span className="panel-label">{group.title}</span></p>
            {group.items.map(section => navButton(section))}
          </div>
          : group.items.map(section => navButton(section)))}
      </nav>
      <div className="panel-sidebar-foot">
        {!modern && <button type="button" className="panel-nav-item panel-collapse" aria-expanded={!collapsed} onClick={toggleCollapsed}
          data-tooltip={collapsed ? 'Expandir menú' : undefined}>
          <span className="panel-nav-icon" aria-hidden="true"><Icon name={collapsed ? 'expand' : 'collapse'}/></span>
          <span className="panel-label">{collapsed ? 'Expandir menú' : 'Contraer menú'}</span>
        </button>}
        <a className="panel-nav-item" href="/" data-tooltip={collapsed ? 'Ir al sitio' : undefined}>
          <span className="panel-nav-icon" aria-hidden="true"><Icon name="site"/></span><span className="panel-label">Ir al sitio</span></a>
        {!modern && <button type="button" className="panel-nav-item" data-cy="logout" disabled={busy || locked} onClick={onLogout} data-tooltip={collapsed ? 'Cerrar sesión' : undefined}>
          <span className="panel-nav-icon" aria-hidden="true"><Icon name="logout"/></span><span className="panel-label">Cerrar sesión</span>
        </button>}
      </div>
    </aside>
    {drawer && <div className="panel-backdrop" aria-hidden="true" onClick={closeDrawer}/>}
    <div className="panel-main">
      <header className="panel-topbar">
        <button ref={drawerButton} type="button" className="panel-icon-button panel-drawer-toggle" aria-label="Abrir menú"
          aria-expanded={drawer} onClick={() => setDrawer(!drawer)}><Icon name="menu"/></button>
        <span className="panel-title">{current?.label}</span>
        <div className="panel-actions">
          {modern && live !== null && <p role="status" data-cy="connection" data-state={live ? 'live' : 'offline'}
            className={'panel-connection' + (live ? ' is-live' : '')}
            title={live ? 'Conexión en tiempo real activa.' : 'Sin conexión en tiempo real. Actualiza para ver cambios.'}>
            <span className="panel-connection-dot" aria-hidden="true"/>
            <span className="panel-connection-text" aria-hidden="true">{live ? 'En vivo' : 'Sin conexión'}</span>
            <span className="sr-only">{live ? 'Conexión en tiempo real activa.' : 'Sin conexión en tiempo real. Actualiza para ver cambios.'}</span>
          </p>}
          <NotificationBell key={bellKey} userId={user.id} onConnection={modern ? setLive : undefined}
            onOpen={item => { const target = notificationTarget?.(item); if (target) go(target[0], target[1] || null); }}
            onOpenAll={sections.some(section => section.id === 'notifications') ? () => go('notifications') : undefined}/>
          {modern && a11y[0].read_aloud && canSpeak() && <button type="button" className="panel-icon-button panel-read-button"
            aria-pressed={reader[0]} aria-label={reader[0] ? 'Detener la lectura' : 'Leer la pantalla en voz alta'} onClick={() => reader[1]()}>
            <Icon name="announcements"/></button>}
          {modern && <QuickAccessibility prefs={a11y[0]} onChange={a11y[1]} reader={reader}/>}
          {modern
            ? <button ref={avatarButton} type="button" className="panel-avatar-button" aria-label={`Cuenta de ${user.name}`}
              aria-haspopup="dialog" aria-expanded={account} onClick={() => setAccount(true)}>
              {user.avatar_url ? <img src={user.avatar_url} alt=""/> : <span aria-hidden="true">{initials(user)}</span>}
            </button>
            : <AvatarMenu user={user} theme={theme} onTheme={toggle} onProfile={profile ? () => go('profile') : null} onLogout={onLogout} busy={busy}/>}
        </div>
      </header>
      {(notice || themeNotice || locked || a11y[2]) && <div className="panel-notices">
        {a11y[2] && <output className="notice">{a11y[2]}</output>}
        {notice && <p className="error" role="alert">{notice}</p>}
        {locked && <output className="notice">Espera a que termine de guardarse tu solicitud.</output>}
        {themeNotice && <output className="notice">{themeNotice}</output>}
      </div>}
      {/* AccountApp ya está dentro del <main> de App: el contenido va en un div. */}
      <ShellConnectionContext.Provider value={modern}>
        <div className="panel-content" id="contenido" tabIndex={-1} ref={content} key={`${current?.id}-${visit}`}>{current?.render({navigate: go, intent})}</div>
      </ShellConnectionContext.Provider>
    </div>
    {modern && account && <AccountPanel user={user} onUpdate={onUserChange} onExpired={onExpired} onClose={() => setAccount(false)}
      onLogout={onLogout} busy={busy} theme={theme} onTheme={toggle} a11y={a11y} reader={reader} returnFocus={avatarButton.current} roleLabel={roleLabel}/>}
    {children}
  </div>
  </ShellContext.Provider>
  </AccessibilityContext.Provider>;
}
