import {useLayoutEffect, useState} from 'react';
import {request} from '../administration/http';

// D-76: el tema se guarda en /me; localStorage es solo el respaldo de este equipo.
const KEY = 'tecnicoya.theme';
const readLocal = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const writeLocal = value => { try { localStorage.setItem(KEY, value); } catch { /* sin almacenamiento: el tema sigue aplicado */ } };
const prefersLight = () => window.matchMedia?.('(prefers-color-scheme: light)')?.matches;

/** Aplica [data-theme] en <html> mientras el panel está montado (la landing sigue en oscuro). */
export default function useTheme(user, onUserChange) {
  const [theme, setTheme] = useState(() => user.theme_preference || readLocal() || 'dark');
  const [notice, setNotice] = useState('');
  const resolved = theme === 'system' ? (prefersLight() ? 'light' : 'dark') : theme;
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = resolved;
    return () => { delete document.documentElement.dataset.theme; };
  }, [resolved]);
  async function toggle() {
    const next = resolved === 'light' ? 'dark' : 'light';
    setTheme(next); writeLocal(next); setNotice('');
    try {
      const result = await request('/me', {theme_preference: next, expected_version: user.version}, 'PATCH');
      onUserChange(result.data);
    } catch {
      setNotice(`Usamos el tema ${next === 'light' ? 'claro' : 'oscuro'} en este equipo, pero no pudimos guardarlo en tu cuenta.`);
    }
  }
  return {theme: resolved, toggle, notice};
}
