import React, { useState } from "react";
import RequestWizard from "./RequestWizard";
import MyRequests from "./MyRequests";
import TechnicianSearch from "../matching/TechnicianSearch";
import "./requests.css";
import {consumeSearch} from "../../landing/config";
export default function ClientPortal() {
  const [searchIntent] = useState(consumeSearch);
  const [workBusy, setWorkBusy] = useState(false);
  const [view, setView] = useState(searchIntent ? "search" : "list"),
    [draft, setDraft] = useState(null),
    [target, setTarget] = useState(null),
    [instance, setInstance] = useState(0);
  function begin(record = null, technician = null) {
    setDraft(record);
    setTarget(technician);
    setInstance((n) => n + 1);
    setView("new");
  }
  return (
    <div className="s02-panel client-requests">
      <nav className="s02-nav" aria-label="Gestión del cliente">
        <button
          type="button"
          disabled={workBusy}
          aria-pressed={view === "new"}
          onClick={() => begin()}
        >
          Nueva solicitud
        </button>
        <button
          type="button"
          disabled={workBusy}
          aria-pressed={view === "search"}
          onClick={() => setView("search")}
        >
          Buscar técnicos
        </button>
        <button
          type="button"
          disabled={workBusy}
          aria-pressed={view === "list"}
          onClick={() => setView("list")}
        >
          Mis solicitudes
        </button>
      </nav>
      {view === "new" && (
        <RequestWizard
          key={instance}
          initialRecord={draft}
          target={target}
          onBusy={setWorkBusy}
          onExit={() => {
            setWorkBusy(false);
            setView("list");
          }}
        />
      )}
      {view === "list" && <MyRequests onContinue={(record) => begin(record)} />}
      {view === "search" && (
        <TechnicianSearch initialFilters={searchIntent || {}} onRequest={(technician) => begin(null, technician)} />
      )}
    </div>
  );
}
