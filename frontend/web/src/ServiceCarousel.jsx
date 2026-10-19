import React, { useEffect, useRef, useState } from "react";
import { request } from "./features/administration/http";
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
            {item.image_url && <img src={item.image_url} alt="" />}
            <div className="subcategory-caption">
              <h4>{item.name || item.title}</h4>
              <p>{item.description || item.body}</p>
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
export default function ServiceCarousel() {
  const [items, setItems] = useState(null),
    [specialties, setSpecialties] = useState(null),
    [error, setError] = useState(""),
    [active, setActive] = useState(null);
  async function load() {
    try {
      const [catalog, carousel] = await Promise.all([request("/catalog/specialties"), request("/catalog/carousel")]);
      const activeSpecialties = catalog.data.filter(item => item.active !== false);
      setSpecialties(activeSpecialties);
      setItems(carousel.data);
      setActive(current => activeSpecialties.some(item => item.id === current) ? current : activeSpecialties[0]?.id);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  const specialty = specialties?.find(item => item.id === active);
  const selected = (items || []).filter((x) => x.specialty_id === active);
  return (
    <section
      id="servicios"
      data-landing="Especialidades"
      className="service-carousel"
      aria-label="Especialidades de TécnicoYa"
    >
      <h2>Especialidades</h2>
      {error && (
        <>
          <p role="alert">{error}</p>
          <button type="button" onClick={load}>
            Reintentar catálogo
          </button>
        </>
      )}
      {items === null && !error && <output>Cargando especialidades…</output>}
      {specialties?.length === 0 && (
        <p>No hay especialidades activas disponibles.</p>
      )}
      <nav className="service-tabs" aria-label="Seleccionar especialidad">
        {(specialties || []).map(({id, name}) => (
          <button
            type="button"
            key={id}
            aria-pressed={active === id}
            onClick={() => setActive(id)}
          >
            {name}
          </button>
        ))}
      </nav>
      {specialty && (
        <div className="service-split">
          <div className="service-main">
            <h3 className="service-category-heading">
              {specialty.name}
            </h3>
            <div className="service-main-photo">
              {specialty.image_url ? <img src={specialty.image_url} alt={specialty.name} /> : <p className="service-photo-empty">Imagen de la especialidad no disponible.</p>}
            </div>
            <p>{specialty.description}</p>
            <a className="button primary" href="#cuenta">
              Encontrar un técnico ↗
            </a>
          </div>
          {selected.length ? <CarouselDeck
            key={active}
            items={selected}
            label="¿Qué necesitas resolver?"
          /> : <p className="service-empty" role="status">No hay subcategorías con imágenes publicadas para esta especialidad.</p>}
        </div>
      )}
    </section>
  );
}
