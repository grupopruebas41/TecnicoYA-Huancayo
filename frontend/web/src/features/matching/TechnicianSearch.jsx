import React, { useEffect, useState } from "react";
import { request } from "../administration/http";
import { Notice } from "../administration/forms";
import { useResource, ResourceState } from "../administration/Sprint02Common";
import { searchQuery, changeFilters } from "./searchQuery";
import TechnicianCard from "./TechnicianCard";
import TechnicianProfile from "./TechnicianProfile";
export default function TechnicianSearch({ onRequest, initialFilters = {} }) {
  const [filters, setFilters] = useState({ ...initialFilters, page: 1 }),
    [result, setResult] = useState(null),
    [error, setError] = useState(""),
    [selected, setSelected] = useState(null),
    [retry, setRetry] = useState(0),
    [subcategories, setSubcategories] = useState([]);
  const specialties = useResource("/catalog/specialties"),
    districts = useResource("/catalog/districts");
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
    setResult(null);
    setError("");
    request("/technicians?" + searchQuery(filters))
      .then((r) => {
        if (active) setResult(r.data);
      })
      .catch((error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [filters, retry]);
  const change = (name, value) =>
    setFilters((current) => changeFilters(current, name, value));
  if (selected)
    return (
      <TechnicianProfile
        id={selected}
        onRequest={onRequest}
        onBack={() => setSelected(null)}
      />
    );
  return (
    <section aria-label="Buscar técnicos">
      <h2>Buscar técnicos</h2>
      <p>
        Explora perfiles por especialidad y zona. El orden no es un ranking.
      </p>
      <ResourceState resource={specialties} />
      <ResourceState resource={districts} />
      <div className="request-filters">
        {[
          ["specialty_id", "Rubro", specialties.data || []],
          ["subcategory_id", "Servicio", subcategories],
          ["district_id", "Zona", districts.data || []],
        ].map(([name, label, items]) => (
          <label key={name}>
            {label}
            <select
              value={filters[name] || ""}
              onChange={(e) => change(name, e.target.value)}
            >
              <option value="">Todos</option>
              {items.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label>
          Calificación mínima
          <select
            value={filters.min_rating || ""}
            onChange={(e) => change("min_rating", e.target.value)}
          >
            <option value="">Cualquiera</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} de 5
              </option>
            ))}
          </select>
        </label>
      </div>
      <Notice error={error} />
      {error && (
        <button type="button" onClick={() => setRetry(retry + 1)}>
          Reintentar búsqueda
        </button>
      )}
      {!error && !result && <output>Buscando técnicos…</output>}
      {result?.items.length === 0 && (
        <p>No hay técnicos que coincidan con los filtros elegidos.</p>
      )}
      <div className="s02-list">
        {result?.items.map((t) => (
          <TechnicianCard key={t.id} technician={t} onOpen={setSelected} />
        ))}
      </div>
      {result && (
        <nav aria-label="Páginas de técnicos">
          <button
            type="button"
            disabled={result.pagination.page <= 1}
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
          >
            Página anterior
          </button>
          <span>
            Página {result.pagination.page} de{" "}
            {Math.max(1, result.pagination.last_page)}
          </span>
          <button
            type="button"
            disabled={result.pagination.page >= result.pagination.last_page}
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
          >
            Página siguiente
          </button>
        </nav>
      )}
    </section>
  );
}
