import React, {useEffect, useRef, useState} from 'react';
import NotificationBell from './NotificationBell';
import useTheme from './useTheme';
import useDismiss from './useDismiss';
import './panel.css';

const store = {
  get(area, key) { try { return window[area].getItem(key); } catch { return null; } },
  set(area, key, value) { try { window[area].setItem(key, value); } catch { /* sin almacenamiento */ } },
};
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
 */
export default function PanelShell({user, role, roleLabel, navLabel, sections, onLogout, onUserChange, busy, notice}) {
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
  const current = sections.find(section => section.id === active) || sections[0];
  function go(id) {
    setActive(id); store.set('sessionStorage', sectionKey, id); setDrawer(false);
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
        {sections.map(section => <button key={section.id} type="button" className="panel-nav-item"
          aria-current={section.id === current?.id ? 'page' : undefined} title={collapsed ? section.label : undefined} onClick={() => go(section.id)}>
          <span className="panel-nav-icon" aria-hidden="true">{section.icon}</span><span className="panel-label">{section.label}</span>
        </button>)}
      </nav>
      <div className="panel-sidebar-foot">
        <button type="button" className="panel-nav-item panel-collapse" aria-expanded={!collapsed} onClick={toggleCollapsed}>
          <span className="panel-nav-icon" aria-hidden="true">{collapsed ? '»' : '«'}</span>
          <span className="panel-label">{collapsed ? 'Expandir menú' : 'Contraer menú'}</span>
        </button>
        <a className="panel-nav-item" href="/"><span className="panel-nav-icon" aria-hidden="true">↖</span><span className="panel-label">Ir al sitio</span></a>
        <button type="button" className="panel-nav-item" data-cy="logout" disabled={busy} onClick={onLogout}>
          <span className="panel-nav-icon" aria-hidden="true">⏻</span><span className="panel-label">Cerrar sesión</span>
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
      <div className="panel-content" key={current?.id}>{current?.render()}</div>
    </div>
  </div>;
}
