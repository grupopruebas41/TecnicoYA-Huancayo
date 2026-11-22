import React, {useEffect, useId, useMemo, useRef, useState} from 'react';
import {request} from '../administration/http';
import {Notice} from '../administration/forms';
import {useResource, ResourceState} from '../administration/Sprint02Common';
import DismissBackdrop from '../../components/DismissBackdrop';
import Icon from '../panel/icons';
import TechnicianCard from '../matching/TechnicianCard';
import {saveFavorite, specialtySlug} from '../matching/technicianView';
import {shortDate, soles} from '../../lib/format';
import {specialtyIcon} from './specialtyIcon';
import {FAQ, HOW_IT_WORKS, PREMIUM_FEATURES, PRIVACY, PRIVACY_VERSION} from './helpContent';
import {ClientPage, EmptyState, rise} from './ui';
import './pages.css';

// Fase 4 del panel final y pulido final: páginas del menú del cliente con el encabezado común (ícono, título y acción).

/** Técnicos favoritos (D-101): la misma tarjeta de Buscar técnicos, con «Pedir de nuevo» y quitar con confirmación. */
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
  return <ClientPage id="favoritos" icon="heart" tone="rose" title="Técnicos favoritos"
    intro="Los técnicos que guardaste con el corazón, para volver a pedirles rápido."
    actions={items?.length > 0 && <button type="button" className="button outline" onClick={() => navigate('search')}>Buscar más técnicos</button>}>
    <Notice error={notice.error} success={notice.success}/>
    {items === null && <p className="muted">Cargando tus favoritos…</p>}
    {items?.length === 0 && <EmptyState icon="heart" tone="rose" title="Aún no tienes técnicos favoritos"
      text="Toca el corazón en Buscar técnicos para guardarlos aquí.">
      <button type="button" className="button primary" onClick={() => navigate('search')}>Buscar técnicos</button>
    </EmptyState>}
    <div className="client-technician-list">
      {items?.map((t, index) => <TechnicianCard key={t.id} index={index} technician={t} favorite onFavorite={toggle}
        onRequest={technician => navigate('new', {technician})} onOpen={() => navigate('search', {technician: t})}/>)}
    </div>
  </ClientPage>;
}

/** Plan Premium (D-98): presentación sin pagos; el precio queda «Por definir». */
export function PremiumPage({intent}) {
  return <ClientPage id="premium" icon="star" tone="violet" title="Plan Premium" className="premium-page"
    intro={intent?.feature ? `«${intent.feature}» es parte del plan Premium para hogares y negocios.` : 'Cuida tus equipos antes de que se malogren.'}>
    <div className="premium-hero">
      <span className="premium-badge"><Icon name="star"/> Premium</span>
      <p className="premium-title">Mi hogar / Mi negocio</p>
      <p>Tus equipos, sus sensores y sus garantías en un solo lugar, con aviso temprano cuando algo falla.</p>
      <p className="premium-price"><strong>Precio:</strong> Por definir</p>
    </div>
    <ul className="premium-features">
      {PREMIUM_FEATURES.map(([icon, title, text], index) => <li key={title} className="cx-rise" style={rise(index)}>
        <span className="premium-icon" aria-hidden="true"><Icon name={icon}/></span>
        <div><h3>{title}</h3><p className="muted">{text}</p></div>
      </li>)}
    </ul>
    <p className="notice">Por ahora el plan lo activa el administrador; no hay pagos en la aplicación.</p>
  </ClientPage>;
}

/** Especialidades: catálogo visual con «Desde S/ 50,00» (precios del Inicio) y sus subcategorías como «qué incluye». */
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
  return <ClientPage id="especialidades" icon="catalog" tone="blue" title="Especialidades"
    intro="Todo lo que puedes pedir en TécnicoYa, con su tarifa referencial desde.">
    <ResourceState resource={specialties}/>
    <div className="specialty-grid">
      {(specialties.data || []).map((s, index) => <article key={s.id} className="specialty-card cx-rise" style={rise(index)} aria-labelledby={'esp-' + s.id}>
        <div className="specialty-cover" data-specialty={specialtySlug(s.name)} aria-hidden="true"><Icon name={specialtyIcon(s.name)}/></div>
        <div className="specialty-body">
          <h3 id={'esp-' + s.id}>{s.name}</h3>
          <p className="client-fee">{prices[s.id] ? `Desde ${soles(prices[s.id])}` : 'Tarifa según el técnico'}</p>
          <p className="kicker">Qué incluye</p>
          <ul className="client-chips">{(subs[s.id] || []).map(sub => <li key={sub.id}>{sub.name}</li>)}</ul>
          <button type="button" className="button primary" onClick={() => navigate('search', {filters: {specialty_id: String(s.id)}})}>
            Ver técnicos de {s.name}</button>
        </div>
      </article>)}
    </div>
  </ClientPage>;
}

