import React, {useEffect, useState} from 'react';
import {request} from '../administration/http';
import {Notice} from '../administration/forms';
import {useResource, ResourceState} from '../administration/Sprint02Common';
import Icon from '../panel/icons';
import TechnicianCard from '../matching/TechnicianCard';
import {saveFavorite, specialtySlug} from '../matching/technicianView';
import {specialtyIcon} from './specialtyIcon';
import {FAQ, HOW_IT_WORKS, PREMIUM_FEATURES, PRIVACY} from './helpContent';
import './pages.css';

// Fase 4 del panel final: páginas nuevas del menú del cliente. Ninguna queda vacía (las que no están listas no se enlazan).

function Page({title, intro, children, className = ''}) {
  const id = 'pagina-' + title.normalize('NFD').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  return <section className={'client-page ' + className} aria-labelledby={id}>
    <header className="client-page-head"><h2 id={id}>{title}</h2>{intro && <p className="muted">{intro}</p>}</header>
    {children}
  </section>;
}

/** Técnicos favoritos (D-101): las tarjetas de la búsqueda; quitar uno lo saca de la lista con su alerta. */
export function FavoritesPage({navigate}) {
  const [items, setItems] = useState(null);
  const [notice, setNotice] = useState({});
  useEffect(() => { Promise.resolve().then(() => request('/client/favorites')).then(r => setItems(r.data.items)).catch(e => { setItems([]); setNotice({error: e.message}); }); }, []);
  async function toggle(technician) {
    setNotice({});
    try {
      const message = await saveFavorite(technician, false);
      setItems(current => current.filter(item => item.id !== technician.id)); setNotice({success: message});
    } catch (error) { setNotice({error: error.message}); }
  }
  return <Page title="Técnicos favoritos" intro="Los técnicos que guardaste con el corazón, para volver a pedirles rápido.">
    <Notice error={notice.error} success={notice.success}/>
    {items === null && <p className="muted">Cargando tus favoritos…</p>}
    {items?.length === 0 && <div className="client-empty">
      <span aria-hidden="true"><Icon name="heart"/></span>
      <p><strong>Aún no tienes técnicos favoritos</strong></p>
      <p className="muted">Toca el corazón en Buscar técnicos para guardarlos aquí.</p>
      <button type="button" className="button primary" onClick={() => navigate('search')}>Buscar técnicos</button>
    </div>}
    <div className="s02-list client-technician-list">
      {items?.map(t => <TechnicianCard key={t.id} technician={t} favorite onFavorite={toggle}
        onOpen={() => navigate('search', {technician: t})}/>)}
    </div>
  </Page>;
}

/** Plan Premium (D-98): presentación sin pagos; el precio queda «Por definir». */
export function PremiumPage({intent}) {
  return <Page title="Plan Premium" className="premium-page"
    intro={intent?.feature ? `«${intent.feature}» es parte del plan Premium para hogares y negocios.` : 'Cuida tus equipos antes de que se malogren.'}>
    <div className="premium-hero">
      <span className="premium-badge"><Icon name="star"/> Premium</span>
      <p className="premium-title">Mi hogar / Mi negocio</p>
      <p>Tus equipos, sus sensores y sus garantías en un solo lugar, con aviso temprano cuando algo falla.</p>
      <p className="premium-price"><strong>Precio:</strong> Por definir</p>
    </div>
    <ul className="premium-features">
      {PREMIUM_FEATURES.map(([icon, title, text]) => <li key={title}>
        <span className="premium-icon" aria-hidden="true"><Icon name={icon}/></span>
        <div><h3>{title}</h3><p className="muted">{text}</p></div>
      </li>)}
    </ul>
    <p className="notice">Por ahora el plan lo activa el administrador; no hay pagos en la aplicación.</p>
  </Page>;
}

