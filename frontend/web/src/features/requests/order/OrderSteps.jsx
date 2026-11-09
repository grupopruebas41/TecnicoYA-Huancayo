import React, { useEffect, useState } from "react";
import { request } from "../../administration/http";
import Icon from "../../panel/icons";
import { specialtyIcon } from "../../client/specialtyIcon";
import OrderPhotos from "./OrderPhotos";
import { DESCRIPTION_MAX, SLOTS, formatFee, itemErrors, limaNow } from "./orderModel";

const chars = (value) => Array.from((value || "").trim()).length;
const FieldError = ({ id, message }) => (message ? <span className="field-error" id={id}>{message}</span> : null);

/** Paso 1: especialidades como tarjetas con casilla (checkbox nativo: teclado y lector sin dependencias). */
export function SpecialtyStep({ specialties, selected, onToggle, error }) {
  return (
    <fieldset className="order-fieldset" aria-describedby={error ? "specialty_ids-error" : undefined}>
      <legend>Especialidades</legend>
      <div className="order-cards">
        {specialties.map((specialty, index) => {
          const checked = selected.includes(specialty.id);
          return (
            <label key={specialty.id} className={"order-card" + (checked ? " is-checked" : "")}>
              <input
                type="checkbox"
                name="specialty_ids"
                value={specialty.id}
                checked={checked}
                aria-invalid={error && index === 0 ? true : undefined}
                onChange={() => onToggle(specialty)}
              />
              <span className="order-card-check" aria-hidden="true"><Icon name="check" /></span>
              <span className="order-card-icon" aria-hidden="true"><Icon name={specialtyIcon(specialty.name)} /></span>
              <strong className="order-card-name">{specialty.name}</strong>
              {specialty.description && <span className="order-card-text">{specialty.description}</span>}
              {specialty.subcategory_count != null && (
                <small className="order-card-count">
                  {specialty.subcategory_count === 1 ? "1 subcategoría" : `${specialty.subcategory_count} subcategorías`}
                </small>
              )}
            </label>
          );
        })}
      </div>
      <FieldError id="specialty_ids-error" message={error} />
    </fieldset>
  );
}