const NEWS_KINDS = {
  promotion: {label: 'Promoción', icon: 'gift', badge: 'is-warning', tone: 'violet'},
  notice: {label: 'Aviso', icon: 'alert', badge: 'is-info', tone: 'orange'},
  news: {label: 'Comunicado', icon: 'announcements', badge: 'is-info', tone: 'teal'},
};
const newsKind = item => NEWS_KINDS[item.kind] || NEWS_KINDS.news;

/** Detalle de una novedad en un diálogo nativo: Esc o el fondo lo cierran y el foco vuelve a «Leer más». */
function NewsDialog({item, onClose}) {
  const close = useRef(null);
  const opener = useRef(document.activeElement);
  const kind = newsKind(item);
  useEffect(() => { close.current?.focus(); const back = opener.current; return () => back?.focus?.(); }, []);
  return <div className="cx-overlay">
    <DismissBackdrop onClose={onClose}/>
    <dialog open className="cx-dialog news-dialog" aria-modal="true" aria-labelledby="novedad-titulo"
      onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } }}>
      <header className="cx-dialog-head">
        <span className={'cx-badge ' + kind.badge}><Icon name={kind.icon}/> {kind.label}</span>
        <button ref={close} type="button" className="cx-icon-button" aria-label="Cerrar novedad" onClick={onClose}><Icon name="close"/></button>
      </header>
      {item.image_url && <img className="news-dialog-image" src={item.image_url} alt={item.alt_text || ''}/>}
      <h2 id="novedad-titulo">{item.title}</h2>
      {item.starts_at && <p className="muted"><time dateTime={item.starts_at}>Publicado el {shortDate(item.starts_at)}</time></p>}
      {item.body && <p className="news-dialog-body">{item.body}</p>}
    </dialog>
  </div>;
}

/** Novedades: tarjetas grandes con imagen, fecha, tipo y «Leer más» con el detalle en un diálogo. */
export function NewsPage() {
  const news = useResource('/announcements');
  const [open, setOpen] = useState(null);
  const items = Array.isArray(news.data) ? news.data : news.data?.items || [];
  return <ClientPage id="novedades" icon="news" tone="teal" title="Novedades" intro="Comunicados y promociones del equipo de TécnicoYa.">
    <ResourceState resource={news}/>
    {news.data && !items.length && <EmptyState icon="news" tone="teal" title="No hay novedades por ahora"
      text="Cuando el equipo publique un comunicado o una promoción, lo verás aquí y en la campana."/>}
    <div className="cx-grid is-wide">
      {items.map((a, index) => {
        const kind = newsKind(a);
        return <article key={a.id} className="cx-card news-card cx-rise" style={rise(index)} aria-labelledby={'novedad-' + a.id}>
          <div className="news-media" data-tone={kind.tone}>
            {a.image_url ? <img src={a.image_url} alt={a.alt_text || ''} loading="lazy"/> : <Icon name={kind.icon}/>}
          </div>
          <div className="cx-badges">
            <span className={'cx-badge ' + kind.badge}><Icon name={kind.icon}/> {kind.label}</span>
            {a.starts_at && <span className="cx-badge is-muted"><Icon name="calendar"/> {shortDate(a.starts_at)}</span>}
          </div>
          <h3 id={'novedad-' + a.id}>{a.title}</h3>
          {a.body && <p className="news-excerpt">{a.body}</p>}
          <button type="button" className="button outline news-more" onClick={() => setOpen(a)}>
            Leer más<span className="sr-only"> sobre «{a.title}»</span></button>
        </article>;
      })}
    </div>
    {open && <NewsDialog item={open} onClose={() => setOpen(null)}/>}
  </ClientPage>;
}

export function HowItWorksPage({navigate, onTour}) {
  return <ClientPage id="como-funciona" icon="book" tone="blue" title="Cómo funciona" intro="Pide un técnico en cuatro pasos.">
    <ol className="how-steps">
      {HOW_IT_WORKS.map((step, index) => <li key={step.title} className="cx-rise" style={rise(index)}>
        <span className="how-illustration" data-step={index + 1} aria-hidden="true"><Icon name={step.icon}/></span>
        <div><p className="kicker">Paso {index + 1}</p><h3>{step.title}</h3><p>{step.text}</p></div>
      </li>)}
    </ol>
    <div className="how-actions">
      <button type="button" className="button primary" onClick={() => navigate('new')}>Hacer mi primera solicitud</button>
      {onTour && <button type="button" className="button outline" onClick={onTour}>Ver el tutorial otra vez</button>}
    </div>
  </ClientPage>;
}

