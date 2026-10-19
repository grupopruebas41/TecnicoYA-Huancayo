import React, { useEffect, useState } from "react";
import "./landing.css";
import ServiceCarousel from "./ServiceCarousel";
import AccountApp from "./features/administration/AccountApp";
import Catalog from "./features/administration/Catalog";
import "./features/administration/sprint02.css";
const sections = [
  ["encabezado", "Encabezado"],
  ["inicio", "Inicio"],
  ["servicios", "Especialidades"],
  ["proceso", "Cómo funciona"],
  ["confianza", "Confianza"],
  ["testimonios", "Testimonios"],
  ["tecnicos", "Para técnicos"],
  ["preguntas", "Preguntas"],
  ["empezar", "Empezar"],
  ["pie", "Contacto"],
];
export default function App() {
  const [route, setRoute] = useState(window.location.hash);
  useEffect(() => {
    const change = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  const account =
    ["#cuenta", "#plataforma", "#catalogo"].includes(route) ||
    route.startsWith("#cuenta/");
  if (account)
    return (
      <div className="account-page">
        <header className="header">
          <a className="brand" href="#inicio">
            <span className="monogram">t</span>TécnicoYa
          </a>
          <a className="button glass" href="#inicio">
            Volver al inicio
          </a>
        </header>
        <main id="contenido">
          {route === "#catalogo" ? (
            <Catalog />
          ) : (
            <AccountApp />
          )}
        </main>
      </div>
    );
  return (
    <div className="landing-page">
      <a className="skip" href="#contenido">
        Ir al contenido
      </a>
      <LandingHeader />
      <main id="contenido">
        <LandingHero />
        <ServiceCarousel />
        <section
          id="proceso"
          data-landing="Cómo funciona"
          className="s02-landing-section"
        >
          <h2>Cómo funciona</h2>
          <ol>
            <li>
              <h3>Cuéntanos qué sucede</h3>
              <p>Registra la falla, tu especialidad y zona de atención.</p>
            </li>
            <li>
              <h3>Revisa y confirma</h3>
              <p>
                La plataforma busca técnicos elegibles. Revisa la propuesta
                antes de confirmar.
              </p>
            </li>
            <li>
              <h3>Sigue el servicio y califica</h3>
              <p>
                Consulta cada paso de la atención y comparte tu experiencia al
                finalizar.
              </p>
            </li>
          </ol>
        </section>
        <section
          id="confianza"
          data-landing="Confianza"
          className="s02-landing-section"
        >
          <h2>Confianza en cada paso</h2>
          <p>
            Verificación de técnicos, tarifas declaradas y seguimiento del
            servicio. El trabajo lo realiza el profesional independiente que tú
            confirmas.
          </p>
          <p>
            Los perfiles y la disponibilidad se consultan en la plataforma; no
            mostramos cifras de éxito sin evidencia.
          </p>
        </section>
        <section
          id="testimonios"
          data-landing="Testimonios"
          className="s02-landing-section"
        >
          <h2>Experiencias que queremos construir</h2>
          <p>
            Testimonios de ejemplo — contenido ilustrativo, no reseñas de
            clientes reales.
          </p>
          <blockquote>
            «Quiero encontrar ayuda para mi negocio y conocer el avance del
            servicio en un solo lugar.»
          </blockquote>
        </section>
        <section
          id="tecnicos"
          data-landing="CTA técnicos"
          className="s02-landing-section"
        >
          <h2>Tu experiencia merece nuevas oportunidades</h2>
          <p>
            Completa tu perfil, tus servicios y tu zona. Solicita la
            verificación para ofrecer atención en TécnicoYa.
          </p>
          <a className="button primary" href="#cuenta">
            Registrarme como técnico
          </a>
        </section>
        <section
          id="preguntas"
          data-landing="FAQ"
          className="s02-landing-section"
        >
          <h2>Preguntas frecuentes</h2>
          {[
            [
              "¿Quién realiza la reparación?",
              "El técnico independiente que acepta y que tú confirmas. TécnicoYa facilita la conexión y el seguimiento.",
            ],
            [
              "¿La tarifa incluye repuestos?",
              "La tarifa es una referencia declarada por el técnico. Acuerda los repuestos y trabajos adicionales antes de realizarlos.",
            ],
            [
              "¿Se procesan pagos en la plataforma?",
              "En este MVP solo se registra el método de pago y un comprobante simulado; no se mueve dinero real.",
            ],
            [
              "¿Cómo empiezo?",
              "Crea una cuenta como cliente o técnico en el apartado de acceso.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
        <section
          id="empezar"
          data-landing="CTA final"
          className="s02-landing-section"
        >
          <h2>Tu próxima solución empieza aquí</h2>
          <p>Conecta con talento técnico de tu ciudad.</p>
          <a className="button primary" href="#cuenta">
            Empezar ahora
          </a>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}

function LandingHeader() {
  return (
    <header id="encabezado" data-landing="Header" className="header">
      <a
        className="brand"
        href="#inicio"
        aria-label="TécnicoYa Huancayo, inicio"
      >
        <span className="monogram">t</span>
        <span>
          TécnicoYa<small>HUANCAYO</small>
        </span>
      </a>
      <nav className="landing-menu" aria-label="Principal">
        {sections.map(([id, label]) => (
          <a key={id} href={"#" + id}>
            {label}
          </a>
        ))}
      </nav>
      <a className="button primary" href="#cuenta">
        Iniciar sesión
      </a>
    </header>
  );
}

function LandingHero() {
  return (
    <section id="inicio" data-landing="Hero" className="hero">
      <div className="eyebrow glass">
        Para tu hogar. Para tu negocio. Para Huancayo.
      </div>
      <h1>
        El técnico indicado.
        <br />
        <em>Aquí, en Huancayo.</em>
      </h1>
      <p className="hero-copy">
        Conectamos hogares y MYPES con técnicos independientes verificados.
        Cuéntanos la falla y encuentra a quien puede resolverla.
      </p>
      <div className="hero-actions">
        <a className="button primary" href="#cuenta">
          Encontrar un técnico ↗
        </a>
        <a className="button glass" href="#cuenta">
          Crear mi cuenta
        </a>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer id="pie" data-landing="Footer" className="footer">
      <h2>TécnicoYa Huancayo</h2>
      <p>Talento local. Soluciones cerca.</p>
      <span>Proyecto académico · Universidad Continental</span>
      <a href="#encabezado">Volver arriba</a>
    </footer>
  );
}
