import React, { useState } from "react";
import { request } from "../features/administration/http";
import { rememberSearch, setAuthIntent } from "./config";
import { useCount } from "./hooks";
import { AuthLink, FinalCTA, Zones } from "./Shared";
import ServiceCarousel from "../ServiceCarousel";
function Count({ value, label }) {
  const [ref, count] = useCount(value);
  return (
    <div ref={ref}>
      <strong aria-label={label}>{count}</strong>
      <span>{label}</span>
    </div>
  );
}
export function CatalogSearch({ catalog }) {
  const [specialty, setSpecialty] = useState(""),
    [district, setDistrict] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function search(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    rememberSearch({ specialty_id: specialty, district_id: district });
    try {
      const { data } = await request("/me");
      if (data.role?.code !== "client") {
        setError(
          "La búsqueda de servicios está disponible para cuentas de cliente. Puedes acceder a tu panel desde Iniciar sesión.",
        );
        return;
      }
      window.location.hash = "#cuenta/cliente";
    } catch (e) {
      if (e.status === 401) {
        setAuthIntent("login");
        window.location.hash = "#cuenta";
      } else
        setError(
          "No pudimos comprobar tu sesión. Tus filtros se conservan; vuelve a intentarlo.",
        );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="ty-catalog-search">
      <form className="ty-search" onSubmit={search}>
        <label>
          ¿Qué necesitas?
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          >
            <option value="">Todas las especialidades</option>
            {catalog.data?.specialties.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          ¿Dónde?
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
            <option value="">Todos los distritos</option>
            {catalog.data?.districts.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="ty-button"
          type="submit"
          disabled={busy || !catalog.data}
        >
          {busy ? "Comprobando…" : "Encontrar técnico"}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {catalog.error ? (
        <div role="status">
          <p>{catalog.error}</p>
          <button
            type="button"
            className="ty-text-button"
            onClick={catalog.reload}
          >
            Reintentar catálogo público
          </button>
        </div>
      ) : catalog.data ? (
        <div className="ty-stats">
          <Count
            value={catalog.data.specialties.length}
            label="Especialidades activas"
          />
          <Count
            value={catalog.data.subcategories.length}
            label="Subcategorías activas"
          />
          <Count
            value={catalog.data.districts.length}
            label="Distritos activos"
          />
        </div>
      ) : (
        <p role="status">Consultando catálogo público…</p>
      )}
    </div>
  );
}
export function Hero() {
  return (
    <section
      id="inicio"
      data-landing="Hero"
      className="ty-hero ty-hero-centered"
    >
      <div className="ty-hero-content">
        <span className="ty-hero-pill">
          Para tu hogar. Para tu negocio. Para Huancayo.
        </span>
        <h1>
          <span>El técnico indicado.</span>
          <span className="ty-gold">Aquí, en Huancayo.</span>
        </h1>
        <p>
          <span>
            Conectamos hogares y MYPES con técnicos independientes verificados.
          </span>
          <span>Cuéntanos la falla y encuentra a quien puede resolverla.</span>
        </p>
        <div className="ty-actions">
          <a className="ty-button" href="#servicios">
            Encontrar un técnico ↗
          </a>
          <AuthLink className="ty-button ty-outline">Crear mi cuenta</AuthLink>
        </div>
      </div>
    </section>
  );
}
const steps = [
  [
    "01",
    "Describe el problema",
    "Cuéntanos qué pasó y adjunta fotos de la falla.",
  ],
  [
    "02",
    "Recibe recomendaciones",
    "Buscamos técnicos elegibles por servicio y zona.",
  ],
  [
    "03",
    "Elige y coordina",
    "Revisa perfiles, confirma al técnico y coordina la atención.",
  ],
  [
    "04",
    "Comparte tu experiencia",
    "Al finalizar, califica el servicio y ayuda a otros a elegir.",
  ],
];
const faqs = [
  [
    "¿Cuánto cuesta?",
    "La tarifa del técnico es una referencia en soles. Revisa lo que incluye y acuerda los repuestos o trabajos adicionales antes de la atención.",
  ],
  [
    "¿Cómo se verifica a los técnicos?",
    "Un administrador revisa los documentos y el perfil antes de habilitar al técnico. El servicio lo realiza el profesional independiente que eliges.",
  ],
  [
    "¿Qué pasa si nadie acepta?",
    "El sistema busca otras opciones. Si no hay disponibilidad, te muestra el estado Pendiente de disponibilidad y podrás revisar alternativas.",
  ],
  [
    "¿Puedo cancelar?",
    "La cancelación depende del estado de tu solicitud. Consulta las opciones disponibles en Mis solicitudes antes de confirmar una atención.",
  ],
  [
    "¿Cómo pago?",
    "En esta versión los pagos son simulados. Solo se registra el método y un comprobante de ejemplo; la plataforma no procesa dinero real.",
  ],
  [
    "¿Cómo me registro como técnico?",
    "Crea una cuenta de técnico, completa tu perfil y presenta tus documentos. Tu cuenta queda pendiente de verificación hasta la revisión del administrador.",
  ],
  [
    "¿Mis datos están protegidos?",
    "Las evidencias son privadas y los contactos se habilitan según la asignación. Usa solo los datos necesarios para coordinar el servicio.",
  ],
];
export default function Home({ catalog }) {
  return (
    <>
      <Hero />
      <ServiceCarousel catalog={catalog} />
      <section
        id="proceso"
        data-landing="Cómo funciona"
        className="ty-section"
        data-reveal
      >
        <span className="ty-eyebrow">DE LA FALLA A LA SOLUCIÓN</span>
        <h2>
          Más simple, <em>paso a paso.</em>
        </h2>
        <ol className="ty-timeline">
          {steps.map(([n, title, body]) => (
            <li key={n}>
              <span className="ty-step">{n}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>
      <section
        id="confianza"
        data-landing="Confianza"
        className="ty-section ty-trust"
        data-reveal
      >
        <span className="ty-eyebrow">LA CONFIANZA SE CONSTRUYE</span>
        <h2>
          Técnicos verificados, tarifas claras y seguimiento{" "}
          <em>de cada paso.</em>
        </h2>
        <div className="ty-trust-points">
          <p>✓ Perfiles revisados</p>
          <p>◇ Referencias antes de elegir</p>
          <p>↗ Atención con seguimiento</p>
        </div>
        <a className="ty-button ty-outline" href="#nosotros">
          Conoce más sobre nosotros →
        </a>
      </section>
      <section
        id="tecnicos"
        data-landing="CTA técnicos"
        className="ty-section ty-split"
        data-reveal
      >
        <img
          loading="lazy"
          src="/media/landing/tecnico-taller.webp"
          alt="Técnico ordenando sus herramientas en un taller con luz de tarde"
        />
        <div>
          <span className="ty-eyebrow">TU TALENTO MUEVE LA CIUDAD</span>
          <h2>
            ¿Eres técnico?
            <br />
            <em>Recibe trabajos cerca de ti.</em>
          </h2>
          <ul className="ty-benefits">
            <li>Clientes de tu zona</li>
            <li>Tú pones tu tarifa</li>
            <li>Construyes reputación</li>
          </ul>
          <AuthLink role="technician">Registrarme como técnico ↗</AuthLink>
        </div>
      </section>
      <Zones
        districts={catalog.data?.districts}
        loading={!catalog.data && !catalog.error}
        error={catalog.error}
      />
      <section
        id="preguntas"
        data-landing="FAQ"
        className="ty-section ty-faq"
        data-reveal
      >
        <div>
          <span className="ty-eyebrow">ANTES DE EMPEZAR</span>
          <h2>
            Resolvemos <em>tus dudas.</em>
          </h2>
        </div>
        <div>
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <FinalCTA />
    </>
  );
}
