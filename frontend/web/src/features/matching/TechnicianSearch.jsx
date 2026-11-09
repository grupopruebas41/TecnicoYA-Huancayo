import React, { useEffect, useState } from "react";
import { request } from "../administration/http";
import { Notice } from "../administration/forms";
import { useResource, ResourceState } from "../administration/Sprint02Common";
import { searchQuery, changeFilters, withProximity } from "./searchQuery";
import { MAX_FEES } from "../client/clientRules";
import { specialtyIcon } from "../client/specialtyIcon";
import ProblemSearch from "../client/ProblemSearch";
import Icon from "../panel/icons";
import TechnicianCard from "./TechnicianCard";
import TechnicianProfile from "./TechnicianProfile";
import Pagination from "../client/Pagination";
import { SORT_NOTICES, saveFavorite, specialtySlug } from "./technicianView";
import "./search.css";

const SKELETONS = 3;

/**
 * Buscar técnicos (RF-C06; D-88 y D-101, Fase 3): encabezado con «¿Qué se malogró?» y las especialidades como tarjetas,
 * barra fija de chips (zona, servicio, tarifa máxima, calificación mínima y «Disponible hoy»), orden por cercanía, precio
 * o experiencia con su aviso honesto, tarjetas con corazón de favoritos, skeleton al cargar y estado vacío con sugerencias.
 * initialTechnician: «Ver perfil» desde el Inicio abre directamente ese perfil (la búsqueda queda detrás de «Volver»).
 */
