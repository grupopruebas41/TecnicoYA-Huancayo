import React, { useState } from "react";
import { request } from "./http";
import { Field, Notice } from "./forms";
import RetireButton from "./RetireButton";
import {
  MutationForm,
  AnnouncementPreview,
  useResource,
  ResourceState,
} from "./Sprint02Common";
import { validateAnnouncement } from "./sprint02Validation";
const localDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
function Editor({ item = {}, reload }) {
  const [v, set] = useState({
    title: item.title || "",
    body: item.body || "",
    audiences: item.audiences || [],
    starts_at: localDate(item.starts_at),
    ends_at: localDate(item.ends_at),
    priority: item.priority || 0,
    link_url: item.link_url || "",
    link_label: item.link_label || "",
  });
  React.useEffect(()=>{if(item.id)set({title:item.title||'',body:item.body||'',audiences:item.audiences||[],starts_at:localDate(item.starts_at),ends_at:localDate(item.ends_at),priority:item.priority||0,link_url:item.link_url||'',link_label:item.link_label||''})},[item.version]);
  const update = (k, x) => set({ ...v, [k]: x });
  return (
    <MutationForm
      reload={reload}
      validate={() => validateAnnouncement(v)}
      onSave={async () => {
        await request(
          "/admin/announcements" + (item.id ? "/" + item.id : ""),
          {
            ...v,
            priority: +v.priority,
            link_url: v.link_url || null,
            link_label: v.link_label || null,
            starts_at: new Date(v.starts_at).toISOString(),
            ends_at: new Date(v.ends_at).toISOString(),
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
            name="title"
            label="Título"
            errors={errors}
            value={v.title}
            onChange={(e) => update("title", e.target.value)}
          />
          <Field name="body" label="Contenido" errors={errors}>
            <textarea
              value={v.body}
              onChange={(e) => update("body", e.target.value)}
            />
          </Field>
          <fieldset>
            <legend>Audiencia</legend>
            {[
              ["client", "Clientes"],
              ["technician", "Técnicos"],
            ].map(([code, label]) => (
              <label key={code}>
                <input
                  type="checkbox"
                  checked={v.audiences.includes(code)}
                  onChange={(e) =>
                    update(
                      "audiences",
                      e.target.checked
                        ? [...v.audiences, code]
                        : v.audiences.filter((x) => x !== code),
                    )
                  }
                />
                {label}
              </label>
            ))}
          </fieldset>
          {[
            ["starts_at", "Inicio de vigencia", "datetime-local"],
            ["ends_at", "Fin de vigencia", "datetime-local"],
            ["priority", "Prioridad", "number"],
            ["link_url", "Enlace", "url"],
            ["link_label", "Texto del enlace", "text"],
          ].map(([key, label, type]) => (
            <Field
              key={key}
              name={key}
              label={label}
              type={type}
              errors={errors}
              value={v[key]}
              onChange={(e) => update(key, e.target.value)}
            />
          ))}
          <AnnouncementPreview value={v} />
        </>
      )}
    </MutationForm>
  );
}
function AnnouncementRow({ item, reload, onEdit, onRetired }) {
  return (
    <article className="s02-card">
      <h3>{item.title}</h3>
      <p>
        {item.retired_at
          ? "Retirado"
          : item.status === "draft"
            ? "Borrador"
            : "Publicado"}
      </p>
      <AnnouncementPreview value={item} />
      {!item.retired_at && item.status === "draft" && (
        <>
          <button type="button" onClick={() => onEdit(item)}>
            Editar borrador
          </button>
          <MutationForm
            label="Publicar"
            reload={reload}
            onSave={async () => {
              await request(
                "/admin/announcements/" + item.id + "/publication",
                { expected_version: item.version },
              );
              await reload();
            }}
          />
        </>
      )}
      <MutationForm
        label="Duplicar"
        reload={reload}
        onSave={async () => {
          await request(
            "/admin/announcements/" + item.id + "/duplicates",
            {},
            "POST",
          );
          await reload();
        }}
      />
      {!item.retired_at && (
        <RetireButton
          label="Eliminar comunicado"
          onRetired={onRetired}
          path={"/admin/announcements/" + item.id}
          reload={reload}
        />
      )}{" "}
    </article>
  );
}
export default function AnnouncementsAdmin() {
  const r = useResource("/admin/announcements");
  const [edit, setEdit] = useState(null);
  const [notice, setNotice] = useState("");
  const reload = async () => {const rows=await r.reload();setEdit(prev=>prev?.id?rows?.find(x=>x.id===prev.id)||prev:prev);return rows};
  return (
    <section className="s02-panel">
      <h2>Administrar comunicados</h2>
      <Notice success={notice} />
      <ResourceState resource={r} />
      <button type="button" onClick={() => setEdit({})}>
        Crear comunicado
      </button>
      {edit && (
        <div className="s02-card">
          <Editor
            key={edit.id || "new"}
            item={edit}
            reload={reload}
          />
          <button type="button" onClick={() => setEdit(null)}>
            Cerrar editor
          </button>
        </div>
      )}
      {r.data?.length === 0 && <p>No hay comunicados.</p>}
      {r.data?.map((x) => (
        <AnnouncementRow
          key={x.id}
          item={x}
          reload={reload}
          onEdit={setEdit}
          onRetired={() => setNotice("Contenido retirado.")}
        />
      ))}
    </section>
  );
}
