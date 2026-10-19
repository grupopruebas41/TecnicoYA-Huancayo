import React, { useState } from "react";
import { CONTACT } from "./config";
import { FinalCTA, Zones } from "./Shared";
import { CarouselDeck, SpecialtyCards } from "../ServiceCarousel";
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
  return (
    <>
      <nav className="ty-about-nav" aria-label="Acerca de TécnicoYa">
        {[
          ["quienes", "Quiénes somos"],
          ["verificacion", "Cómo verificamos"],
          ["seguridad", "Tu seguridad"],
          ["testimonios", "Testimonios"],
          ["equipo", "Equipo"],
          ["contacto", "Contacto"],
        ].map(([id, name]) => (
          <a key={id} href={"#nosotros/" + id}>
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
            window.location.hash = "#servicios";
          }}
        />
      </div>
      <Team />
      <Quality />
      <Contact />
      <FinalCTA about />
    </>
  );
}

function AboutCover() {
  return (
    <section data-about="Portada" className="ty-about-hero">
      <img
        src="/media/nosotros/portada.webp"
        alt="Tres técnicos independientes caminando por una calle de Huancayo con sus maletines"
      />
      <div>
        <span className="ty-eyebrow">SOMOS TÉCNICOYA</span>
        <h1>
          Conectamos talento técnico local <em>con quien lo necesita.</em>
        </h1>
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
      <div className="ty-grid">
        {[
          [
            "Misión",
            "Conectar a hogares y MYPES con talento técnico local mediante información clara y atención trazable.",
          ],
          [
            "Visión",
            "Hacer más confiable y accesible la búsqueda de servicios técnicos en Huancayo.",
          ],
          [
            "Valores",
            "Confianza, transparencia y reconocimiento del talento local.",
          ],
        ].map(([t, p]) => (
          <article className="ty-card" key={t}>
            <h3>{t}</h3>
            <p>{p}</p>
          </article>
        ))}
      </div>
    </section>
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
  return (
    <section
      id="testimonios"
      data-about="Testimonios"
      className="ty-section"
      data-reveal
    >
      <span className="ty-eyebrow">LO QUE BUSCAMOS HACER POSIBLE</span>
      <h2>Testimonios de ejemplo</h2>
      <p>
        Personajes, imágenes y valoraciones ficticias. No son reseñas de
        clientes reales.
      </p>
      <CarouselDeck items={testimonials} label="Historias ilustrativas" />
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
