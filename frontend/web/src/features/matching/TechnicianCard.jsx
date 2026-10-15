import React from "react";
export default function TechnicianCard({ technician, onOpen = () => {} }) {
  return (
    <article className="s02-card" data-cy="technician-card">
      <h3>{technician.display_name}</h3>
      <p>{technician.experience_years} años de experiencia</p>
      <p>
        {technician.rating?.average == null
          ? "Sin calificaciones aún"
          : technician.rating.average +
            " de 5 · " +
            technician.rating.count +
            " calificaciones"}
      </p>
      <ul>
        {technician.services?.map((s) => (
          <li key={s.subcategory_id}>{s.subcategory_name}</li>
        ))}
      </ul>
      <p>{technician.districts?.map((d) => d.name).join(", ")}</p>
      <button type="button" onClick={() => onOpen(technician.id)}>
        Ver perfil de {technician.display_name}
      </button>
    </article>
  );
}