export default function TechnicianSearch({ onRequest, onNewRequest, initialFilters = {}, defaultDistrictId = null, initialTechnician = null }) {
  const [filters, setFilters] = useState({ ...initialFilters, page: 1 }),
    [result, setResult] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [selected, setSelected] = useState(initialTechnician),
    [retry, setRetry] = useState(0),
    [subcategories, setSubcategories] = useState([]),
    [favorites, setFavorites] = useState({}),
    [notice, setNotice] = useState({});
  const specialties = useResource("/catalog/specialties"),
    districts = useResource("/catalog/districts");
  const origin = filters.district_id || defaultDistrictId;
  const sort = ["price", "experience"].includes(filters.sort) ? filters.sort : origin ? "proximity" : "name";
  useEffect(() => {
    let active = true;
    setSubcategories([]);
    if (filters.specialty_id)
      request("/catalog/subcategories?specialty_id=" + filters.specialty_id)
        .then((r) => {
          if (active) setSubcategories(r.data);
        })
        .catch((error) => {
          if (active) setError(error.message);
        });
    return () => {
      active = false;
    };
  }, [filters.specialty_id]);
  useEffect(() => {
    let active = true;
    // La página anterior se conserva mientras carga la siguiente: la paginación no desaparece al cambiar de página.
    setLoading(true);
    setError("");
    request("/technicians?" + searchQuery(withProximity(filters, defaultDistrictId)))
      .then((r) => {
        if (active) setResult(r.data);
      })
      .catch((error) => {
        if (active) {
          setResult(null);
          setError(error.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters, retry, defaultDistrictId]);
  const change = (name, value) => setFilters((current) => changeFilters(current, name, value));
  const isFavorite = (t) => favorites[t.id] ?? t.favorite;
  async function toggleFavorite(technician, next) {
    setFavorites((current) => ({ ...current, [technician.id]: next }));
    setNotice({});
    try {
      setNotice({ success: await saveFavorite(technician, next) });
    } catch (failure) {
      setFavorites((current) => ({ ...current, [technician.id]: !next }));
      setNotice({ error: failure.message });
    }
  }
  if (selected)
    return (
      <TechnicianProfile
        id={selected.id}
        preview={selected}
        favorite={isFavorite(selected)}
        onFavorite={(t, next) => setFavorites((current) => ({ ...current, [t.id]: next }))}
        onRequest={onRequest}
        onBack={() => setSelected(null)}
      />
    );
  const filtered = Object.entries(filters).some(([key, value]) => key !== "page" && key !== "sort" && value !== "" && value != null);
  return (
    <section aria-label="Buscar técnicos" aria-busy={loading} className="search-page">
      <header className="search-hero">
        <h2>Buscar técnicos</h2>
        <p className="muted">Cuéntanos qué se malogró o elige una especialidad. Verás técnicos verificados de tu zona.</p>
        <ProblemSearch onSelect={({ specialty_id, subcategory_id }) =>
          setFilters((current) => ({ ...current, specialty_id: String(specialty_id), subcategory_id: String(subcategory_id), page: 1 }))} />
        <div className="search-specialties" role="group" aria-label="Especialidades">
          {(specialties.data || []).map((s) => {
            const pressed = String(filters.specialty_id || "") === String(s.id);
            return (
              <button key={s.id} type="button" className="search-specialty" data-specialty={specialtySlug(s.name)} aria-pressed={pressed}
                onClick={() => change("specialty_id", pressed ? "" : String(s.id))}>
                <span className="search-specialty-icon" aria-hidden="true"><Icon name={specialtyIcon(s.name)} /></span>
                <span>{s.name}</span>
              </button>
            );
          })}
        </div>
      </header>
      <ResourceState resource={specialties} />
      <ResourceState resource={districts} />
      <div className="search-filters" role="group" aria-label="Filtros">
        <label className="search-chip">
          <span>Zona</span>
          <select value={filters.district_id || ""} onChange={(e) => change("district_id", e.target.value)}>
            <option value="">Todas</option>
            {(districts.data || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
        {filters.specialty_id && (
          <label className="search-chip">
            <span>Servicio</span>
            <select value={filters.subcategory_id || ""} onChange={(e) => change("subcategory_id", e.target.value)}>
              <option value="">Todos</option>
              {subcategories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
        )}
        <label className="search-chip">
          <span>Tarifa máxima</span>
          <select value={filters.max_fee || ""} onChange={(e) => change("max_fee", e.target.value)}>
            <option value="">Cualquiera</option>
            {MAX_FEES.map((fee) => <option key={fee} value={fee}>Hasta S/ {fee}</option>)}
          </select>
        </label>
        <label className="search-chip">
          <span>Calificación mínima</span>
          <select value={filters.min_rating || ""} onChange={(e) => change("min_rating", e.target.value)}>
            <option value="">Cualquiera</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} de 5</option>)}
          </select>
        </label>
        <button type="button" className="search-chip search-toggle" aria-pressed={!!filters.available_today}
          onClick={() => change("available_today", filters.available_today ? "" : "1")}>
          <Icon name="clock" /> Disponible hoy
        </button>
        <label className="search-chip search-sort">
          <span>Ordenar por</span>
          <select id="search-sort" value={sort} onChange={(e) => change("sort", e.target.value === "name" || e.target.value === "proximity" ? "" : e.target.value)}>
            {origin ? <option value="proximity">Cercanía</option> : <option value="name">Nombre</option>}
            <option value="price">Precio</option>
            <option value="experience">Experiencia</option>
          </select>
        </label>
      </div>
      <p className="muted search-notice">
        {SORT_NOTICES[sort] || "Explora perfiles por especialidad y zona. Registra tu distrito principal en Mi perfil para verlos por cercanía."}
      </p>
      <Notice error={error || notice.error} success={notice.success} />
      {error && (
        <button type="button" onClick={() => setRetry(retry + 1)}>
          Reintentar búsqueda
        </button>
      )}
      {!error && loading && <output className="sr-only">Buscando técnicos…</output>}
      {!error && loading && !result && (
        <div className="s02-list client-technician-list" aria-hidden="true">
          {Array.from({ length: SKELETONS }, (_, i) => <div key={i} className="search-skeleton"><span /><span /><span /></div>)}
        </div>
      )}
      {result?.items.length === 0 && (
        <div className="search-empty" role="status">
          <span className="search-empty-icon" aria-hidden="true"><Icon name="search" /></span>
          <p><strong>No hay técnicos que coincidan con los filtros elegidos.</strong></p>
          <ul className="muted">
            <li>Prueba con otra zona o con una tarifa máxima más alta.</li>
            <li>Quita «Disponible hoy»: muchos técnicos atienden con cita.</li>
            <li>Publica una solicitud y te avisamos cuando un técnico la acepte.</li>
          </ul>
          <div className="search-empty-actions">
            {filtered && <button type="button" className="button outline" onClick={() => setFilters({ page: 1 })}>Quitar filtros</button>}
            {onNewRequest && <button type="button" className="button primary" onClick={onNewRequest}>Publicar una solicitud</button>}
          </div>
        </div>
      )}
      <div className="s02-list client-technician-list">
        {result?.items.map((t) => (
          <TechnicianCard key={t.id} technician={t} favorite={isFavorite(t)} onFavorite={toggleFavorite}
            onOpen={() => setSelected(t)} />
        ))}
      </div>
      {result && (
        <Pagination
          label="Páginas de técnicos"
          page={result.pagination.page}
          lastPage={result.pagination.last_page}
          disabled={loading}
          onChange={(page) => setFilters({ ...filters, page })}
        />
      )}
    </section>
  );
}
