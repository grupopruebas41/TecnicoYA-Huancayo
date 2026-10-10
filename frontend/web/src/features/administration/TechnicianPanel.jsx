import React, { useState } from "react";
import { request } from "./http";
import { Field } from "./forms";
import {
  MutationForm,
  Upload,
  useResource,
  useSubcategories,
  ResourceState,
} from "./Sprint02Common";
import { technicianState } from "./sprint02Validation";
import RetireButton from "./RetireButton";
import AvailabilityEditor from "./AvailabilityEditor";
import ServicesEditor from "./ServicesEditor";
function Bio({ profile, reload }) {
  const [bio, setBio] = useState(profile.bio || ""),
    [years, setYears] = useState(profile.experience_years ?? 0);
  return (
    <MutationForm
      reload={reload}
      validate={() =>
        bio.length > 2000
          ? { bio: ["Máximo 2000 caracteres."] }
          : !Number.isInteger(+years) || +years < 0 || +years > 60
            ? { experience_years: ["Indica entre 0 y 60 años enteros."] }
            : {}
      }
      onSave={async () => {
        await request(
          "/technicians/me/profile",
          { bio, experience_years: +years, expected_version: profile.version },
          "PATCH",
        );
        await reload();
      }}
    >
      {(e) => (
        <>
          <Field label="Biografía" name="bio" errors={e}>
            <textarea value={bio} onChange={(x) => setBio(x.target.value)} />
          </Field>
          <Field
            label="Años de experiencia"
            name="experience_years"
            type="number"
            errors={e}
            value={years}
            onChange={(x) => setYears(x.target.value)}
          />
        </>
      )}
    </MutationForm>
  );
}
function Documents({ profile, reload }) {
  const [media, setMedia] = useState(null),
    [type, setType] = useState("");
  return (
    <section>
      <h3>Documentos de verificación</h3>
      {profile.documents?.map((d) => (
        <p key={d.id}>
          <a href={d.url} target="_blank" rel="noreferrer">
            {d.document_type}
          </a>{" "}
          · {technicianState(d.review_status)}
        </p>
      ))}
      {!profile.documents?.length && <p>No has adjuntado documentos.</p>}
      <MutationForm
        reload={reload}
        validate={() =>
          !media
            ? { media_id: ["Sube un documento."] }
            : type.trim().length < 2 || type.length > 60
              ? { document_type: ["Indica entre 2 y 60 caracteres."] }
              : profile.documents?.filter((d) => d.review_status !== "rejected")
                    .length >= 5
                ? { media_id: ["Máximo 5 documentos vigentes."] }
                : {}
        }
        onSave={async () => {
          await request("/technicians/me/documents", {
            media_id: media.id,
            document_type: type,
          });
          await reload();
        }}
      >
        <Field
          label="Tipo de documento"
          name="document_type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        />
        <Upload purpose="document" onUploaded={setMedia} />
        {media && <output>Documento listo para adjuntar.</output>}
      </MutationForm>
    </section>
  );
}
function PortfolioEditor({ item = {}, reload, subcategories }) {
  const [v, set] = useState({
      title: item.title || "",
      description: item.description || "",
      performed_on: item.performed_on || "",
      subcategory_id: item.subcategory_id || "",
      status: item.status || "draft",
    }),
    [images, setImages] = useState(item.images || []);
  const update = (k, x) => set({ ...v, [k]: x });
  function validate() {
    const e = {};
    if (v.title.trim().length < 2 || v.title.length > 160)
      e.title = ["Indica entre 2 y 160 caracteres."];
    if (v.description.length > 2000)
      e.description = ["Máximo 2000 caracteres."];
    if (images.length < 1 || images.length > 5)
      e.media_ids = ["Adjunta entre 1 y 5 imágenes."];
    if (!v.subcategory_id) e.subcategory_id = ["Selecciona una subcategoría."];
    if (!v.performed_on) e.performed_on = ["Indica la fecha del trabajo."];
    return e;
  }
  return (
    <MutationForm
      validate={validate}
      reload={reload}
      onSave={async () => {
        await request(
          "/technicians/me/portfolio" + (item.id ? "/" + item.id : ""),
          {
            ...v,
            subcategory_id: +v.subcategory_id,
            media_ids: images.map((m) => m.media_id || m.id),
            ...(item.id ? { expected_version: item.version } : {}),
          },
          item.id ? "PATCH" : "POST",
        );
        await reload();
      }}
    >
      {(errors) => (
        <>
          <Field
            label="Título del trabajo"
            name="title"
            errors={errors}
            value={v.title}
            onChange={(e) => update("title", e.target.value)}
          />
          <Field
            label="Descripción del trabajo"
            name="description"
            errors={errors}
          >
            <textarea
              value={v.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </Field>
          <Field
            label="Fecha del trabajo"
            name="performed_on"
            type="date"
            errors={errors}
            value={v.performed_on}
            onChange={(e) => update("performed_on", e.target.value)}
          />
          <Field
            label="Subcategoría del trabajo"
            name="subcategory_id"
            errors={errors}
          >
            <select
              value={v.subcategory_id}
              onChange={(e) => update("subcategory_id", e.target.value)}
            >
              <option value="">Selecciona</option>
              {subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <label>
            Estado del trabajo
            <select
              value={v.status}
              onChange={(e) => update("status", e.target.value)}
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </select>
          </label>
          <Upload
            purpose="portfolio"
            onUploaded={(m) => setImages([...images, m])}
          />
          <div className="s02-images">
            {images.map((m, i) => (
              <figure key={m.id || m.media_id}>
                <img src={m.url} alt={"Evidencia " + (i + 1)} />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, n) => n !== i))}
                >
                  Quitar imagen {i + 1} del formulario
                </button>
              </figure>
            ))}
          </div>
        </>
      )}
    </MutationForm>
  );
}
export default function TechnicianPanel() {
  const r = useResource("/technicians/me/profile"),
    catalog = useSubcategories();
  const [tab, setTab] = useState("profile"),
    [edit, setEdit] = useState(null),
    [notice, setNotice] = useState("");
  const p = r.data;
  return (
    <section className="s02-panel">
      <h2>Mi espacio técnico</h2>
      {notice && <output>{notice}</output>}
      <ResourceState resource={r} />
      <nav aria-label="Gestión del técnico">
        {[
          ["profile", "Mi perfil"],
          ["portfolio", "Portafolio"],
          ["availability", "Disponibilidad y zona"],
          ["services", "Servicios y tarifas"],
        ].map(([id, label]) => (
          <button
            type="button"
            key={id}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {p && (
        <>
          <p>
            {technicianState(
              p.verification_status === "rejected" ? "rejected" : p.status,
            )}
          </p>
          {p.last_review && <p>Última revisión: {p.last_review.reason}</p>}
          {p.verification_status === "rejected" && (
            <MutationForm
              label="Solicitar nueva revisión"
              reload={r.reload}
              onSave={async () => {
                await request("/technicians/me/verification-request", {
                  expected_version: p.version,
                });
                await r.reload();
              }}
            />
          )}
          {tab === "profile" && (
            <>
              <Bio profile={p} reload={r.reload} />
              <Documents profile={p} reload={r.reload} />
            </>
          )}
          {tab === "availability" && (
            <AvailabilityEditor profile={p} reload={r.reload} />
          )}{" "}
          {tab === "services" && (
            <ServicesEditor profile={p} reload={r.reload} />
          )}{" "}
          {tab === "portfolio" && (
            <>
              <ResourceState resource={catalog} />
              <button type="button" onClick={() => setEdit({})}>
                Nuevo trabajo
              </button>
              {edit && (
                <PortfolioEditor
                  key={(edit.id || "new") + "-" + edit.version}
                  item={edit}
                  reload={r.reload}
                  subcategories={catalog.data || []}
                />
              )}{" "}
              {!p.portfolio?.filter((t) => t.status !== "retired").length && (
                <p>No hay trabajos en tu portafolio.</p>
              )}
              {p.portfolio
                ?.filter((t) => t.status !== "retired")
                .map((t) => (
                  <article className="s02-card" key={t.id}>
                    <h3>{t.title}</h3>
                    <p>{t.status === "draft" ? "Borrador" : "Publicado"}</p>
                    <p>{t.description}</p>
                    <div className="s02-images">
                      {t.images?.map((m) => (
                        <img key={m.media_id} src={m.url} alt={t.title} />
                      ))}
                    </div>
                    <button type="button" onClick={() => setEdit(t)}>
                      Editar trabajo
                    </button>
                    <RetireButton
                      path={"/technicians/me/portfolio/" + t.id}
                      reload={r.reload}
                      label="Retirar trabajo"
                      onRetired={() =>
                        setNotice("Trabajo retirado correctamente.")
                      }
                    />
                  </article>
                ))}
            </>
          )}
        </>
      )}
    </section>
  );
}
