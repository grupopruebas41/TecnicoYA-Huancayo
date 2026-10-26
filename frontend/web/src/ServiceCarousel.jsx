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

function ProductImage({ src, alt, className = "", width = "720", height = "480", loading = "lazy" }) {
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={loading}
      width={width}
      height={height}
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = "/media/landing/tecnico-taller.webp";
      }}
    />
  );
}

function MiniCarousel({ items, specialty, carouselItems, reduced, initialIndex = 0 }) {
  const root = useRef(null);
  const previousSpecialty = useRef(specialty?.id);
  const dragStart = useRef(null);
  const suppressClick = useRef(false);
  const [displayItems, setDisplayItems] = useState(items);
  const [shufflePhase, setShufflePhase] = useState("");
  const [index, setIndex] = useState(initialIndex);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glowX: 50, glowY: 50 });
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 900px)").matches);
  const canRotate = usePausedCarousel(root, reduced, focused || hovered || Boolean(shufflePhase));
  const visibleItems = displayItems;
  const size = visibleItems.length;
  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    let replaceTimer;
    let finishTimer;
    const firstDifferent = Math.min(initialIndex, Math.max(0, items.length - 1));
    if (previousSpecialty.current === specialty?.id) {
      setDisplayItems(items);
      setIndex(firstDifferent);
      if (reduced) setShufflePhase("");
      return undefined;
    }
    previousSpecialty.current = specialty?.id;
    if (reduced) {
      setDisplayItems(items);
      setIndex(firstDifferent);
      setShufflePhase("");
      return undefined;
    }
    setShufflePhase("out");
    replaceTimer = window.setTimeout(() => {
      setDisplayItems(items);
      setIndex(firstDifferent);
      setShufflePhase("in");
      finishTimer = window.setTimeout(() => setShufflePhase(""), 520);
    }, 380);
    return () => {
      window.clearTimeout(replaceTimer);
      window.clearTimeout(finishTimer);
    };
  }, [specialty?.id, items, initialIndex, reduced]);
  useEffect(() => {
    if (!canRotate || size < 2) return undefined;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % size), 3000);
    return () => window.clearInterval(timer);
  }, [canRotate, size, index]);
  const move = (offset) => {
    if (size < 2) return;
    setIndex((value) => (value + offset + size) % size);
    setTilt({ x: 0, y: 0, glowX: 50, glowY: 50 });
  };
  const select = (next) => {
    if (size < 2) return;
    setIndex((next + size) % size);
    setTilt({ x: 0, y: 0, glowX: 50, glowY: 50 });
  };
  const itemImage = (item) => getSubcategoryImage(item, carouselItems, slugify(specialty?.name));
  const visibleCount = Math.min(size, mobile ? 3 : 5);
  const offsets = visibleCount < 1 ? [] : visibleCount === 2
    ? [0, 1]
    : Array.from({ length: visibleCount }, (_, position) => position - Math.floor(visibleCount / 2));
  const visibleCards = offsets.map((offset) => ({
    offset,
    itemIndex: (index + offset + size) % size,
  }));
  const nextImage = size > 1 ? itemImage(items[(index + 1) % size]) : "";
  useEffect(() => {
    if (!nextImage) return undefined;
    const image = new Image();
    image.src = nextImage;
    return () => { image.src = ""; };
  }, [nextImage]);
  const tiltCard = (event) => {
    if (reduced || mobile) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    setTilt({ x: (0.5 - y) * 16, y: (x - 0.5) * 16, glowX: x * 100, glowY: y * 100 });
  };
  const cardStyle = (offset) => {
    const distance = Math.abs(offset);
    return {
      "--card-offset": offset,
      "--card-x": `${offset * 42}%`,
      "--card-z": distance === 0 ? "70px" : distance === 1 ? "-45px" : "-150px",
      "--card-rotate": `${offset === 0 ? 0 : offset < 0 ? 25 + (distance - 1) * 15 : -25 - (distance - 1) * 15}deg`,
      "--card-scale": distance === 0 ? 1 : distance === 1 ? 0.88 : 0.76,
      "--card-opacity": distance === 0 ? 1 : distance === 1 ? 0.75 : 0.4,
      "--card-blur": `${distance === 0 ? 0 : distance === 1 ? 2 : 4}px`,
      "--tilt-x": `${offset === 0 ? tilt.x : 0}deg`,
      "--tilt-y": `${offset === 0 ? tilt.y : 0}deg`,
      "--glow-x": `${tilt.glowX}%`,
      "--glow-y": `${tilt.glowY}%`,
      "--card-depth": distance === 0 ? 5 : 5 - distance,
      "--shuffle-delay": `${distance * 55}ms`,
    };
  };
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
      onPointerDown={(event) => { dragStart.current = event.clientX; }}
      onPointerUp={(event) => {
        if (dragStart.current === null) return;
        const delta = event.clientX - dragStart.current;
        dragStart.current = null;
        if (Math.abs(delta) > 45) { suppressClick.current = true; move(delta < 0 ? 1 : -1); }
      }}
      onClickCapture={(event) => {
        if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
      }}
    >
      <div className="ty-product-heading">
        <p className="ty-product-kicker"><span aria-hidden="true" /><span>SUBESPECIALIDADES</span><span aria-hidden="true" /></p>
        {visibleItems[index] && <h3 className="ty-product-title" key={visibleItems[index].id || visibleItems[index].subcategory_id} aria-live="polite">{visibleItems[index].name}</h3>}
      </div>
      <div className={`ty-product-stage subcategory-deck${reduced ? " is-reduced" : ""}${shufflePhase ? ` is-shuffling-${shufflePhase}` : ""}`} style={{ height: mobile ? "360px" : "380px" }} aria-live="polite">
        {visibleCards.map(({ itemIndex, offset }) => {
          const item = visibleItems[itemIndex];
          const distance = Math.abs(offset);
          const current = offset === 0;
          return (
            <article
              key={item.id || item.subcategory_id}
              className={`ty-product-card subcategory-card ${current ? "is-center current" : `is-side ${offset < 0 ? "is-previous" : "is-next"}`} distance-${distance}`}
              style={cardStyle(offset)}
              role={current ? "group" : "button"}
              tabIndex={0}
              aria-label={current ? `${item.name}, activa` : `Mostrar ${item.name}`}
              aria-current={current ? "true" : undefined}
              onPointerMove={current ? tiltCard : undefined}
              onPointerLeave={current ? () => setTilt({ x: 0, y: 0, glowX: 50, glowY: 50 }) : undefined}
              onKeyDown={(event) => {
                if (!current && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  select(itemIndex);
                }
              }}
              onClick={() => { if (!current) select(itemIndex); }}
            >
              <ProductImage src={itemImage(item)} alt={`${item.name} — ${specialty?.name}`} width="720" height="960" loading={distance <= 1 ? "eager" : "lazy"} />
              <span className="ty-product-glare" aria-hidden="true" />
              <span className="ty-product-number">{String(itemIndex + 1).padStart(2, "0")} / {String(size).padStart(2, "0")}</span>
              <div className="ty-product-caption subcategory-caption">
                <h3>{item.name}</h3>
                {item.reference_fee != null && <p className="ty-product-fee">Desde S/ {Number(item.reference_fee).toFixed(2)}</p>}
              </div>
            </article>
          );
        })}
      </div>
      <div className="ty-product-progress" aria-hidden="true"><span key={index} className={canRotate ? "is-running" : ""} /></div>
      <div className="ty-product-controls">
        <button type="button" aria-label="Subcategoría anterior" disabled={size < 2} onClick={() => move(-1)}>‹</button>
        <div className="ty-product-thumbnails" role="group" aria-label="Elegir subespecialidad">
          {visibleItems.map((item, i) => (
            <button key={item.id || item.subcategory_id} type="button" data-thumb-index={i} aria-label={`Ver subespecialidad ${item.name}`} aria-current={i === index ? "true" : undefined} onClick={() => select(i)}>
              <img src={itemImage(item)} alt="" loading="lazy" width="56" height="72" />
            </button>
          ))}
        </div>
        <span>{size ? `${index + 1} / ${size}` : "0 / 0"}</span>
        <button type="button" aria-label="Subcategoría siguiente" disabled={size < 2} onClick={() => move(1)}>›</button>
      </div>
    </div>
  );
}

