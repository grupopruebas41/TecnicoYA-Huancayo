import React from "react";
export function feeLabel(amount) {
  const [whole, decimal] = Number(amount).toFixed(2).split(".");
  return `S/ ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ")},${decimal} (referencial)`;
}
export default function CandidateCard({
  candidate,
  onChoose,
  disabled = false,
}) {
  const { technician, distance, estimate, reference_fee, tie_group } =
    candidate;
  return (
    <article className="s02-card">
      <h3>{technician.display_name}</h3>
      {tie_group && <p>Empate</p>}
      <p>
        {reference_fee
          ? feeLabel(reference_fee.amount)
          : "Tarifa no disponible"}
      </p>
      <p>
        {distance
          ? `≈ ${Number(distance.km).toLocaleString("es-PE").replace(".", ",")} km · aproximada por zona`
          : "Distancia no disponible"}
      </p>
      <p>
        {estimate?.status === "estimated"
          ? `Tiempo estimado: ${Math.floor(estimate.minutes / 60)} h ${estimate.minutes % 60} min`
          : "Nuevo · sin estimación"}
      </p>
      {onChoose && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChoose(candidate)}
        >
          Elegir a {technician.display_name}
        </button>
      )}
    </article>
  );
}
