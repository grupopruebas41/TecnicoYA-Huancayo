import React, { useState } from "react";
import { request } from "./http";
import { Field } from "./forms";
import {
  MutationForm,
  Upload,
  useResource,
  ResourceState,
} from "./Sprint02Common";
import { validateSubcategory, validateReferenceFee } from "./sprint02Validation";
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
        const payload =
          kind === "districts"
            ? { name: v.name }
            : kind === "specialties"
              ? {
                  name: v.name,
                  description: v.description,
                  image_id: v.image_id,
                }
              : {
                  ...v,
                  specialty_id: +v.specialty_id,
                  reference_fee: v.reference_fee || null,
                };
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
                  value={v.specialty_id}
                  onChange={(e) => update("specialty_id", e.target.value)}
                >
                  <option value="">Selecciona</option>
                  {specialties
                    .filter((s) => s.active)
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
export default function CatalogAdmin() {
  const catalog = useResource("/admin/specialties"),
    districts = useResource("/admin/districts");
  const [kind, setKind] = useState("specialties"),
    [editing, setEditing] = useState(null);
  const names = {
    specialties: "Especialidades",
    subcategories: "Subcategorías",
    districts: "Distritos",
  };
  const reload = async () => {
    const fresh = await catalog.reload();
    const zones = await districts.reload();
    setEditing(previous => {
      if(!previous?.id) return previous;
      const rows=kind==='districts'?zones:kind==='specialties'?fresh:(fresh||[]).flatMap(s=>(s.subcategories||[]).map(x=>({...x,specialty_id:s.id})));
      return rows?.find(x=>x.id===previous.id)||previous;
    });
    return fresh;
  };
  const rows =
    kind === "districts"
      ? districts.data || []
      : kind === "specialties"
        ? catalog.data || []
        : (catalog.data || []).flatMap((s) =>
            (s.subcategories || []).map((x) => ({ ...x, specialty_id: s.id })),
          );
  return (
    <section className="s02-panel">
      <h2>Administrar catálogo</h2>
      <nav aria-label="Tipo de catálogo">
        {Object.entries(names).map(([k, n]) => (
          <button
            type="button"
            key={k}
            aria-pressed={kind === k}
            onClick={() => {
              setKind(k);
              setEditing(null);
            }}
          >
            {n}
          </button>
        ))}
      </nav>
      <ResourceState resource={catalog} />
      <ResourceState resource={districts} />
      <button type="button" onClick={() => setEditing({})}>
        Crear{" "}
        {kind === "specialties"
          ? "especialidad"
          : kind === "subcategories"
            ? "subcategoría"
            : "distrito"}
      </button>
      {editing && (
        <div className="s02-card">
          <h3>
            {editing.id ? "Editar" : "Crear"} {names[kind].toLowerCase()}
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
      <div className="s02-list">
        {rows.map((row) => (
          <article key={row.id} className="s02-card">
            <h3>{row.name}</h3>
            {row.image_url && (
              <img src={row.image_url} alt={"Imagen de " + row.name} />
            )}
            <p>{row.active ? "Activo" : "Inactivo"}</p>
            <button type="button" onClick={() => setEditing(row)}>
              Editar {row.name}
            </button>
            <MutationForm
              label={row.active ? "Desactivar" : "Activar"}
              reload={reload}
              onSave={async () => {
                await request(
                  "/admin/" + kind + "/" + row.id,
                  { active: !row.active, expected_version: row.version },
                  "PATCH",
                );
                await reload();
              }}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