/** Especialidades: catálogo visual con «Desde S/» (precios del Inicio) y sus subcategorías como «qué incluye». */
export function SpecialtiesPage({navigate}) {
  const specialties = useResource('/catalog/specialties');
  const [subs, setSubs] = useState({});
  const [prices, setPrices] = useState({});
  useEffect(() => {
    Promise.resolve().then(() => request('/client/home')).then(r => setPrices(Object.fromEntries((r.data?.prices || []).map(p => [p.specialty_id, p.from_fee])))).catch(() => {});
  }, []);
  useEffect(() => {
    (specialties.data || []).forEach(s => Promise.resolve().then(() => request('/catalog/subcategories?specialty_id=' + s.id))
      .then(r => setSubs(current => ({...current, [s.id]: r.data}))).catch(() => {}));
  }, [specialties.data]);
  return <Page title="Especialidades" intro="Todo lo que puedes pedir en TécnicoYa, con su tarifa referencial desde.">
    <ResourceState resource={specialties}/>
    <div className="specialty-grid">
      {(specialties.data || []).map(s => <article key={s.id} className="specialty-card" aria-labelledby={'esp-' + s.id}>
        <div className="specialty-cover" data-specialty={specialtySlug(s.name)} aria-hidden="true"><Icon name={specialtyIcon(s.name)}/></div>
        <div className="specialty-body">
          <h3 id={'esp-' + s.id}>{s.name}</h3>
          <p className="client-fee">{prices[s.id] ? `Desde S/ ${prices[s.id]}` : 'Tarifa según el técnico'}</p>
          <p className="kicker">Qué incluye</p>
          <ul className="client-chips">{(subs[s.id] || []).map(sub => <li key={sub.id}>{sub.name}</li>)}</ul>
          <button type="button" className="button primary" onClick={() => navigate('search', {filters: {specialty_id: String(s.id)}})}>
            Ver técnicos de {s.name}</button>
        </div>
      </article>)}
    </div>
  </Page>;
}

/** Novedades: los comunicados del administrador para clientes. */
export function NewsPage() {
  const news = useResource('/announcements');
  const items = Array.isArray(news.data) ? news.data : news.data?.items || [];
  return <Page title="Novedades" intro="Comunicados y promociones del equipo de TécnicoYa.">
    <ResourceState resource={news}/>
    {news.data && !items.length && <p className="muted">No hay novedades por ahora.</p>}
    <div className="news-list">
      {items.map(a => <article key={a.id} className="news-card">
        {a.image_url && <img src={a.image_url} alt={a.alt_text || ''} loading="lazy"/>}
        <div><h3>{a.title}</h3>{a.body && <p>{a.body}</p>}</div>
      </article>)}
    </div>
  </Page>;
}

export function HowItWorksPage({navigate}) {
  return <Page title="Cómo funciona" intro="Pide un técnico en cuatro pasos.">
    <ol className="how-steps">
      {HOW_IT_WORKS.map((step, index) => <li key={step.title}>
        <span className="how-illustration" data-step={index + 1} aria-hidden="true"><Icon name={step.icon}/></span>
        <div><p className="kicker">Paso {index + 1}</p><h3>{step.title}</h3><p>{step.text}</p></div>
      </li>)}
    </ol>
    <button type="button" className="button primary" onClick={() => navigate('new')}>Hacer mi primera solicitud</button>
  </Page>;
}

export function FaqPage() {
  return <Page title="Preguntas frecuentes">
    <div className="faq-list">
      {FAQ.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
    </div>
  </Page>;
}

export function PrivacyPage() {
  return <Page title="Privacidad y términos" intro="Cómo cuidamos tus datos personales (Ley N.° 29733).">
    <p className="notice privacy-draft">Borrador para revisión del equipo: este texto todavía no es la versión final.</p>
    {PRIVACY.map(([title, text]) => <section key={title} className="privacy-block"><h3>{title}</h3><p>{text}</p></section>)}
  </Page>;
}
