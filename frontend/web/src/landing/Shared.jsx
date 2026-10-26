import React, { useEffect, useRef, useState } from "react";
import { setAuthIntent } from "./config";
import { contactItems } from "./contact";
import { navigateToPath, navigateToSection, scrollToSection, scrollToTop } from "./navigation";
export function AuthLink({
  children,
  role = "client",
  login = false,
  className = "ty-button",
  ...props
}) {
  return (
    <a
      {...props}
      className={className}
      href="#cuenta"
      onClick={() => setAuthIntent(login ? "login" : "register", role)}
    >
      {children}
    </a>
  );
}
const links = [
  ["servicios", "Servicios"],
  ["proceso", "Cómo funciona"],
  ["tecnicos", "Para técnicos"],
  ["nosotros", "Nosotros"],
  ["preguntas", "Preguntas"],
];
export function Header() {
  const [open, setOpen] = useState(false),
    [scrolled, setScrolled] = useState(false),
    [activeLink, setActiveLink] = useState(() =>
      window.location.pathname.replace(/\/$/, "") === "/nosotros" ? "nosotros" : "inicio",
    );
  const toggle = useRef(null),
    nav = useRef(null);
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 30);
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);
  useEffect(() => {
    const updateActiveLink = (event) => setActiveLink(event.detail?.id || "inicio");
    window.addEventListener("tecnicoya:section-active", updateActiveLink);
    return () => window.removeEventListener("tecnicoya:section-active", updateActiveLink);
  }, []);
  useEffect(() => {
    if (open) nav.current?.querySelector("a")?.focus();
  }, [open]);
  function keys(e) {
    if (!open) return;
    if (e.key === "Escape") {
      setOpen(false);
      toggle.current?.focus();
    }
    if (e.key === "Tab") {
      const a = [...nav.current.querySelectorAll("a")];
      const first = a[0],
        last = a.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
  return (
    <header
      id="encabezado"
      data-landing="Header"
      className={"ty-header " + (scrolled ? "is-solid" : "")}
    >
      <a
        className="ty-brand"
        href="#inicio"
        aria-label="TécnicoYa Huancayo, inicio"
        onClick={(event) => {
          event.preventDefault();
          if (window.location.pathname.replace(/\/$/, "") === "/nosotros")
            navigateToPath("/");
          else scrollToSection("inicio");
        }}
      >
        <span className="ty-monogram">t</span>
        <span>
          TécnicoYa<small>HUANCAYO</small>
        </span>
      </a>
      <button
        ref={toggle}
        className="ty-menu-toggle"
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-controls="principal"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>
      <nav
        ref={nav}
        id="principal"
        aria-label="Principal"
        className={open ? "is-open" : ""}
        onKeyDown={keys}
        onClick={() => setOpen(false)}
      >
        {links.map(([id, name]) => (
          <a
            key={id}
            href={id === "nosotros" ? "/nosotros" : "#" + id}
            aria-current={activeLink === id ? "location" : undefined}
            onClick={(event) => {
              event.preventDefault();
              if (id === "nosotros") navigateToPath("/nosotros");
              else navigateToSection(id);
            }}
          >
            {name}
          </a>
        ))}
      </nav>
      <AuthLink login className="ty-button ty-header-login">
        Iniciar sesión
      </AuthLink>
    </header>
  );
}
export function FinalCTA({ about = false }) {
  return (
    <section
      id={about ? "nosotros-empezar" : "empezar"}
      data-landing={about ? undefined : "CTA final"}
      data-about={about ? "Invitación final" : undefined}
      className="ty-section ty-final"
      data-reveal
    >
      <div className="ty-final-head">
        <span className="ty-eyebrow">UNA SOLUCIÓN MÁS CERCA</span>
        <h2>
          Empieza <em>ahora.</em>
        </h2>
        <p>Tu hogar y tu negocio merecen seguir en marcha.</p>
      </div>
      <div className="ty-paths">
        {paths.map((path) => (
          <article key={path.id} className="ty-path-card" aria-labelledby={path.id}>
            <img src={path.image} alt="" loading="lazy" />
            <div className="ty-path-body">
              <h3 id={path.id}>{path.title}</h3>
              <ul>
                {path.points.map((point) => (
                  <li key={point}>
                    <span className="ty-icon-dot" aria-hidden="true">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
              <AuthLink role={path.role} className={path.className}>
                {path.action}
              </AuthLink>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
const paths = [
  {
    id: "camino-cliente",
    title: "Necesito un técnico",
    image: "/media/nosotros/ejemplo-bodega.webp",
    points: ["Describe la falla", "Recibe recomendaciones", "Sigue la atención"],
    role: "client",
    action: "Pedir un técnico ↗",
    className: "ty-button",
  },
  {
    id: "camino-tecnico",
    title: "Soy técnico",
    image: "/media/nosotros/portada.webp",
    points: ["Clientes de tu zona", "Tú pones tu tarifa", "Construye reputación"],
    role: "technician",
    action: "Registrarme como técnico",
    className: "ty-button ty-outline-gold",
  },
];
export const legalTexts = {
  terms: [
    "Términos",
    "Versión académica MVP. Los servicios los realizan técnicos independientes. Los pagos son simulados. Las condiciones definitivas de publicación están pendientes.",
  ],
  privacy: [
    "Privacidad",
    "Usa solo los datos necesarios para coordinar tu atención. Las evidencias son privadas. El aviso legal definitivo y el canal para ejercer derechos están pendientes de publicación.",
  ],
};
function LegalDialog({ kind, onClose }) {
  const close = useRef(null);
  const [title, body] = legalTexts[kind];
  useEffect(() => {
    close.current?.focus();
  }, [kind]);
  return (
    <div className="ty-legal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div
        className="ty-legal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ty-legal-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
          // Con un solo control enfocable, Tab no debe salir del panel.
          if (event.key === "Tab") {
            event.preventDefault();
            close.current?.focus();
          }
        }}
      >
        <h2 id="ty-legal-title">{title}</h2>
        <p>{body}</p>
        <button ref={close} type="button" className="ty-button ty-outline" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
function goTo(path, sectionId) {
  return (event) => {
    event.preventDefault();
    const samePage = window.location.pathname.replace(/\/$/, "") === (path || "").replace(/\/$/, "");
    if (!path) navigateToSection(sectionId);
    else if (!samePage) navigateToPath(path, { sectionId });
    else if (sectionId) scrollToSection(sectionId);
    else scrollToTop();
  };
}
export { goTo };
export function Footer() {
  const [legal, setLegal] = useState(null);
  const opener = useRef(null);
  function openLegal(kind, event) {
    opener.current = event.currentTarget;
    setLegal(kind);
  }
  function closeLegal() {
    setLegal(null);
    opener.current?.focus();
  }
  return (
    <footer id="pie" data-landing="Footer" className="ty-footer">
      <div className="ty-footer-grid">
        <div className="ty-footer-brand">
          <a href="#inicio" className="ty-brand" onClick={goTo(null, "inicio")}>
            <span className="ty-monogram">t</span>
            <span>TécnicoYa<small>HUANCAYO</small></span>
          </a>
          <p>Talento local. Soluciones cerca.</p>
          <small>Huancayo 2026</small>
        </div>
        <nav aria-labelledby="pie-navegacion">
          <h2 id="pie-navegacion" className="ty-footer-title">Navegación</h2>
          <a href="#servicios" onClick={goTo(null, "servicios")}>Servicios</a>
          <a href="/nosotros" onClick={goTo("/nosotros")}>Nosotros</a>
          <a href="#preguntas" onClick={goTo(null, "preguntas")}>Preguntas frecuentes</a>
          <a href="#inicio" onClick={(event) => { event.preventDefault(); scrollToTop(); }}>Volver arriba ↑</a>
        </nav>
        <div>
          <h2 className="ty-footer-title">Contacto</h2>
          <span className="ty-pending-tag">Datos por confirmar</span>
          {contactItems().filter((item) => item.key !== "hours").map((item) => (
            <p key={item.key}>
              {item.label}: <span className={item.pending ? "ty-pending" : undefined}>{item.value}</span>
            </p>
          ))}
          <a href="/nosotros" onClick={goTo("/nosotros", "contacto")}>Ver contacto</a>
        </div>
        <div>
          <h2 className="ty-footer-title">Legal</h2>
          <button type="button" className="ty-footer-link" onClick={(event) => openLegal("terms", event)}>Términos</button>
          <button type="button" className="ty-footer-link" onClick={(event) => openLegal("privacy", event)}>Privacidad</button>
        </div>
      </div>
      <p className="ty-footer-bar">© 2026 TécnicoYa · Proyecto académico – Universidad Continental</p>
      {legal && <LegalDialog kind={legal} onClose={closeLegal} />}
    </footer>
  );
}
export function Zones({
  districts = [],
  loading = false,
  error = "",
  about = false,
}) {
  const [activeZone, setActiveZone] = useState("");
  const [entered, setEntered] = useState(false);
  const mapRef = useRef(null);
  useEffect(() => {
    if (!mapRef.current || typeof IntersectionObserver === "undefined") {
      setEntered(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setEntered(true);
        observer.disconnect();
      }
    }, { threshold: 0.2 });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);
  const available = (name) =>
    districts.some((d) => d.name.toLowerCase() === name.toLowerCase());
  return (
    <section
      id={about ? "nosotros-zonas" : "zonas"}
      data-landing={about ? undefined : "Zonas"}
      data-about={about ? "Zonas y rubros" : undefined}
      className="ty-section ty-zones"
      data-reveal
    >
      <div>
        <span className="ty-eyebrow">ORGULLOSAMENTE LOCALES</span>
        <h2>
          Aquí, en <em>Huancayo.</em>
        </h2>
        <p>Talento de tu ciudad para tu hogar y tu negocio.</p>
        {loading ? (
          <p>Cargando zonas…</p>
        ) : error ? (
          <p role="status">Zonas no disponibles por el momento.</p>
        ) : districts.length ? (
          <ul className="ty-chips">
            {districts.map((d) => (
              <li key={d.id}>{d.name}</li>
            ))}
          </ul>
        ) : (
          <p>No hay distritos activos disponibles.</p>
        )}
        <small>
          Mapa ilustrativo, sin límites geográficos ni ubicación en tiempo real.
        </small>
      </div>
        <svg
          ref={mapRef}
          className={entered ? "ty-map-entered" : ""}
        viewBox="0 0 480 360"
          role="group"
          aria-label="Zonas de atención ilustradas"
      >
        <path className="ty-map-river" d="M70 0 Q200 130 95 200 T100 360" />
        {[
          ["El Tambo", "M160 35 370 20 420 120 285 155 150 125", 270, 90],
          [
            "Huancayo",
            "M150 135 285 165 415 135 380 245 200 250 125 205",
            270,
            210,
          ],
          [
            "Chilca",
            "M125 220 195 265 375 260 325 340 145 325 90 285",
            230,
            305,
          ],
          ].map(([name, path, x, y], index) => (
            <g
              key={name}
              className={`ty-map-zone ${available(name) ? "active" : ""} ${activeZone === name ? "selected" : ""}`}
              role="button"
              tabIndex={0}
              aria-label={`Zona ${name}`}
              aria-pressed={activeZone === name}
              style={{ "--zone-order": index }}
              onFocus={() => setActiveZone(name)}
              onMouseEnter={() => setActiveZone(name)}
              onClick={() => setActiveZone(name)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setActiveZone(name);
                }
              }}
            >
              <path className="ty-map-edge" d={path + " Z"} aria-hidden="true" />
              <path className="ty-map-face" d={path + " Z"} aria-hidden="true" />
            <text x={x} y={y} textAnchor="middle">
              {name}
            </text>
          </g>
        ))}
      </svg>
        <p className="ty-map-active" role="status" aria-live="polite">
          {activeZone ? <>Zona seleccionada: <strong>{activeZone}</strong></> : "Selecciona una zona del mapa."}
        </p>
    </section>
  );
}
