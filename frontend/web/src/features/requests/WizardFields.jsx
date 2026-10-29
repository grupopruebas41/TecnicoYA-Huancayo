import React from "react";
import { Field } from "../administration/forms";
import Icon from "../panel/icons";
import { specialtyIcon } from "../client/specialtyIcon";
// D-92: sin fotos; cada tarjeta lleva un ícono de línea de la misma familia del panel.
// Revisión del PR #39: especialidad y subcategoría como tarjetas seleccionables (radios nativos: teclado y lectores de
// pantalla sin dependencias). El foco de validación cae en el primer radio, que lleva aria-invalid.
function ChoiceCards({ name, label, items, value, onChange, disabled, error, icon }) {
  return (
    <fieldset className="choice-cards" disabled={disabled} aria-describedby={error ? `${name}-error` : undefined}>
      <legend>{label}</legend>
      <div className="choice-grid">
        {items.map((item, index) => {
          const checked = String(value) === String(item.id);
          return (
            <label key={item.id} className={"choice-card" + (checked ? " is-checked" : "")}>
              <input
                type="radio"
                name={name}
                value={item.id}
                checked={checked}
                aria-invalid={error && index === 0 ? true : undefined}
                onChange={(e) => onChange(e.target.value)}
              />
              <span className="choice-icon" aria-hidden="true"><Icon name={icon(item)} /></span>
              <span className="choice-name">{item.name}</span>
            </label>
          );
        })}
      </div>
      {error && <span className="field-error" id={`${name}-error`}>{error}</span>}
    </fieldset>
  );
}
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
  const cards = (name, label, items) => (
    <ChoiceCards
      name={name}
      label={label}
      items={items}
      value={state[name] || ""}
      disabled={registered}
      error={errors[name]}
      icon={name === "specialty_id" ? (item) => specialtyIcon(item.name) : () => "requests"}
      onChange={(value) => update(name, value)}
    />
  );
  if (state.step === 1) return cards("specialty_id", "Especialidad", specialties);
  if (state.step === 2) return cards("subcategory_id", "Subcategoría", subcategories);
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
