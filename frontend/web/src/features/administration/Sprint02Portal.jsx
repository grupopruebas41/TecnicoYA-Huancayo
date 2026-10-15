import ClientPortal from '../requests/ClientPortal';
import React, { useState } from "react";
import CatalogAdmin from "./CatalogAdmin";
import AnnouncementsAdmin from "./AnnouncementsAdmin";
import VerificationAdmin from "./VerificationAdmin";
import TechnicianPanel from "./TechnicianPanel";
import RoleAnnouncements from "./RoleAnnouncements";
import "./sprint02.css";
export default function Sprint02Portal({ user }) {
  const [tab, setTab] = useState("");
  const role = user.role?.code;
  const items = [
    ["catalog.manage", "Catálogo", CatalogAdmin],
    ["announcements.manage", "Comunicados", AnnouncementsAdmin],
    ["technicians.verify", "Verificación", VerificationAdmin],
  ].filter(([permission]) => user.permissions?.includes(permission));
  const selected = items.find(([key]) => key === tab);
  const Panel = selected?.[2];
  return (
    <>
      <RoleAnnouncements key={user.id} />
      {role === "client" && <ClientPortal key={user.id} />}
      {role === "technician" && <TechnicianPanel />}
      {role === "admin" && (
        <>
          <nav className="s02-nav" aria-label="Administración">
            {items.map(([key, label]) => (
              <button
                type="button"
                key={key}
                aria-pressed={tab === key}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </nav>
          {Panel ? (
            <Panel />
          ) : (
            <p>Selecciona una herramienta de administración disponible.</p>
          )}
        </>
      )}
    </>
  );
}
