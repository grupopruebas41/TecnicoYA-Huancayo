import React, { useEffect, useRef, useState } from "react";
import { CONTACT, setAuthIntent } from "./config";
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
    [scrolled, setScrolled] = useState(false);
  const toggle = useRef(null),
    nav = useRef(null);
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 30);
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
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
          <a key={id} href={"#" + id}>
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
      <span className="ty-eyebrow">UNA SOLUCIÓN MÁS CERCA</span>
      <h2>
        Empieza <em>ahora.</em>
      </h2>
      <p>Tu hogar y tu negocio merecen seguir en marcha.</p>
      <div className="ty-actions">
        <AuthLink>Pedir un técnico ↗</AuthLink>
        <AuthLink role="technician" className="ty-button ty-outline">
          Soy técnico
        </AuthLink>
      </div>
    </section>
  );
}
export function Footer() {
  return (
    <footer id="pie" data-landing="Footer" className="ty-footer">
      <div>
        <a href="#inicio" className="ty-brand">
          TécnicoYa
        </a>
        <p>Talento local. Soluciones cerca.</p>
        <small>TécnicoYa · Huancayo 2026</small>
      </div>
      <nav aria-label="Enlaces del pie">
        <a href="#servicios">Servicios</a>
        <a href="#nosotros">Nosotros</a>
        <a href="#preguntas">Preguntas frecuentes</a>
        <a href="#encabezado">Volver arriba ↑</a>
      </nav>
      <div>
        <strong>Contacto de ejemplo · por configurar</strong>
        <p>WhatsApp: {CONTACT.whatsapp}</p>
        <p>Correo: {CONTACT.email}</p>
        <a href="#nosotros/contacto">Ver contacto</a>
      </div>
      <div className="ty-legal">
        <details>
          <summary>Términos</summary>
          <p>
            Versión académica MVP. Los servicios los realizan técnicos
            independientes. Los pagos son simulados. Las condiciones definitivas
            de publicación están pendientes.
          </p>
        </details>
        <details>
          <summary>Privacidad</summary>
          <p>
            Usa solo los datos necesarios para coordinar tu atención. Las
            evidencias son privadas. El aviso legal definitivo y el canal para
            ejercer derechos están pendientes de publicación.
          </p>
        </details>
      </div>
    </footer>
  );
}
export function Zones({
  districts = [],
  loading = false,
  error = "",
  about = false,
}) {
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
        viewBox="0 0 480 360"
        role="img"
        aria-label="Mapa ilustrativo de El Tambo, Huancayo y Chilca"
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
        ].map(([name, path, x, y]) => (
          <g key={name} className={available(name) ? "active" : ""}>
            <path d={path + " Z"} />
            <text x={x} y={y} textAnchor="middle">
              {name}
            </text>
          </g>
        ))}
      </svg>
    </section>
  );
}
