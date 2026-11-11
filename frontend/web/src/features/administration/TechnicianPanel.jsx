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
import { technicianState, validatePerformedOn } from "./sprint02Validation";
import RetireButton from "./RetireButton";
import AvailabilityEditor from "./AvailabilityEditor";
import ServicesEditor from "./ServicesEditor";
export const WORK_STYLE_MAX = 500;
export const WARRANTY_MAX = 300;
function Bio({ profile, reload }) {
  const districts = useResource("/catalog/districts");
  const [baseDistrict, setBaseDistrict] = useState(
    profile.base_district_id || "",
  );
  const [bio, setBio] = useState(profile.bio || ""),
    [years, setYears] = useState(profile.experience_years ?? 0),
    // D-101 (Fase 3): forma de trabajo y garantía del perfil público.
    [workStyle, setWorkStyle] = useState(profile.work_style || ""),
    [warranty, setWarranty] = useState(profile.warranty_text || "");
  return (
    <MutationForm
      reload={reload}
      validate={() => {
        if (
          baseDistrict &&
          !districts.data?.some((d) => d.id === +baseDistrict)
        )
          return { base_district_id: ["Selecciona un distrito activo."] };
        if (bio.length > 2000) return { bio: ["Máximo 2000 caracteres."] };
        const limits = {};
        if (workStyle.length > WORK_STYLE_MAX) limits.work_style = ["La forma de trabajo admite hasta 500 caracteres."];
        if (warranty.length > WARRANTY_MAX) limits.warranty_text = ["La garantía admite hasta 300 caracteres."];
        if (Object.keys(limits).length) return limits;
        if (!Number.isInteger(+years) || +years < 0 || +years > 60)
          return { experience_years: ["Indica entre 0 y 60 años enteros."] };
        return {};
      }}
      onSave={async () => {
        await request(
          "/technicians/me/profile",
          {
            bio,
            work_style: workStyle.trim() || null,
            warranty_text: warranty.trim() || null,
            experience_years: +years,
            expected_version: profile.version,
            ...(baseDistrict ? { base_district_id: +baseDistrict } : {}),
          },
          "PATCH",
        );
        await reload();
      }}
    >
      {(e) => (
        <>
          <ResourceState resource={districts} />
          <Field label="Distrito base" name="base_district_id" errors={e}>
            <select
              value={baseDistrict}
              onChange={(event) => setBaseDistrict(event.target.value)}
            >
              <option value="">Selecciona un distrito activo</option>
              {districts.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Biografía" name="bio" errors={e}>
            <textarea value={bio} onChange={(x) => setBio(x.target.value)} />
          </Field>
          <Field label="Forma de trabajo" name="work_style" errors={e}>
            <textarea value={workStyle} rows={3} onChange={(x) => setWorkStyle(x.target.value)} />
          </Field>
          <small className="muted">Cómo atiendes: diagnóstico, cotización y limpieza. Hasta 500 caracteres.</small>
          <Field label="Garantía" name="warranty_text" errors={e}>
            <textarea value={warranty} rows={2} onChange={(x) => setWarranty(x.target.value)} />
          </Field>
          <small className="muted">Solo si la ofreces. Hasta 300 caracteres.</small>
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
        validate={() => {
          if (!media) return { media_id: ["Sube un documento."] };
          if (type.trim().length < 2 || type.length > 60)
            return { document_type: ["Indica entre 2 y 60 caracteres."] };
          if (
            profile.documents?.filter((d) => d.review_status !== "rejected")
              .length >= 5
          )
            return { media_id: ["Máximo 5 documentos vigentes."] };
          return {};
        }}
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
    if (validatePerformedOn(v.performed_on))
      e.performed_on = [validatePerformedOn(v.performed_on)];
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
            subcategory_id: v.subcategory_id ? +v.subcategory_id : null,
            performed_on: v.performed_on || null,
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
              {item.subcategory_id &&
                !subcategories.some((s) => s.id === item.subcategory_id) && (
                  <option value={item.subcategory_id}>
                    Subcategoría anterior (inactiva)
                  </option>
                )}
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
/**
 * Fase T2 del panel del técnico: con `only` («profile», «verification», «portfolio», «availability» o «services») muestra
 * solo esa parte, sin pestañas, como sección propia del menú «Mi negocio»; onSaved avisa al menú. El rediseño llega en la T4.
 */
export default function TechnicianPanel({ only, onSaved } = {}) {
  const r = useResource("/technicians/me/profile"),
    catalog = useSubcategories();
  const [selected, setTab] = useState("profile"),
    [edit, setEdit] = useState(null),
    [notice, setNotice] = useState("");
  const tab = only || selected;
  const p = r.data;
  const reload = async () => {
    await r.reload();
    onSaved?.();
  };
  return (
    <section className="s02-panel">
      {!only && <h2>Mi espacio técnico</h2>}
      {notice && <output>{notice}</output>}
      <ResourceState resource={r} />
      {!only && <nav aria-label="Gestión del técnico">
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
      </nav>}
      {p && (
        <>
          {(!only || only === "verification") && <>
          <p>
            {technicianState(
              p.verification_status === "rejected" ? "rejected" : p.status,
            )}
          </p>
          {p.last_review && <p>Última revisión: {p.last_review.reason}</p>}
          {p.verification_status === "rejected" && (
            <MutationForm
              label="Solicitar nueva revisión"
              reload={reload}
              onSave={async () => {
                await request("/technicians/me/verification-request", {
                  expected_version: p.version,
                });
                await reload();
              }}
            />
          )}
          </>}
          {tab === "profile" && (
            <>
              <Bio profile={p} reload={reload} />
              {!only && <Documents profile={p} reload={reload} />}
            </>
          )}
          {tab === "verification" && <Documents profile={p} reload={reload} />}
          {tab === "availability" && (
            <AvailabilityEditor profile={p} reload={reload} />
          )}{" "}
          {tab === "services" && (
            <ServicesEditor profile={p} reload={reload} />
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
                  reload={reload}
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
                      reload={reload}
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