/** Paso 2: subcategorías agrupadas por especialidad, con filtro y sin tope (D-95). */
export function SubcategoryStep({ groups, items, filter, onFilter, onToggle, error }) {
  const marked = new Set(items.flatMap((item) => item.subcategories.map((sub) => sub.id)));
  const term = filter.trim().toLocaleLowerCase("es");
  return (
    <div className="order-subcategories">
      <div className="order-toolbar">
        <div className="form-field order-filter">
          <label htmlFor="order-filter">Filtrar subcategorías</label>
          <input id="order-filter" type="search" value={filter} placeholder="Ej.: impresora" onChange={(e) => onFilter(e.target.value)} />
        </div>
      </div>
      <fieldset className="order-fieldset" aria-describedby={error ? "subcategory_ids-error" : undefined}>
        <legend className="sr-only">Subcategorías</legend>
        {groups.map(({ specialty, subcategories, loading }) => {
          const visible = subcategories.filter((sub) => !term || sub.name.toLocaleLowerCase("es").includes(term));
          return (
            <section key={specialty.id} className="order-group" aria-labelledby={`order-group-${specialty.id}`}>
              <h3 id={`order-group-${specialty.id}`}>
                <span className="order-group-icon" aria-hidden="true"><Icon name={specialtyIcon(specialty.name)} /></span>
                {specialty.name}
              </h3>
              {loading && <p className="muted">Cargando subcategorías…</p>}
              {!loading && !visible.length && <p className="muted">Ninguna subcategoría coincide con el filtro.</p>}
              <div className="order-rows">
                {visible.map((sub, index) => {
                  const checked = marked.has(sub.id);
                  return (
                    <label key={sub.id} className={"order-row" + (checked ? " is-checked" : "")}>
                      <input
                        type="checkbox"
                        name="subcategory_ids"
                        value={sub.id}
                        checked={checked}
                        aria-invalid={error && index === 0 ? true : undefined}
                        onChange={() => onToggle(sub, specialty)}
                      />
                      <span className="order-row-check" aria-hidden="true"><Icon name="check" /></span>
                      <span className="order-row-name">{sub.name}</span>
                      {sub.reference_fee != null && <span className="order-row-fee">{formatFee(sub.reference_fee)}</span>}
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })}
      </fieldset>
      <FieldError id="subcategory_ids-error" message={error} />
    </div>
  );
}

/** Paso 3: una pestaña por especialidad, con indicador de completo o pendiente y los síntomas de todas sus subcategorías. */
export function DetailStep({ items, active, onActive, symptoms, onItem, sameDescription, onSameDescription, errors, onBusy }) {
  const item = items.find((entry) => entry.specialty_id === active) || items[0];
  if (!item) return null;
  const own = errors[item.specialty_id] || {};
  const prefix = `item-${item.specialty_id}`;
  const list = item.subcategories.flatMap((sub) => symptoms[sub.id] || []);
  const tabKeys = (event, index) => {
    const move = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!move) return;
    event.preventDefault();
    const next = items[(index + move + items.length) % items.length];
    onActive(next.specialty_id);
    document.getElementById(`order-tab-${next.specialty_id}`)?.focus();
  };
  return (
    <div className="order-detail">
      <div className="order-tabs" role="tablist" aria-label="Especialidades del pedido">
        {items.map((entry, index) => {
          const done = !Object.keys(itemErrors(entry)).length;
          const selected = entry.specialty_id === item.specialty_id;
          return (
            <button
              key={entry.specialty_id}
              id={`order-tab-${entry.specialty_id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="order-tabpanel"
              tabIndex={selected ? 0 : -1}
              className={(done ? "is-done" : "is-pending") + (errors[entry.specialty_id] ? " is-invalid" : "")}
              onClick={() => onActive(entry.specialty_id)}
              onKeyDown={(event) => tabKeys(event, index)}
            >
              <Icon name={done ? "check" : "clock"} />
              <span>{entry.specialty_name}</span>
              <span className="sr-only">{done ? " (completo)" : " (pendiente)"}</span>
            </button>
          );
        })}
      </div>
      <div id="order-tabpanel" role="tabpanel" aria-labelledby={`order-tab-${item.specialty_id}`} className="order-panel">
        <p className="order-panel-title">
          {item.specialty_name} › <strong>{item.subcategories.map((sub) => sub.name).join(", ")}</strong>
        </p>
        {list?.length > 0 && (
          <div className="order-symptoms" role="group" aria-label="Problemas frecuentes">
            <span className="order-label">Problemas frecuentes (opcional)</span>
            <div className="order-chips">
              {list.map((symptom) => {
                const on = item.symptom_ids.includes(symptom.id);
                return (
                  <button
                    key={symptom.id}
                    type="button"
                    className={"order-chip" + (on ? " is-on" : "")}
                    aria-pressed={on}
                    onClick={() =>
                      onItem(item.specialty_id, "symptom_ids", on ? item.symptom_ids.filter((id) => id !== symptom.id) : [...item.symptom_ids, symptom.id])
                    }
                  >
                    {on && <Icon name="check" />}
                    {symptom.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="form-field">
          <label htmlFor={`${prefix}-description`}>Descripción de la falla</label>
          <textarea
            id={`${prefix}-description`}
            name="description"
            rows={5}
            value={item.description}
            aria-invalid={!!own.description}
            aria-describedby={own.description ? `${prefix}-description-error` : `${prefix}-description-count`}
            onChange={(e) => onItem(item.specialty_id, "description", e.target.value)}
          />
          <FieldError id={`${prefix}-description-error`} message={own.description} />
          <small className="muted" id={`${prefix}-description-count`}>{chars(item.description)}/{DESCRIPTION_MAX} caracteres</small>
        </div>
        {items.length > 1 && (
          <label className="order-inline-check">
            <input type="checkbox" checked={sameDescription} onChange={(e) => onSameDescription(e.target.checked, item.specialty_id)} />
            Usar la misma descripción para todas
          </label>
        )}
        <div className="order-pair">
          <div className="form-field">
            <label htmlFor={`${prefix}-brand`}>Marca (opcional)</label>
            <input id={`${prefix}-brand`} name="brand" maxLength={60} value={item.brand} aria-invalid={!!own.brand}
              onChange={(e) => onItem(item.specialty_id, "brand", e.target.value)} />
            <FieldError id={`${prefix}-brand-error`} message={own.brand} />
          </div>
          <div className="form-field">
            <label htmlFor={`${prefix}-model`}>Modelo (opcional)</label>
            <input id={`${prefix}-model`} name="model" maxLength={60} value={item.model} aria-invalid={!!own.model}
              onChange={(e) => onItem(item.specialty_id, "model", e.target.value)} />
            <FieldError id={`${prefix}-model-error`} message={own.model} />
          </div>
        </div>
        <fieldset className="order-fieldset order-urgency" aria-describedby={`${prefix}-urgency-help`}>
          <legend>Urgencia</legend>
          {[["normal", "Normal"], ["urgente", "Urgente"]].map(([value, text]) => (
            <label key={value} className={"order-option" + (item.urgency === value ? " is-checked" : "")}>
              <input type="radio" name={`${prefix}-urgency`} value={value} checked={item.urgency === value}
                onChange={() => onItem(item.specialty_id, "urgency", value)} />
              {text}
            </label>
          ))}
          <small className="muted" id={`${prefix}-urgency-help`}>Es informativa: el técnico la verá en la oferta; no cambia el orden de búsqueda.</small>
        </fieldset>
        <OrderPhotos key={item.specialty_id} label={item.specialty_name} photos={item.photos} onBusy={onBusy}
          onChange={(photos) => onItem(item.specialty_id, "photos", photos)} />
      </div>
    </div>
  );
}

/** Paso 4: ubicación y horario comunes a todo el pedido; franjas de Lima (D-92). */
export function LocationStep({ state, districts, onField, errors }) {
  const today = limaNow().date;
  const error = (name) => (errors[name] ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {});
  // Fase 4: «Mis direcciones» se ofrecen como atajo; si no cargan, el paso sigue igual.
  const [saved, setSaved] = useState([]);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => request("/client/addresses"))
      .then((result) => { if (active && Array.isArray(result?.data?.items)) setSaved(result.data.items); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  function use(address) {
    onField("district_id", String(address.district_id));
    onField("address", address.address);
    onField("address_reference", (address.reference || "").slice(0, 120));
  }
  return (
    <div className="order-location">
      {saved.length > 0 && (
        <div className="order-saved-addresses" role="group" aria-label="Mis direcciones">
          <p className="muted">Usar una dirección guardada:</p>
          {saved.map((address) => (
            <button key={address.id} type="button" className="button outline order-saved-address"
              aria-pressed={state.address === address.address && String(state.district_id) === String(address.district_id)}
              onClick={() => use(address)}>
              <strong>{address.label}</strong> <span>{address.address} · {address.district_name}</span>
            </button>
          ))}
        </div>
      )}
      <div className="order-pair">
        <div className="form-field">
          <label htmlFor="order-district">Distrito</label>
          <select id="order-district" name="district_id" value={state.district_id} {...error("district_id")}
            onChange={(e) => onField("district_id", e.target.value)}>
            <option value="">Selecciona</option>
            {districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
          </select>
          <FieldError id="district_id-error" message={errors.district_id} />
        </div>
        <div className="form-field">
          <label htmlFor="order-address">Dirección</label>
          <input id="order-address" name="address" value={state.address} autoComplete="street-address" {...error("address")}
            onChange={(e) => onField("address", e.target.value)} />
          <FieldError id="address-error" message={errors.address} />
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="order-reference">Referencia (opcional)</label>
        <input id="order-reference" name="address_reference" maxLength={120} value={state.address_reference} placeholder="Ej.: frente al parque"
          {...error("address_reference")} onChange={(e) => onField("address_reference", e.target.value)} />
        <FieldError id="address_reference-error" message={errors.address_reference} />
      </div>
      <fieldset className="order-fieldset">
        <legend>¿Cuándo?</legend>
        <div className="order-options">
          {[["asap", "Lo antes posible"], ["scheduled", "Programar"]].map(([value, text]) => (
            <label key={value} className={"order-option" + (state.mode === value ? " is-checked" : "")}>
              <input type="radio" name="mode" value={value} checked={state.mode === value} onChange={() => onField("mode", value)} />
              {text}
            </label>
          ))}
        </div>
      </fieldset>
      {state.mode === "scheduled" && (
        <div className="order-schedule">
          <div className="form-field">
            <label htmlFor="order-date">Fecha</label>
            <input id="order-date" type="date" name="scheduled_date" min={today} value={state.scheduled_date} {...error("scheduled_date")}
              onChange={(e) => onField("scheduled_date", e.target.value)} />
            <FieldError id="scheduled_date-error" message={errors.scheduled_date} />
          </div>
          <fieldset className="order-fieldset" aria-describedby={errors.time_slot ? "time_slot-error" : "order-slot-note"}>
            <legend>Franja</legend>
            <div className="order-options">
              {SLOTS.map((slot) => (
                <label key={slot.id} className={"order-option" + (state.time_slot === slot.id ? " is-checked" : "")}>
                  <input type="radio" name="time_slot" value={slot.id} checked={state.time_slot === slot.id}
                    aria-invalid={errors.time_slot && slot.id === SLOTS[0].id ? true : undefined}
                    onChange={() => onField("time_slot", slot.id)} />
                  {slot.label} <small>{slot.hours}</small>
                </label>
              ))}
            </div>
            <FieldError id="time_slot-error" message={errors.time_slot} />
          </fieldset>
          <p className="muted" id="order-slot-note">Hora de Lima. La disponibilidad del técnico se confirma en el matching.</p>
        </div>
      )}
    </div>
  );
}

const shorten = (text, max = 140) => (Array.from(text).length > max ? Array.from(text).slice(0, max).join("").trimEnd() + "…" : text);
export const slotText = (state) => {
  if (state.mode !== "scheduled") return "Lo antes posible";
  const slot = SLOTS.find((item) => item.id === state.time_slot);
  const date = state.scheduled_date ? new Date(state.scheduled_date + "T12:00:00Z").toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) : "";
  return `${date}${slot ? ` · ${slot.label} (${slot.hours})` : ""}`;
};

/** Paso 5: tarjeta por especialidad con sus subcategorías y «Editar», bloque común y aviso de cuántas solicitudes se crearán. */
export function SummaryStep({ state, districts, symptoms, onEdit, onConfirm, error }) {
  const district = districts.find((item) => String(item.id) === String(state.district_id));
  const count = state.items.length;
  return (
    <div className="order-summary">
      <p className="order-notice" role="note">
        {count === 1
          ? "Se creará 1 solicitud."
          : `Se crearán ${count} solicitudes, una por especialidad.`}
      </p>
      <div className="order-summary-grid">
        {state.items.map((item) => {
          const names = item.subcategories.flatMap((sub) => symptoms[sub.id] || []).filter((s) => item.symptom_ids.includes(s.id)).map((s) => s.name);
          return (
            <article key={item.specialty_id} className="order-summary-card" aria-label={`Especialidad ${item.specialty_name}`}>
              <header>
                <span className="order-card-icon" aria-hidden="true"><Icon name={specialtyIcon(item.specialty_name)} /></span>
                <h3>{item.specialty_name}</h3>
                <button type="button" className="text-button order-edit" onClick={() => onEdit(3, item.specialty_id)}>
                  <Icon name="edit" /> Editar<span className="sr-only"> {item.specialty_name}</span>
                </button>
              </header>
              <ul className="order-summary-subcategories">
                {item.subcategories.map((sub) => <li key={sub.id}>{sub.name}</li>)}
              </ul>
              {names.length > 0 && <p className="order-summary-symptoms">{names.join(" · ")}</p>}
              <p>{shorten(item.description.trim())}</p>
              <p className="muted">
                {item.urgency === "urgente" ? "Urgente" : "Urgencia normal"}
                {" · "}
                {item.photos.length === 1 ? "1 foto" : `${item.photos.length} fotos`}
                {(item.brand || item.model) && ` · ${[item.brand, item.model].filter(Boolean).join(" ")}`}
              </p>
            </article>
          );
        })}
      </div>
      <article className="order-summary-card order-summary-common" aria-label="Ubicación y horario">
        <header>
          <span className="order-card-icon" aria-hidden="true"><Icon name="home" /></span>
          <h3>Ubicación y horario</h3>
          <button type="button" className="text-button order-edit" onClick={() => onEdit(4)}>
            <Icon name="edit" /> Editar<span className="sr-only"> ubicación y horario</span>
          </button>
        </header>
        <p>{district?.name} · {state.address.trim()}{state.address_reference.trim() && ` (${state.address_reference.trim()})`}</p>
        <p className="muted">{slotText(state)}</p>
      </article>
      <label className="order-inline-check order-confirm">
        <input type="checkbox" name="confirmed" checked={state.confirmed} aria-invalid={!!error} aria-describedby={error ? "confirmed-error" : undefined}
          onChange={(e) => onConfirm(e.target.checked)} />
        Confirmo que el resumen es correcto
      </label>
      <FieldError id="confirmed-error" message={error} />
    </div>
  );
}

/** D-95: con el máximo de pedidos activos no se puede empezar otro. */
export function OrderBlocked({ max, onList, titleRef }) {
  return (
    <div className="order-blocked">
      <span className="order-done-icon" aria-hidden="true"><Icon name="clock" /></span>
      <h2 ref={titleRef} tabIndex={-1}>Ya tienes {max} pedidos activos</h2>
      <p>Podrás hacer otro cuando alguno se cierre.</p>
      <button type="button" className="button primary" onClick={onList}>Ver Mis solicitudes</button>
    </div>
  );
}

/** Confirmación: los N seguimientos y acceso a Mis solicitudes. */
export function OrderConfirmation({ result, onOpen, onList, titleRef }) {
  const count = result.requests.length;
  return (
    <div className="order-done">
      <span className="order-done-icon" aria-hidden="true"><Icon name="check" /></span>
      <h2 ref={titleRef} tabIndex={-1}>Pedido enviado</h2>
      <p>
        {count === 1 ? "Creamos 1 solicitud. Ya está buscando su técnico." : `Creamos ${count} solicitudes, una por especialidad. Cada una busca su técnico por separado.`}
      </p>
      <ul className="order-done-list">
        {result.requests.map((item) => (
          <li key={item.id}>
            <span>
              <strong>{item.specialty.name}</strong>
              <small className="muted"> Solicitud #{item.id}</small>
              <small className="order-done-works">{item.subcategories.map((sub) => sub.name).join(", ")}</small>
            </span>
            <button type="button" className="button outline" onClick={() => onOpen(item.id)}>
              Ver seguimiento<span className="sr-only"> de la solicitud #{item.id}</span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="button primary" onClick={onList}>Ir a Mis solicitudes</button>
    </div>
  );
}
