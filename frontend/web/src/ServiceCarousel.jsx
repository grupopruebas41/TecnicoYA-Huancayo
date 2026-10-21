import React, { useEffect, useRef, useState } from "react";
import { request } from "./features/administration/http";
import { AuthLink } from "./landing/Shared";
import { getSubcategoryImage, serviceCategory, slugify, specialtyImages } from "./service-media";
import "./service-carousel.css";
export function CarouselDeck({ items, label = "Servicios" }) {
  const root = useRef(null);
  const [index, setIndex] = useState(0),
    [paused, setPaused] = useState(false),
    [focus, setFocus] = useState(false),
    [hover, setHover] = useState(false),
    [visible, setVisible] = useState(false),
    [hidden, setHidden] = useState(document.hidden),
    [reduced, setReduced] = useState(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(media.matches),
      visibility = () => setHidden(document.hidden);
    const observer = new IntersectionObserver(([e]) =>
      setVisible(e.isIntersecting),
    );
    observer.observe(root.current);
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    if (
      items.length < 2 ||
      paused ||
      focus ||
      hover ||
      !visible ||
      hidden ||
      reduced
    )
      return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 2500);
    return () => clearInterval(id);
  }, [items.length, paused, focus, hover, visible, hidden, reduced]);
  const move = (n) => {
    setPaused(true);
    setIndex((i) => (i + n + items.length) % items.length);
  };
  return (
    <div
      className="subcategory-deck"
      ref={root}
      onFocusCapture={() => setFocus(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocus(false);
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          move(1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          move(-1);
        }
      }}
    >
      <h3>{label}</h3>
      <div
        className="deck-stage"
        aria-roledescription="carrusel"
        aria-label={label}
      >
        {items.map((item, i) => (
          <article
            className={"subcategory-card " + (i === index ? "current" : "away")}
            key={item.subcategory_id || item.id}
            aria-hidden={i !== index}
          >
            {item.image_url && (
              <img src={item.image_url} alt={item.name || item.title} />
            )}
            <div className="subcategory-caption">
              <h4>{item.name || item.title}</h4>
              <p>{item.description || item.body}</p>
              {item.reference_fee != null && (
                <p>
                  desde S/ {Number(item.reference_fee).toFixed(2)}, referencial
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
      <div className="deck-controls">
        <button
          type="button"
          disabled={items.length < 2}
          aria-label="Subcategoría anterior"
          onClick={() => move(-1)}
        >
          ←
        </button>
        <span>
          {index + 1} / {items.length}
        </span>
        <button
          type="button"
          disabled={items.length < 2}
          aria-label="Subcategoría siguiente"
          onClick={() => move(1)}
        >
          →
        </button>
        <button
          type="button"
          disabled={reduced}
          onClick={() => setPaused(!paused)}
        >
          {reduced ? "Sin animación" : paused ? "Reanudar" : "Pausar"}
        </button>
      </div>
    </div>
  );
}
const rows = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

function useMotionPreference() {
  const [reduced, setReduced] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

function usePausedCarousel(root, reduced, paused) {
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  useEffect(() => {
    if (!root.current) return undefined;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    observer.observe(root.current);
    const visibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [root]);
  return !reduced && !paused && visible && !hidden;
}

function ProductImage({ src, alt, className = "" }) {
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      width="720"
      height="480"
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = "/media/landing/tecnico-taller.webp";
      }}
    />
  );
}

function MiniCarousel({ items, specialty, carouselItems, reduced }) {
  const root = useRef(null);
  const [index, setIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [touchX, setTouchX] = useState(null);
  const canRotate = usePausedCarousel(root, reduced, focused || hovered);
  const size = items.length;
  useEffect(() => setIndex(0), [specialty?.id, size]);
  useEffect(() => {
    if (!canRotate || size < 2) return undefined;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % size), 3000);
    return () => window.clearInterval(timer);
  }, [canRotate, size]);
  const move = (offset) => setIndex((value) => (value + offset + size) % size);
  const select = (next) => setIndex(next);
  const ordered = size > 1
    ? [index, (index + 1) % size, (index - 1 + size) % size]
    : size ? [index] : [];
  const unique = [...new Set(ordered)];
  const cardClass = (position, itemIndex) => position === 0 ? "is-center" : `is-side ${itemIndex === (index + 1) % size ? "is-next" : "is-previous"}`;
  const itemImage = (item) => getSubcategoryImage(item, carouselItems, slugify(specialty?.name));
  return (
    <div
      className="ty-product-carousel"
      ref={root}
      role="group"
      tabIndex={0}
      aria-roledescription="carrusel"
      aria-label={`Subespecialidades de ${specialty?.name || "la especialidad"}`}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={(event) => setTouchX(event.changedTouches[0].clientX)}
      onTouchEnd={(event) => {
        if (touchX === null) return;
        const delta = event.changedTouches[0].clientX - touchX;
        if (Math.abs(delta) > 35) move(delta < 0 ? 1 : -1);
        setTouchX(null);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
      }}
    >
      <div className="ty-product-stage subcategory-deck" aria-live="polite">
        {unique.map((itemIndex, position) => {
          const item = items[itemIndex];
          return (
            <article
              key={item.id || item.subcategory_id}
              className={`ty-product-card subcategory-card ${cardClass(position, itemIndex)} ${position === 0 ? "current" : ""}`}
              role={position === 0 ? "group" : "button"}
              tabIndex={position === 0 ? undefined : 0}
              aria-label={position === 0 ? undefined : `Mostrar ${item.name}`}
              onKeyDown={(event) => {
                if (position !== 0 && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  select(itemIndex);
                }
              }}
              onClick={() => select(itemIndex)}
            >
              <ProductImage src={itemImage(item)} alt={`${item.name} — ${specialty?.name}`} />
              <div className="ty-product-caption subcategory-caption">
                <h3>{item.name}</h3>
                <h4 className="ty-legacy-heading" aria-hidden="true">{item.name}</h4>
              </div>
            </article>
          );
        })}
      </div>
      <h3 className="ty-product-legend">Subespecialidades disponibles</h3>
      <div className="ty-product-controls">
        <button type="button" aria-label="Subcategoría anterior" disabled={size < 2} onClick={() => move(-1)}>‹</button>
        <div className="ty-product-dots" aria-label={`Subcategoría ${index + 1} de ${size}`}>
          {items.map((item, i) => (
            <button key={item.id || item.subcategory_id} type="button" aria-label={`Mostrar ${item.name}`} aria-current={i === index ? "true" : undefined} onClick={() => select(i)} />
          ))}
        </div>
        <span>{size ? `${index + 1} / ${size}` : "0 / 0"}</span>
        <button type="button" aria-label="Subcategoría siguiente" disabled={size < 2} onClick={() => move(1)}>›</button>
      </div>
    </div>
  );
}

function SpecialtyShowcase({ specialty, index, total, items, carouselItems, reduced }) {
  const first = items[0];
  const image = specialty.image_url || (first && getSubcategoryImage(first, carouselItems, slugify(specialty.name))) || specialtyImages[serviceCategory(specialty.name)] || "/media/landing/tecnico-taller.webp";
  const fee = specialty.reference_fee;
  return (
    <div className="ty-vitrine-layout" key={specialty.id}>
      <div className="ty-vitrine-main" aria-live="polite">
        <div className="service-main-photo">
          <ProductImage src={image} alt={`Servicio de ${specialty.name}`} />
          <span className="ty-vitrine-index">{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
        </div>
        <div className="ty-slide-copy service-slide-copy">
          <span className="ty-eyebrow">ESPECIALIDAD VERIFICADA</span>
          <h3>{specialty.name}</h3>
          <p>{specialty.description || `Encuentra especialistas independientes en ${specialty.name.toLowerCase()} para tu hogar o negocio.`}</p>
          {fee !== null && fee !== undefined && <p className="ty-reference-fee">Desde S/ {Number(fee).toFixed(2)} <small>referencial</small></p>}
          <AuthLink className="ty-button ty-vitrine-cta">Ver técnicos de {specialty.name} <span aria-hidden="true">↗</span></AuthLink>
        </div>
      </div>
      {items.length ? (
        <MiniCarousel items={items} specialty={specialty} carouselItems={carouselItems} reduced={reduced} />
      ) : (
        <p className="service-empty" role="status">Aún no hay subespecialidades activas para esta especialidad.</p>
      )}
    </div>
  );
}

export default function ServiceCarousel({ catalog }) {
  const root = useRef(null);
  const [specialties, setSpecialties] = useState(null);
  const [details, setDetails] = useState({});
  const [carouselItems, setCarouselItems] = useState([]);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const reduced = useMotionPreference();
  const running = usePausedCarousel(root, reduced, paused || focused || hovered);
  async function load() {
    setError("");
    setSpecialties(null);
    try {
      const catalog = await request("/catalog/specialties");
      const active = rows(catalog).filter((item) => item.active !== false);
      setSpecialties(active);
      if (!active.length) return;
      const [subResponses, mediaResponse] = await Promise.all([
        Promise.all(active.map((item) => request(`/catalog/subcategories?specialty_id=${encodeURIComponent(item.id)}`))),
        request("/catalog/carousel").catch(() => ({ data: [] })),
      ]);
      setDetails(Object.fromEntries(active.map((item, i) => [item.id, rows(subResponses[i])] )));
      setCarouselItems(rows(mediaResponse));
      setActiveIndex((current) => Math.min(current, active.length - 1));
    } catch (cause) {
      setError(cause.message || "No pudimos cargar las especialidades.");
      setSpecialties([]);
    }
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!running || !specialties?.length || specialties.length < 2) return undefined;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % specialties.length), 9000);
    return () => window.clearInterval(timer);
  }, [running, specialties]);
  const change = (offset) => {
    if (!specialties?.length) return;
    setActiveIndex((current) => (current + offset + specialties.length) % specialties.length);
  };
  const setActive = (index) => setActiveIndex(index);
  const active = specialties?.[activeIndex];
  const selectedItems = active ? details[active.id] || [] : [];
  return (
    <section
      id="servicios"
      data-landing="Especialidades"
      className="service-carousel ty-vitrine"
      aria-label="Especialidades de TécnicoYa"
      ref={root}
      onMouseEnter={() => { setHovered(true); setPaused(true); }}
      onMouseLeave={() => { setHovered(false); setPaused(false); }}
      onFocusCapture={() => { setFocused(true); setPaused(true); }}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { setFocused(false); setPaused(false); } }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") { event.preventDefault(); change(1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); change(-1); }
      }}
    >
      <div className="service-carousel-heading">
        <div><span className="ty-eyebrow">ESPECIALISTAS EN CADA DETALLE</span><h2>¿Qué necesitas <em>resolver?</em></h2></div>
        <span>Soluciones locales para tu hogar y negocio.</span>
      </div>
      {catalog?.data && <div className="ty-stats" aria-label="Resumen del catálogo">
        <span><strong aria-label="Especialidades activas">{catalog.data.specialties.length}</strong> especialidades</span>
        <span><strong aria-label="Subcategorías activas">{catalog.data.subcategories.length}</strong> subespecialidades</span>
        <span><strong aria-label="Distritos activos">{catalog.data.districts.length}</strong> distritos</span>
      </div>}
      {specialties === null ? (
        <div className="ty-vitrine-skeleton" aria-label="Cargando especialidades"><span /><span /><span /></div>
      ) : error ? (
        <div className="ty-vitrine-error"><p role="alert">{error}</p><button type="button" onClick={load}>Reintentar</button></div>
      ) : specialties.length === 0 ? (
        <p className="service-empty" role="status">No hay especialidades activas disponibles.</p>
      ) : (
        <>
          <nav className="ty-specialty-nav" aria-label="Seleccionar especialidad">
            <button type="button" aria-label="Especialidad anterior" onClick={() => change(-1)}>‹</button>
            <div className="ty-specialty-chips">
              {specialties.map((item, index) => <button type="button" key={item.id} aria-pressed={activeIndex === index} onClick={() => setActive(index)}>{item.name}</button>)}
            </div>
            <button type="button" aria-label="Siguiente especialidad" onClick={() => change(1)}>›</button>
          </nav>
          <div className={`ty-specialty-progress ${reduced ? "is-static" : ""}`} aria-hidden="true"><span key={active?.id} style={{ animationPlayState: running ? "running" : "paused" }} /></div>
          {active && <SpecialtyShowcase specialty={active} index={activeIndex} total={specialties.length} items={selectedItems} carouselItems={carouselItems} reduced={reduced} />}
        </>
      )}
    </section>
  );
}

export function SpecialtyCards({ specialties, details = {}, onSelect }) {
  return (
    <div className="ty-specialty-cards">
      {(specialties || []).map((item) => (
        <article className="ty-specialty-card" key={item.id}>
          <div className="ty-specialty-photo">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} loading="lazy" />
            ) : (
              <span aria-hidden="true">◇</span>
            )}
          </div>
          <div className="ty-specialty-copy">
            <h3>{item.name}</h3>
            {!item.image_url && (
              <small>Imagen de la especialidad no disponible.</small>
            )}
            <p>{item.description}</p>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              aria-label={"Explorar " + item.name}
            >
              Explorar servicios →
            </button>
            <ul className="ty-subcategory-list">
              {(details[item.id] || []).map((sub) => (
                <li key={sub.id}>{sub.name}</li>
              ))}
            </ul>
          </div>
        </article>
      ))}
    </div>
  );
}
