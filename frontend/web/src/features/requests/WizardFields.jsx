import React from "react";
import { Field } from "../administration/forms";
export default function WizardFields({
  state,
  update,
  errors,
  specialties,
  subcategories,
  districts,
  registered,
}) {
  const field = (name, label, props = {}) => (
    <Field
      name={name}
      label={label}
      errors={Object.fromEntries(
        Object.entries(errors).map(([k, v]) => [k, [v]]),
      )}
      value={state[name] || ""}
      onChange={(e) => update(name, e.target.value)}
      {...props}
    />
  );
  const select = (name, label, items, disabled = false) =>
    field(name, label, {
      children: (
        <select
          name={name}
          value={state[name] || ""}
          disabled={disabled}
          onChange={(e) => update(name, e.target.value)}
        >
          <option value="">Selecciona</option>
          {items.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      ),
    });
  if (registered && state.step < 3)
    return (
      <p>
        Servicio registrado. Conserva la especialidad y subcategoría elegidas.
      </p>
    );
  if (state.step === 1)
    return select("specialty_id", "Especialidad", specialties, registered);
  if (state.step === 2)
    return select("subcategory_id", "Subcategoría", subcategories, registered);
  if (state.step === 3)
    return (
      <>
        {field("description", "Descripción de la falla", {
          children: (
            <textarea
              name="description"
              rows={5}
              value={state.description}
              onChange={(e) => update("description", e.target.value)}
            />
          ),
        })}
        <p>{Array.from(state.description.trim()).length}/1000 caracteres</p>
      </>
    );
  return (
    <>
      {select("district_id", "Distrito", districts)}
      {field("address", "Dirección o referencia")}
      {select(
        "mode",
        "Modalidad",
        [
          { id: "asap", name: "Inmediata" },
          { id: "scheduled", name: "Programada" },
        ],
        registered,
      )}
      {state.mode === "scheduled" && (
        <>
          {field("preferred_start_at", "Inicio programado", {
            type: "datetime-local",
            disabled: registered,
          })}
          {field("preferred_end_at", "Fin programado", {
            type: "datetime-local",
            disabled: registered,
          })}
        </>
      )}
    </>
  );
}
