import React, {useEffect, useRef, useState} from 'react';
import NotificationBell from './NotificationBell';
import useTheme from './useTheme';
import useDismiss from './useDismiss';
import Icon from './icons';
import './panel.css';

const store = {
  get(area, key) { try { return window[area].getItem(key); } catch { return null; } },
  set(area, key, value) { try { window[area].setItem(key, value); } catch { /* sin almacenamiento */ } },
};
const ICONS = new Set(['home', 'chart', 'users', 'verify', 'requests', 'catalog', 'announcements', 'profile']);

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
 */
export default function PanelShell({user, role, roleLabel, navLabel, sections, onLogout, onUserChange, busy, notice, badges, onNavigate}) {
  const sectionKey = `tecnicoya.panel.${user.id}.section`;
  const [active, setActive] = useState(() => {
    const saved = store.get('sessionStorage', sectionKey);
    return sections.some(section => section.id === saved) ? saved : sections[0]?.id;
  });
  const [collapsed, setCollapsed] = useState(() => store.get('localStorage', 'tecnicoya.panel.collapsed') === '1');
  const [drawer, setDrawer] = useState(false);
  const drawerButton = useRef(null);
  const nav = useRef(null);
  const {theme, toggle, notice: themeNotice} = useTheme(user, onUserChange);
  useEffect(() => { if (drawer) nav.current?.querySelector('button')?.focus(); }, [drawer]);
  const [intent, setIntent] = useState(null);
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
    return <React.Fragment key={section.id}><button type="button" className="panel-nav-item"
      aria-current={section.id === current?.id ? 'page' : undefined} data-tooltip={collapsed ? section.label : undefined}
      aria-describedby={badge?.count ? badgeId : undefined} onClick={() => go(section.id)}>
      <span className="panel-nav-icon" aria-hidden="true">{ICONS.has(section.icon) ? <Icon name={section.icon}/> : section.icon}</span>
      <span className="panel-label">{section.label}</span>
      {badge?.count > 0 && <span className="panel-nav-badge" aria-hidden="true">{badge.count > 99 ? '99+' : badge.count}</span>}
    </button>
    {/* Fuera del botón: el contador describe el ítem sin cambiar su nombre accesible. */}
    {badge?.count > 0 && <span id={badgeId} hidden>{badge.label}</span>}</React.Fragment>;
  }
  function toggleCollapsed() {
    setCollapsed(!collapsed); store.set('localStorage', 'tecnicoya.panel.collapsed', collapsed ? '0' : '1');
  }
  function closeDrawer() { setDrawer(false); drawerButton.current?.focus(); }
  const profile = sections.find(section => section.id === 'profile');
  return <div className={'panel-shell' + (collapsed ? ' is-collapsed' : '')} data-cy={`portal-${role}`}>
    <aside className={'panel-sidebar' + (drawer ? ' is-open' : '')} onKeyDown={event => { if (event.key === 'Escape' && drawer) closeDrawer(); }}>
      {/* Encabezado principal de la página: la marca y el rol (la sección activa es el h2 de su contenido). */}
      <h1 className="panel-brand"><span className="panel-monogram" aria-hidden="true">t</span>
        <span className="panel-label">TécnicoYa<small>{roleLabel}</small></span></h1>
      <nav ref={nav} aria-label={navLabel}>
        {groupsOf(sections).map(group => group.title
          ? <div key={group.title} className="panel-nav-group" role="group" aria-labelledby={`panel-group-${group.key}`}>
            <p id={`panel-group-${group.key}`} className="panel-nav-heading"><span className="panel-label">{group.title}</span></p>
            {group.items.map(section => navButton(section))}
          </div>
          : group.items.map(section => navButton(section)))}
      </nav>
      <div className="panel-sidebar-foot">
        <button type="button" className="panel-nav-item panel-collapse" aria-expanded={!collapsed} onClick={toggleCollapsed}
          data-tooltip={collapsed ? 'Expandir menú' : undefined}>
          <span className="panel-nav-icon" aria-hidden="true"><Icon name={collapsed ? 'expand' : 'collapse'}/></span>
          <span className="panel-label">{collapsed ? 'Expandir menú' : 'Contraer menú'}</span>
        </button>
        <a className="panel-nav-item" href="/" data-tooltip={collapsed ? 'Ir al sitio' : undefined}>
          <span className="panel-nav-icon" aria-hidden="true"><Icon name="site"/></span><span className="panel-label">Ir al sitio</span></a>
        <button type="button" className="panel-nav-item" data-cy="logout" disabled={busy} onClick={onLogout} data-tooltip={collapsed ? 'Cerrar sesión' : undefined}>
          <span className="panel-nav-icon" aria-hidden="true"><Icon name="logout"/></span><span className="panel-label">Cerrar sesión</span>
        </button>
      </div>
    </aside>
    {drawer && <div className="panel-backdrop" aria-hidden="true" onClick={closeDrawer}/>}
    <div className="panel-main">
      <header className="panel-topbar">
        <button ref={drawerButton} type="button" className="panel-icon-button panel-drawer-toggle" aria-label="Abrir menú"
          aria-expanded={drawer} onClick={() => setDrawer(!drawer)}><span aria-hidden="true">☰</span></button>
        <span className="panel-title">{current?.label}</span>
        <div className="panel-actions">
          <NotificationBell/>
          <AvatarMenu user={user} theme={theme} onTheme={toggle} onProfile={profile ? () => go('profile') : null} onLogout={onLogout} busy={busy}/>
        </div>
      </header>
      {(notice || themeNotice) && <div className="panel-notices">
        {notice && <p className="error" role="alert">{notice}</p>}
        {themeNotice && <output className="notice">{themeNotice}</output>}
      </div>}
      {/* AccountApp ya está dentro del <main> de App: el contenido va en un div. */}
      <div className="panel-content" key={`${current?.id}-${visit}`}>{current?.render({navigate: go, intent})}</div>
    </div>
  </div>;
}
