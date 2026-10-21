import React, { useEffect, useRef, useState } from "react";
import { CONTACT } from "./config";
import { navigateToSection, scrollToSection } from "./navigation";
import { Zones } from "./Shared";
import { SpecialtyCards } from "../ServiceCarousel";
const testimonials = [
  {
    id: 1,
    name: "Rosa · Huancayo · Refrigeración",
    description:
      "«Me gustaría comparar opciones y saber quién atenderá mi negocio.»",
    image_url: "/media/nosotros/ejemplo-bodega.webp",
  },
  {
    id: 2,
    name: "Mateo · El Tambo · Cómputo",
    description:
      "«Busco ayuda para mi laptop sin perder tiempo entre recomendaciones.»",
    image_url: "/media/nosotros/ejemplo-estudiante.webp",
  },
  {
    id: 3,
    name: "Luis · Chilca · Electricidad",
    description:
      "«Quiero coordinar el mantenimiento de mi local con información clara.»",
    image_url: "/media/nosotros/ejemplo-restaurante.webp",
  },
].map((x) => ({
  ...x,
  description: "★★★★★ · Valoración ficticia. " + x.description,
}));
function Contact() {
  const [message, setMessage] = useState(""),
    [error, setError] = useState("");
  function prepare(e) {
    e.preventDefault();
    if (!message.trim()) {
      setError("Escribe un mensaje antes de abrir el correo.");
      e.currentTarget.elements.message.focus();
      return;
    }
    if (!CONTACT.configured) {
      setError(
        "El contacto aún no está configurado. Estos datos son de ejemplo; no se ha enviado ningún mensaje.",
      );
      return;
    }
    window.location.href =
      "mailto:" +
      CONTACT.email +
      "?subject=" +
      encodeURIComponent("Consulta TécnicoYa") +
      "&body=" +
      encodeURIComponent(message);
    setError(
      "Se solicitó abrir tu aplicación de correo. Debes enviar el mensaje desde allí.",
    );
  }
  return (
    <section
      id="contacto"
      data-about="Contacto"
      className="ty-section ty-split"
    >
      <div>
        <span className="ty-eyebrow">CONVERSEMOS</span>
        <h2>
          Estamos <em>cerca.</em>
        </h2>
        <p>Datos de ejemplo por reemplazar antes de publicar.</p>
        <p>
          WhatsApp: {CONTACT.whatsapp}
          <br />
          Correo: {CONTACT.email}
        </p>
        <p>{CONTACT.hours}</p>
      </div>
      <form className="ty-contact" onSubmit={prepare} noValidate>
        <label htmlFor="contact-message">Tu mensaje</label>
        <textarea
          id="contact-message"
          name="message"
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-describedby="contact-help"
        />
        <p id="contact-help">
          Se abrirá tu aplicación de correo. Este formulario no envía ni guarda
          mensajes.
        </p>
        {error && <p role="alert">{error}</p>}
        <button type="submit" className="ty-button">
          Preparar correo
        </button>
      </form>
    </section>
  );
}
function Matching() {
  return (
    <section data-about="Matching" className="ty-section" data-reveal>
      <span className="ty-eyebrow">RECOMENDACIONES CON CRITERIO</span>
      <h2>
        La persona indicada, <em>para tu necesidad.</em>
      </h2>
      <p>
        Combinamos cercanía, historial, tarifa y experiencia entre técnicos
        elegibles.
      </p>
      <div className="ty-matching">
        {[
          ["Cercanía", 35],
          ["Historial", 30],
          ["Tarifa", 20],
          ["Experiencia", 15],
        ].map(([label, n]) => (
          <div key={label} style={{ "--weight": n }}>
            <strong>{n}%</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <small>
        Valores de referencia del MVP. Los pesos son editables por
        administración; esta página no consulta la configuración vigente del
        motor.
      </small>
    </section>
  );
}
export default function About({ catalog }) {
  const [activeSection, setActiveSection] = useState("quienes"),
    [floating, setFloating] = useState(false);
  useEffect(() => {
    const sectionIds = ["quienes", "verificacion", "seguridad", "testimonios", "equipo", "contacto"];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
    const root = document.querySelector(".about-page");
    if (typeof IntersectionObserver === "undefined") return undefined;
    const activeObserver = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (current) setActiveSection(current.target.id);
      },
      { rootMargin: "-18% 0px -62% 0px", threshold: [0, 0.15, 0.4] },
    );
    sections.forEach((section) => activeObserver.observe(section));
    const hero = document.querySelector(".ty-about-hero");
    const heroObserver = hero
      ? new IntersectionObserver(([entry]) => {
          setFloating(!entry.isIntersecting);
          root?.classList.toggle("about-has-scrolled", !entry.isIntersecting);
        }, { threshold: 0.15 })
      : null;
    if (hero) heroObserver.observe(hero);
    return () => {
      activeObserver.disconnect();
      heroObserver?.disconnect();
      root?.classList.remove("about-has-scrolled");
    };
  }, []);
  return (
    <>
      <nav className={"ty-about-nav " + (floating ? "is-floating" : "is-over-hero")} aria-label="Acerca de TécnicoYa">
        {[
          ["quienes", "Quiénes somos"],
          ["verificacion", "Cómo verificamos"],
          ["seguridad", "Tu seguridad"],
          ["testimonios", "Testimonios"],
          ["equipo", "Equipo"],
          ["contacto", "Contacto"],
        ].map(([id, name]) => (
          <a
            key={id}
            href={"#nosotros/" + id}
            aria-current={activeSection === id ? "location" : undefined}
            onClick={(event) => { event.preventDefault(); scrollToSection(id); }}
          >
            {name}
          </a>
        ))}
      </nav>
      <AboutCover />
      <OurPurpose />
      <Verification />
      <Matching />
      <Security />
      <TransparentFees />
      <ExampleStories />
      <Zones
        about
        districts={catalog.data?.districts}
        error={catalog.error}
        loading={!catalog.data && !catalog.error}
      />
      <div className="ty-about-specialties">
        <SpecialtyCards
          specialties={catalog.data?.specialties}
          details={Object.fromEntries(
            (catalog.data?.specialties || []).map((x) => [
              x.id,
              catalog.data.subcategories.filter(
                (sub) => sub.specialty_id === x.id,
              ),
            ]),
          )}
          onSelect={() => {
            navigateToSection("servicios");
          }}
        />
      </div>
      <Team />
      <Quality />
      <Contact />
    </>
  );
}

function AboutCover() {
  return (
    <section data-about="Portada" className="ty-about-hero" aria-labelledby="about-title">
      <img
        src="/media/nosotros/portada.webp"
        alt="Tres técnicos independientes caminando por una calle de Huancayo con sus maletines"
      />
      <div>
        <span className="ty-eyebrow ty-about-kicker">SOMOS TÉCNICOYA</span>
        <h1 id="about-title">
          <span>Conectamos talento técnico local</span>{" "}
          <em>con quien lo necesita.</em>
        </h1>
        <p>Unimos hogares y negocios de Huancayo con especialistas independientes y verificados para resolver sus necesidades con claridad.</p>
        <span className="ty-about-rule" aria-hidden="true" />
      </div>
    </section>
  );
}
function OurPurpose() {
  return (
    <section
      id="quienes"
      data-about="Quiénes somos"
      className="ty-section"
      data-reveal
    >
      <div className="ty-split">
        <div>
          <span className="ty-eyebrow">DE UNA NECESIDAD COMPARTIDA</span>
          <h2>
            Que encontrar ayuda <em>no sea otro problema.</em>
          </h2>
          <p>
            En Huancayo, buscar un técnico suele depender del boca a boca y
            mensajes dispersos, sin precios claros ni seguimiento.
          </p>
          <p>
            TécnicoYa reúne solicitudes, perfiles verificados, tarifas de
            referencia y el avance de la atención en un solo lugar.
          </p>
        </div>
        <figure>
          <img
            loading="lazy"
            src="/media/nosotros/antes-despues.webp"
            alt="Escena ilustrativa: una bodeguera preocupada por su congeladora y un técnico revisándola"
          />
          <figcaption>
            Escena ilustrativa generada, no un servicio documentado.
          </figcaption>
        </figure>
      </div>
      <PurposeMap />
    </section>
  );
}
const purposeStops = [
  ["Misión", "Conectar a hogares y MYPES con talento técnico local mediante información clara y atención trazable."],
  ["Visión", "Hacer más confiable y accesible la búsqueda de servicios técnicos en Huancayo."],
  ["Valores", "Confianza, transparencia y reconocimiento del talento local."],
];
function PurposeMap() {
  const [active, setActive] = useState(0);
  function handleKeys(event) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, purposeStops.length - 1));
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    }
  }
  const [title, description] = purposeStops[active];
  return (
    <div className="ty-purpose-map" role="region" aria-label="Nuestro propósito" tabIndex={0} onKeyDown={handleKeys}>
      <div className="ty-purpose-route" aria-hidden="true">
        <svg className="route-desktop" viewBox="0 0 900 220" preserveAspectRatio="none">
          <path className="route-base" d="M80 118 C210 15 330 15 450 118 S690 220 820 118" />
          <path className="route-progress" pathLength="100" style={{ strokeDashoffset: 100 - active * 50 }} d="M80 118 C210 15 330 15 450 118 S690 220 820 118" />
        </svg>
        <svg className="route-mobile" viewBox="0 0 100 400" preserveAspectRatio="none">
          <path className="route-base" d="M50 20 C90 90 10 110 50 200 S90 310 50 380" />
          <path className="route-progress" pathLength="100" style={{ strokeDashoffset: 100 - active * 50 }} d="M50 20 C90 90 10 110 50 200 S90 310 50 380" />
        </svg>
        <span className={"ty-route-marker stop-" + active}>✦</span>
      </div>
      <div className="ty-purpose-stops" role="group" aria-label="Puntos del propósito">
        {purposeStops.map(([stop], index) => (
          <button type="button" key={stop} className={index === active ? "is-active" : ""} aria-pressed={index === active} onClick={() => setActive(index)}>
            <span className="ty-stop-number">0{index + 1}</span>{stop}
          </button>
        ))}
      </div>
      <article className="ty-purpose-card" aria-live="polite" aria-atomic="true">
        <span className="ty-eyebrow">PUNTO {active + 1} DE 3</span>
        <h3>{title}</h3>
        <p>{description}</p>
        {title === "Valores" && (
          <ul className="ty-value-chips" aria-label="Valores de TécnicoYa">
            {["Confianza", "Transparencia", "Talento local"].map((value) => <li key={value}>{value}</li>)}
          </ul>
        )}
      </article>
      <div className="ty-purpose-controls">
        <button type="button" className="ty-button ty-outline" onClick={() => setActive((index) => Math.max(index - 1, 0))} disabled={active === 0}>Anterior</button>
        <span role="status">{active + 1} de {purposeStops.length}</span>
        <button type="button" className="ty-button" aria-label="Siguiente propósito" onClick={() => setActive((index) => Math.min(index + 1, purposeStops.length - 1))} disabled={active === purposeStops.length - 1}>Siguiente</button>
      </div>
    </div>
  );
}
function Verification() {
  return (
    <section
      id="verificacion"
      data-about="Verificación"
      className="ty-section ty-split"
      data-reveal
    >
      <img
        loading="lazy"
        src="/media/nosotros/verificacion.webp"
        alt="Administradora revisando documentos y una lista de verificación en su laptop"
      />
      <div>
        <span className="ty-eyebrow">PERSONAS, NO SOLO PERFILES</span>
        <h2>
          Así verificamos <em>a los técnicos.</em>
        </h2>
        <ol className="ty-checklist">
          <li>Registro y presentación de documentos.</li>
          <li>Revisión del administrador con una lista de comprobación.</li>
          <li>Aprobación o rechazo con motivo.</li>
          <li>
            Seguimiento de calificaciones y suspensión ante problemas
            verificados.
          </li>
        </ol>
        <p>El trabajo lo realiza el técnico independiente que tú eliges.</p>
      </div>
    </section>
  );
}
function Security() {
  return (
    <section
      id="seguridad"
      data-about="Seguridad"
      className="ty-section"
      data-reveal
    >
      <h2>
        Tu confianza merece <em>cuidado.</em>
      </h2>
      <div className="ty-grid ty-grid-four">
        {[
          [
            "Dirección protegida",
            "Solo se comparte con el técnico asignado para la atención.",
          ],
          [
            "Contacto en su momento",
            "El WhatsApp del técnico se habilita después de la asignación.",
          ],
          [
            "Evidencias privadas",
            "Las fotos de tu solicitud no forman parte del catálogo público.",
          ],
          [
            "Accesos y trazabilidad",
            "Contraseñas protegidas con hash y registro de acciones sensibles.",
          ],
        ].map(([t, p]) => (
          <article className="ty-card" key={t}>
            <span aria-hidden="true">◇</span>
            <h3>{t}</h3>
            <p>{p}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
function TransparentFees() {
  return (
    <section data-about="Tarifas" className="ty-section ty-trust" data-reveal>
      <h2>
        Tarifas claras.
        <br />
        <em>Decisiones informadas.</em>
      </h2>
      <p>
        El técnico declara su tarifa. Revisa una referencia antes de aceptar y
        acuerda repuestos y trabajos adicionales, sin cobros ocultos de la
        plataforma.
      </p>
      <strong>
        Pagos simulados en esta versión: no procesamos dinero real.
      </strong>
    </section>
  );
}
function ExampleStories() {
  return <TestimonialCoverflow />;
}
function TestimonialCoverflow() {
  const [index, setIndex] = useState(0),
    [paused, setPaused] = useState(false),
    [hovered, setHovered] = useState(false),
    [hidden, setHidden] = useState(() => document.hidden),
    [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const pointerStart = useRef(null),
    region = useRef(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    const updateVisibility = () => setHidden(document.hidden);
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);
  useEffect(() => {
    if (reduced || paused || hovered || hidden) return undefined;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % testimonials.length), 3000);
    return () => window.clearInterval(timer);
  }, [reduced, paused, hovered, hidden, index]);
  function move(offset) {
    setIndex((current) => (current + offset + testimonials.length) % testimonials.length);
  }
  function handlePointerUp(event) {
    if (pointerStart.current === null) return;
    const distance = event.clientX - pointerStart.current;
    if (Math.abs(distance) > 45) move(distance < 0 ? 1 : -1);
    pointerStart.current = null;
  }
  function handleKeys(event) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
  }
  const visibleItems = testimonials.map((item, itemIndex) => {
    const offset = (itemIndex - index + testimonials.length) % testimonials.length;
    const position = offset === testimonials.length - 1 ? -1 : offset;
    const positionClass = position === 0 ? "is-current" : Math.abs(position) === 1 ? `side-${position}` : "is-hidden";
    return { ...item, itemIndex, position, positionClass };
  });
  const selected = testimonials[index];
  const [name, district, specialty] = selected.name.split(" · ");
  const quote = selected.description.replace(/^★★★★★ · Valoración ficticia\. /, "").replace(/[«»]/g, "");
  return (
    <section id="testimonios" data-about="Testimonios" className="ty-section ty-testimonials" data-reveal aria-labelledby="testimonials-title">
      <span className="ty-eyebrow">LO QUE BUSCAMOS HACER POSIBLE</span>
      <h2 id="testimonials-title">Testimonios</h2>
      <p className="ty-testimonial-note">Historias ilustrativas con personajes ficticios.</p>
      <div className="ty-coverflow" ref={region} aria-roledescription="carrusel" tabIndex={0} onKeyDown={handleKeys}>
        <div className="ty-coverflow-stage" aria-live="off" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onPointerDown={(event) => { pointerStart.current = event.clientX; event.currentTarget.setPointerCapture?.(event.pointerId); }} onPointerUp={handlePointerUp} onPointerCancel={() => { pointerStart.current = null; }}>
          {visibleItems.map((item) => (
            <article key={item.id} className={"ty-coverflow-card " + item.positionClass} aria-hidden={item.position !== 0}>
              {item.position === 0 ? (
                <>
                  <img src={item.image_url} alt={`Escena ilustrativa de ${name}, ${specialty.toLowerCase()}`} draggable="false" />
                  <div className="ty-testimonial-copy">
                    <span className="ty-quote-mark" aria-hidden="true">“</span>
                    <p>{quote}</p>
                    <strong>{name}</strong>
                    <span>{district} · {specialty}</span>
                    <span className="ty-fiction-rating">★★★★★ <small>Valoración ficticia</small></span>
                  </div>
                </>
              ) : Math.abs(item.position) === 1 ? (
                <div className="ty-coverflow-side">
                  <img src={item.image_url} alt="" draggable="false" />
                  <strong>{item.name.split(" · ")[0]}</strong>
                </div>
              ) : null}
            </article>
          ))}
        </div>
        <div className="ty-coverflow-controls">
          <button type="button" className="ty-round-control" aria-label="Testimonio anterior" onClick={() => move(-1)}>←</button>
          <span role="status" aria-live="polite">{index + 1} de {testimonials.length}</span>
          <button type="button" className="ty-round-control" aria-label="Testimonio siguiente" onClick={() => move(1)}>→</button>
          <button type="button" className="ty-rotation-control" aria-label={paused || reduced ? "Reanudar rotación automática" : "Pausar rotación automática"} aria-pressed={paused || reduced} disabled={reduced} onClick={() => setPaused((value) => !value)}>{paused || reduced ? "Reanudar" : "Pausar"}</button>
        </div>
        <div className="ty-coverflow-dots" role="group" aria-label="Elegir testimonio">
          {testimonials.map((item, itemIndex) => <button type="button" key={item.id} aria-label={`Testimonio ${itemIndex + 1}`} aria-pressed={index === itemIndex} onClick={() => setIndex(itemIndex)} />)}
        </div>
      </div>
    </section>
  );
}
function Team() {
  return (
    <section id="equipo" data-about="Equipo" className="ty-section" data-reveal>
      <h2>
        Detrás de <em>TécnicoYa.</em>
      </h2>
      <div className="ty-grid">
        {[
          ["JD", "Jesus Delgado", "Frontend"],
          ["KM", "Karen Mayhuasca", "Backend"],
          ["JP", "James Pimentel", "Base de datos, Docker e integración"],
        ].map(([initials, name, role]) => (
          <article className="ty-card" key={initials}>
            <span className="ty-avatar" aria-hidden="true">
              {initials}
            </span>
            <h3 data-team-name>{name}</h3>
            <p>{role}</p>
          </article>
        ))}
      </div>
      <p>
        Proyecto académico – Universidad Continental, Pruebas y Calidad de
        Software, 2026
      </p>
    </section>
  );
}
function Quality() {
  return (
    <section data-about="Calidad" className="ty-section ty-trust" data-reveal>
      <h2>
        Calidad que <em>se comprueba.</em>
      </h2>
      <div className="ty-grid">
        <article>
          <h3>Más de 60 pruebas por sprint</h3>
          <p>
            Meta del proyecto. El cierre del Sprint 2 registra 90 casos
            automatizados aprobados.
          </p>
        </article>
        <article>
          <h3>Integración continua</h3>
          <p>
            Pruebas en cada pull request y cambio integrado en main, mediante
            GitHub Actions.
          </p>
        </article>
        <article>
          <h3>Quality Gate aprobado</h3>
          <p>
            Resultado documentado del cierre del Sprint 2. Cada nueva versión
            requiere su propia revisión.
          </p>
        </article>
      </div>
      <small>Fuente: informe de cierre S2.6, 13–15 de octubre de 2026.</small>
    </section>
  );
}