const normalize = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Una pregunta del acordeón: botón con aria-expanded, chevron que gira y respuesta con animación suave. */
function FaqItem({question, answer, icon, index}) {
  const [open, setOpen] = useState(false);
  const id = useId().replaceAll(':', '');
  return <div className={'faq-item cx-rise' + (open ? ' is-open' : '')} style={rise(index)}>
    <h3 className="faq-question">
      <button type="button" aria-expanded={open} aria-controls={`faq-${id}`} onClick={() => setOpen(!open)}>
        <span className="cx-dot" data-tone="teal" aria-hidden="true"><Icon name={icon}/></span>
        <span className="faq-text">{question}</span>
        <span className="faq-chevron" aria-hidden="true"><Icon name="chevron"/></span>
      </button>
    </h3>
    <div id={`faq-${id}`} className="faq-answer" role="region" aria-label={question} hidden={!open}>
      <div><p>{answer}</p></div>
    </div>
  </div>;
}

export function FaqPage({navigate = null}) {
  const [query, setQuery] = useState('');
  const found = useMemo(() => {
    const words = normalize(query.trim()).split(/\s+/).filter(Boolean);
    return FAQ.filter(([question, answer]) => words.every(word => normalize(`${question} ${answer}`).includes(word)));
  }, [query]);
  return <ClientPage id="preguntas" icon="help" tone="teal" title="Preguntas frecuentes" intro="Respuestas rápidas sobre pedidos, pagos, técnicos y tus datos.">
    <div className="form-field faq-search">
      <label htmlFor="faq-buscar">Buscar una pregunta</label>
      <input id="faq-buscar" type="search" value={query} maxLength={80} placeholder="Ej.: cancelar, dirección, costo" onChange={e => setQuery(e.target.value)}/>
    </div>
    <output className="sr-only">{query ? `${found.length} ${found.length === 1 ? 'pregunta encontrada' : 'preguntas encontradas'}` : ''}</output>
    <div className="faq-list">
      {found.map(([question, answer, icon], index) => <FaqItem key={question} question={question} answer={answer} icon={icon || 'help'} index={index}/>)}
    </div>
    {!found.length && <EmptyState icon="search" tone="slate" title={`No encontramos «${query.trim()}»`} text="Prueba con otra palabra, por ejemplo «cancelar» o «pago».">
      <button type="button" className="button outline" onClick={() => setQuery('')}>Ver todas las preguntas</button>
    </EmptyState>}
    <aside className="faq-more" data-tone="blue" aria-labelledby="faq-mas">
      <span className="cx-dot is-large" aria-hidden="true"><Icon name="chat"/></span>
      <div>
        <h3 id="faq-mas">¿No encontraste tu respuesta?</h3>
        <p className="muted">Revisa la guía paso a paso o, pronto, cuéntanos tu problema directamente.</p>
      </div>
      <div className="faq-more-actions">
        {navigate && <button type="button" className="button primary" onClick={() => navigate('how')}>Cómo funciona</button>}
        <button type="button" className="button outline" disabled aria-describedby="faq-reportar">Reportar un problema</button>
        <small id="faq-reportar" className="muted">Próximamente</small>
      </div>
    </aside>
  </ClientPage>;
}

const privacyId = title => 'privacidad-' + normalize(title).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Privacidad y términos: documento legible con índice (lateral o arriba en el celular), íconos y ancho de lectura. */
export function PrivacyPage() {
  function jump(event, id) {
    event.preventDefault();
    const target = document.getElementById(id);
    target?.scrollIntoView({block: 'start'});
    target?.focus({preventScroll: true});
  }
  return <ClientPage id="privacidad" icon="lock" tone="slate" title="Privacidad y términos" intro="Cómo cuidamos tus datos personales (Ley N.° 29733).">
    <p className="notice privacy-draft" role="note">
      <Icon name="info"/> <span>Borrador para revisión del equipo: este texto todavía no es la versión final.</span>
    </p>
    <div className="privacy-layout">
      <nav className="privacy-toc" aria-label="Índice de privacidad y términos">
        <p className="kicker">Contenido</p>
        <ol>{PRIVACY.map(([title]) => <li key={title}><a href={'#' + privacyId(title)} onClick={event => jump(event, privacyId(title))}>{title}</a></li>)}</ol>
      </nav>
      <article className="privacy-doc">
        <p className="muted privacy-version"><Icon name="calendar"/> Versión del <time dateTime={PRIVACY_VERSION}>{shortDate(PRIVACY_VERSION + 'T12:00:00-05:00')}</time> · borrador</p>
        {PRIVACY.map(([title, text, icon]) => <section key={title} className="privacy-block" aria-labelledby={privacyId(title)}>
          <h3 id={privacyId(title)} tabIndex={-1}><span className="cx-dot" data-tone="slate" aria-hidden="true"><Icon name={icon || 'verify'}/></span>{title}</h3>
          <p>{text}</p>
        </section>)}
      </article>
    </div>
  </ClientPage>;
}
