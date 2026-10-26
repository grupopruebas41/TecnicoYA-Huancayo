import React, { useState } from "react";
import { request } from "./http";
import { Notice } from "./forms";
import { useResource, ResourceState } from "./Sprint02Common";
import AnnouncementEditor from "../announcements/AnnouncementEditor";
import AnnouncementList from "../announcements/AnnouncementList";
import CarouselOrder from "../announcements/CarouselOrder";
import "../announcements/announcements.css";

// Comunicados en carrusel (D-83): listado en cuadrícula, orden del carrusel por audiencia y editor en dos columnas.
export default function AnnouncementsAdmin() {
  const r = useResource("/admin/announcements");
  const [tab, setTab] = useState("list");
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  // Ejecuta una acción del listado o del orden y recarga; el aviso de éxito o de error queda arriba.
  async function run(args, message) {
    setNotice(""); setError("");
    try {
      await request(...args);
      setNotice(message);
    } catch (failure) {
      setError(failure.message);
    }
    await r.reload();
  }
  if (editing) {
    return <AnnouncementEditor key={editing.id || "nuevo"} item={editing.id ? editing : null} onClose={() => setEditing(null)}
      onSaved={async (message) => { setEditing(null); setError(""); setNotice(message); await r.reload(); }} />;
  }
  return (
    <section className="s02-panel announcements-admin">
      <header className="announcements-admin-head">
        <h2>Administrar comunicados</h2>
        <button type="button" className="button primary" onClick={() => { setNotice(""); setEditing({}); }}>Crear comunicado</button>
      </header>
      <div className="announcement-tabs" role="tablist" aria-label="Vistas de comunicados">
        {[["list", "Comunicados"], ["order", "Orden del carrusel"]].map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)}>{label}</button>
        ))}
      </div>
      <Notice error={error} success={notice} />
      <ResourceState resource={r} />
      {r.data && (tab === "list"
        ? <AnnouncementList items={r.data} onEdit={setEditing} run={run} />
        : <CarouselOrder items={r.data} run={run} />)}
    </section>
  );
}