function SpecialtyShowcase({ specialty, index, total, items, carouselItems, reduced }) {
  const specialtySlug = slugify(specialty.name);
  const images = items.map((item) => getSubcategoryImage(item, carouselItems, specialtySlug));
  const categoryImage = specialtyImages[serviceCategory(specialty.name)] || "/media/landing/tecnico-taller.webp";
  const image = specialty.image_url && !images.includes(specialty.image_url) ? specialty.image_url : categoryImage;
  const initialIndex = Math.max(0, images.findIndex((source) => source !== image));
  const fee = specialty.reference_fee;
  return (
      <div className="ty-vitrine-layout">
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
        <MiniCarousel items={items} specialty={specialty} carouselItems={carouselItems} reduced={reduced} initialIndex={initialIndex} />
      ) : (
        <p className="service-empty" role="status">Aún no hay subespecialidades activas para esta especialidad.</p>
      )}
    </div>
  );
}

export default function ServiceCarousel() {
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
      className="service-carousel ty-vitrine ty-frame"
      aria-label="Especialidades de TécnicoYa"
      ref={root}
      onMouseEnter={() => { setHovered(true); setPaused(true); }}
      onMouseLeave={() => { setHovered(false); setPaused(false); }}
      onFocusCapture={() => { setFocused(true); setPaused(true); }}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { setFocused(false); setPaused(false); } }}
      onKeyDown={(event) => {
        if (event.defaultPrevented) return;
        if (event.key === "ArrowRight") { event.preventDefault(); change(1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); change(-1); }
      }}
    >
      <div className="service-carousel-heading">
        <div><span className="ty-eyebrow">ESPECIALISTAS EN CADA DETALLE</span><h2>¿Qué necesitas <em>resolver?</em></h2></div>
        <span>Soluciones locales para tu hogar y negocio.</span>
      </div>
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
      {(specialties || []).map((item) => {
        // Misma fuente que la vitrina: foto del API o la local por slug.
        const image = item.image_url || specialtyImages[serviceCategory(item.name)];
        return (
        <article className="ty-specialty-card" key={item.id}>
          <div className="ty-specialty-photo">
            {image ? (
              <img src={image} alt={item.name} loading="lazy" />
            ) : (
              <span aria-hidden="true">◇</span>
            )}
          </div>
          <div className="ty-specialty-copy">
            <h3>{item.name}</h3>
            {!image && <small>Imagen no disponible</small>}
            {item.description && <p>{item.description}</p>}
            <button
              type="button"
              className="ty-specialty-link"
              onClick={() => onSelect(item.id)}
              aria-label={"Explorar " + item.name}
            >
              Explorar servicios <span aria-hidden="true">→</span>
            </button>
            <ul className="ty-subcategory-list">
              {(details[item.id] || []).map((sub) => (
                <li key={sub.id}>{sub.name}</li>
              ))}
            </ul>
          </div>
        </article>
        );
      })}
    </div>
  );
}
