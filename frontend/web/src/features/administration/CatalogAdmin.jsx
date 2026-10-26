import React, { useState } from "react";
import { request } from "./http";
import {
  MutationForm,
  Upload,
  useResource,
  ResourceState,
} from "./Sprint02Common";
import { validateSubcategory, validateReferenceFee } from "./sprint02Validation";
import ConfirmDialog from "../../components/ConfirmDialog";
import { Field, Notice } from "./forms";
import "./catalog-admin.css";
function catalogPayload(kind, value, editing) {
  if (kind === "districts") return { name: value.name };
  if (kind === "specialties") return { name: value.name, description: value.description, image_id: value.image_id };
  return {
    name: value.name,
    description: value.description,
    image_id: value.image_id,
    reference_fee: value.reference_fee || null,
    ...(!editing ? { specialty_id: +value.specialty_id } : {}),
  };
}
function catalogRows(kind, specialties, districts) {
  if (kind === "districts") return districts;
  if (kind === "specialties") return specialties;
  return (specialties || []).flatMap(s => (s.subcategories || []).map(x => ({...x, specialty_id: s.id, specialty_name: s.name})));
}
function CatalogEditor({ kind, item = {}, specialties = [], reload, onDone }) {
  const [v, set] = useState({
    name: item.name || "",
    description: item.description || "",
    specialty_id: item.specialty_id || "",
    reference_fee: item.reference_fee || "",
    image_id: item.image_id || null,
  });
  React.useEffect(()=>{if(item.id)set({name:item.name||'',description:item.description||'',specialty_id:item.specialty_id||'',reference_fee:item.reference_fee||'',image_id:item.image_id||null})},[item.version]);
  const update = (k, x) => set({ ...v, [k]: x });
  const validation = () => {
    const e = validateSubcategory({
      ...v,
      specialty_id: kind === "subcategories" ? v.specialty_id : 1,
    });
    if(kind==='subcategories'&&validateReferenceFee(v.reference_fee)) e.reference_fee=[validateReferenceFee(v.reference_fee)];
    return e;
  };
  return (
    <MutationForm
      reload={reload}
      validate={validation}
      onSuccess={onDone}
      onSave={async () => {
        const payload = catalogPayload(kind, v, Boolean(item.id));
        await request(
          "/admin/" + kind + (item.id ? "/" + item.id : ""),
          {
            ...payload,
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
            label="Nombre"
            name="name"
            errors={errors}
            value={v.name}
            onChange={(e) => update("name", e.target.value)}
          />
          {kind === "subcategories" && (
            <>
              <Field label="Especialidad" name="specialty_id" errors={errors}>
                <select
                  disabled={Boolean(item.id)}
                  value={v.specialty_id}
                  onChange={(e) => update("specialty_id", e.target.value)}
                >
                  <option value="">Selecciona</option>
                  {specialties
                    .filter((s) => s.active || (item.id && s.id === item.specialty_id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field
                label="Tarifa orientativa (S/)"
                name="reference_fee"
                value={v.reference_fee}
                onChange={(e) => update("reference_fee", e.target.value)}
              />
              <p>Referencia no vinculante. El técnico declara su tarifa.</p>
            </>
          )}
          {kind !== "districts" && (
            <>
              <Field label="Descripción" name="description" errors={errors}>
                <textarea
                  value={v.description}
                  onChange={(e) => update("description", e.target.value)}
                />
              </Field>
              <Upload
                purpose="catalog"
                onUploaded={(media) => update("image_id", media.id)}
              />
              {v.image_id && (
                <output>Imagen cargada y lista para guardar.</output>
              )}
            </>
          )}
        </>
      )}
    </MutationForm>
  );
}
const NAMES = {
  specialties: "Especialidades",
  subcategories: "Subcategorías",
  districts: "Distritos",
};
const SINGULAR = {specialties: "especialidad", subcategories: "subcategoría", districts: "distrito"};
// Búsqueda sin mayúsculas ni tildes: «camaras» encuentra «Cámaras».
const fold = text => (text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function feeLabel(fee) {
  return fee === null || fee === undefined || fee === "" ? "Sin tarifa" : "Desde S/ " + Number(fee).toFixed(2);
}
function rowDetail(kind, row) {
  if (kind === "subcategories") return feeLabel(row.reference_fee);
  if (kind === "specialties") {
    const count = (row.subcategories || []).length;
    return count + (count === 1 ? " subcategoría" : " subcategorías");
  }
  return null;
}
/** Interruptor de estado con confirmación (A2): Cancelar no envía nada; Confirmar guarda con la versión. */
function StatusSwitch({ kind, row, reload }) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const action = row.active ? "Desactivar" : "Activar";
  async function confirm() {
    if (busy) return;
    setBusy(true);
    try {
      await request("/admin/" + kind + "/" + row.id, { active: !row.active, expected_version: row.version }, "PATCH");
      setOpen(false);
      setSuccess("Cambios guardados.");
      await reload();
    } catch (failure) {
      setOpen(false);
      setError(failure.message);
      if (failure.status === 0) await reload();
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        type="button"
        role="switch"
        className="catalog-switch"
        aria-checked={Boolean(row.active)}
        aria-label={"Estado de " + row.name}
        disabled={busy}
        onClick={() => { setError(""); setSuccess(""); setOpen(true); }}
      />
      <div className="catalog-row-notice"><Notice error={error} success={success} /></div>
      {open && (
        <ConfirmDialog
          busy={busy}
          title={action + " " + SINGULAR[kind]}
          description={row.active
            ? "«" + row.name + "» dejará de mostrarse a clientes y técnicos. Podrás activarla de nuevo."
            : "«" + row.name + "» volverá a mostrarse en el catálogo."}
          onCancel={() => setOpen(false)}
          onConfirm={confirm}
        />
      )}
    </>
  );
}
function CatalogRow({ kind, row, onEdit, reload }) {
  const detail = rowDetail(kind, row);
  // Si la imagen no carga (archivo ausente o retirado), se muestra el marcador con la inicial.
  const [broken, setBroken] = useState(false);
  return (
    <article className={"catalog-row" + (kind === "districts" ? "" : " has-thumb")}>
      {kind !== "districts" && (row.image_url && !broken
        ? <img className="catalog-thumb" src={row.image_url} alt="" onError={() => setBroken(true)} />
        : <span className="catalog-thumb is-empty" aria-hidden="true">{Array.from(row.name)[0]}</span>)}
      <div className="catalog-main">
        <h3>{row.name}</h3>
        {kind === "subcategories" && <small>{row.specialty_name}</small>}
        {kind === "specialties" && row.description && <small>{row.description}</small>}
      </div>
      <div className="catalog-meta">
        {detail && <span className="catalog-fee">{detail}</span>}
        <p className={"catalog-status " + (row.active ? "is-active" : "is-inactive")}>{row.active ? "Activo" : "Inactivo"}</p>
      </div>
      <StatusSwitch kind={kind} row={row} reload={reload} />
      <button type="button" className="catalog-edit" aria-label={"Editar " + row.name} onClick={onEdit}>
        <span aria-hidden="true">✎</span> <span className="catalog-edit-text">Editar</span>
      </button>
    </article>
  );
}
export default function CatalogAdmin() {
  const catalog = useResource("/admin/specialties"),
    districts = useResource("/admin/districts");
  const [kind, setKind] = useState("specialties"),
    [editing, setEditing] = useState(null),
    [query, setQuery] = useState(""),
    [specialty, setSpecialty] = useState("");
  const reload = async () => {
    const fresh = await catalog.reload();
    const zones = await districts.reload();
    setEditing(previous => {
      if(!previous?.id) return previous;
      const rows = catalogRows(kind, fresh, zones);
      return rows?.find(x=>x.id===previous.id)||previous;
    });
    return fresh;
  };
  const rows = catalogRows(kind, catalog.data, districts.data) || [];
  const visible = rows.filter(row => (kind !== "subcategories" || !specialty || String(row.specialty_id) === specialty)
    && fold(row.name).includes(fold(query.trim())));
  return (
    <section className="s02-panel">
      <h2>Administrar catálogo</h2>
      <nav aria-label="Tipo de catálogo">
        {Object.entries(NAMES).map(([k, n]) => (
          <button
            type="button"
            key={k}
            aria-pressed={kind === k}
            onClick={() => {
              setKind(k);
              setEditing(null);
              setQuery("");
              setSpecialty("");
            }}
          >
            {n}
          </button>
        ))}
      </nav>
      <ResourceState resource={catalog} />
      <ResourceState resource={districts} />
      <div className="catalog-toolbar">
        <label className="catalog-search">
          <span>Buscar {NAMES[kind].toLowerCase()}</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nombre" />
        </label>
        {kind === "subcategories" && (
          <label>
            <span>Filtrar por especialidad</span>
            <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
              <option value="">Todas</option>
              {(catalog.data || []).map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
            </select>
          </label>
        )}
        <button type="button" className="catalog-create" onClick={() => setEditing({})}>
          Crear {SINGULAR[kind]}
        </button>
      </div>
      {editing && (
        <div className="s02-card">
          <h3>
            {editing.id ? "Editar" : "Crear"} {NAMES[kind].toLowerCase()}
          </h3>
          <CatalogEditor
            key={kind + "-" + (editing.id || "new")}
            kind={kind}
            item={editing}
            specialties={catalog.data || []}
            reload={reload}
          />
          <button type="button" onClick={() => setEditing(null)}>
            Cerrar editor
          </button>
        </div>
      )}
      {!rows.length && catalog.data && <p>No hay registros disponibles.</p>}
      {rows.length > 0 && <p className="catalog-count muted">{visible.length} de {rows.length}</p>}
      {rows.length > 0 && !visible.length && <p>{kind === "specialties" ? "Ninguna especialidad" : kind === "subcategories" ? "Ninguna subcategoría" : "Ningún distrito"} coincide con la búsqueda.</p>}
      <div className={"s02-list catalog-list" + (kind === "districts" ? " is-plain" : "")}>
        {visible.map((row) => (
          <CatalogRow key={row.id} kind={kind} row={row} reload={reload} onEdit={() => setEditing(row)} />
        ))}
      </div>
    </section>
  );
}
