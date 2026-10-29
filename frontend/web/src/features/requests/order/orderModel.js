import { serverNow } from "../../administration/http";

// D-92 (PEDIDO-01): pedido con varios rubros. Estado del asistente, validación por paso (la misma que aplica el
// servidor en POST /orders) y cuerpo del envío. Un rubro es una subcategoría; cada uno será una solicitud.
export const MAX_ITEMS = 3;
export const DESCRIPTION_MIN = 20;
export const DESCRIPTION_MAX = 1000;
export const MAX_PHOTOS = 5;
export const STEPS = [
  ["Especialidades", "Marca una o varias especialidades, o describe el problema arriba."],
  ["Subcategorías", "Elige el trabajo específico de cada especialidad: cada uno será una solicitud."],
  ["Detalle por rubro", "Cuéntanos qué pasa en cada rubro; las fotos ayudan al técnico."],
  ["Ubicación y horario", "Indica dónde y cuándo quieres la atención; vale para todo el pedido."],
  ["Resumen y envío", "Revisa el pedido antes de enviarlo."],
];
// Franjas en hora de Lima (D-92): solo orientativas; la disponibilidad se confirma en el matching.
export const SLOTS = [
  { id: "manana", label: "Mañana", hours: "08–12", start: 8 },
  { id: "tarde", label: "Tarde", hours: "12–18", start: 12 },
  { id: "noche", label: "Noche", hours: "18–21", start: 18 },
];
const LIMA_OFFSET_HOURS = -5;

export const emptyItem = (subcategory, specialty) => ({
  subcategory_id: subcategory.id,
  specialty_id: specialty.id,
  name: subcategory.name,
  specialty_name: specialty.name,
  reference_fee: subcategory.reference_fee ?? null,
  description: "",
  brand: "",
  model: "",
  urgency: "normal",
  symptom_ids: [],
  photos: [],
});

export function initialOrder(defaults = {}) {
  return {
    step: 1,
    specialtyIds: [],
    items: [],
    sameDescription: false,
    district_id: "",
    address: "",
    address_reference: "",
    mode: "asap",
    scheduled_date: "",
    time_slot: "",
    confirmed: false,
    ...defaults,
  };
}

export function orderReducer(state, action) {
  switch (action.type) {
    case "step":
      return { ...state, step: action.step };
    case "field":
      return { ...state, [action.name]: action.value };
    case "toggleSpecialty": {
      const on = state.specialtyIds.includes(action.id);
      return on
        ? { ...state, specialtyIds: state.specialtyIds.filter((id) => id !== action.id), items: state.items.filter((item) => item.specialty_id !== action.id) }
        : { ...state, specialtyIds: [...state.specialtyIds, action.id] };
    }
    case "addItem": {
      if (state.items.some((item) => item.subcategory_id === action.item.subcategory_id)) return state;
      const specialtyIds = state.specialtyIds.includes(action.item.specialty_id) ? state.specialtyIds : [...state.specialtyIds, action.item.specialty_id];
      const item = state.sameDescription && state.items[0] ? { ...action.item, description: state.items[0].description } : action.item;
      return { ...state, specialtyIds, items: [...state.items, item] };
    }
    case "removeItem":
      return { ...state, items: state.items.filter((item) => item.subcategory_id !== action.id) };
    case "item": {
      const shared = state.sameDescription && action.name === "description";
      return {
        ...state,
        items: state.items.map((item) => (shared || item.subcategory_id === action.id ? { ...item, [action.name]: action.value } : item)),
      };
    }
    case "sameDescription": {
      const source = state.items.find((item) => item.subcategory_id === action.from) || state.items[0];
      return {
        ...state,
        sameDescription: action.value,
        items: action.value ? state.items.map((item) => ({ ...item, description: source.description })) : state.items,
      };
    }
    default:
      return state;
  }
}

const size = (value) => Array.from((value || "").trim()).length;

/** Primer día y hora local de Lima según el reloj del servidor. */
export function limaNow(now = serverNow()) {
  const lima = new Date(now + LIMA_OFFSET_HOURS * 3600000);
  return { date: lima.toISOString().slice(0, 10), hour: lima.getUTCHours() + lima.getUTCMinutes() / 60 };
}

export function slotStarted(date, slotId, now = serverNow()) {
  const slot = SLOTS.find((item) => item.id === slotId);
  const today = limaNow(now);
  return !!slot && (date < today.date || (date === today.date && slot.start <= today.hour));
}

export function itemErrors(item) {
  const errors = {};
  if (size(item.description) < DESCRIPTION_MIN) errors.description = "La descripción debe tener al menos 20 caracteres.";
  else if (size(item.description) > DESCRIPTION_MAX) errors.description = "La descripción no debe superar 1000 caracteres.";
  if (size(item.brand) > 60) errors.brand = "La marca admite hasta 60 caracteres.";
  if (size(item.model) > 60) errors.model = "El modelo admite hasta 60 caracteres.";
  return errors;
}

export function validateOrderStep(step, state, specialties = [], now = serverNow()) {
  const errors = {};
  if (step === 1 && !state.specialtyIds.length) errors.specialty_ids = "Marca al menos una especialidad.";
  if (step === 2) {
    if (!state.items.length) errors.subcategory_ids = "Elige al menos una subcategoría.";
    const empty = state.specialtyIds.filter((id) => !state.items.some((item) => item.specialty_id === id));
    if (state.items.length && empty.length) {
      const names = empty.map((id) => specialties.find((s) => s.id === id)?.name).filter(Boolean).join(", ");
      errors.subcategory_ids = `Elige al menos una subcategoría de ${names} o desmarca esa especialidad.`;
    }
  }
  if (step === 3) {
    state.items.forEach((item) => {
      const found = itemErrors(item);
      if (Object.keys(found).length) errors[item.subcategory_id] = found;
    });
  }
  if (step === 4) {
    if (!state.district_id) errors.district_id = "Selecciona un distrito dentro de cobertura.";
    if (size(state.address) < 5 || size(state.address) > 255) errors.address = "La dirección debe tener de 5 a 255 caracteres.";
    if (size(state.address_reference) > 120) errors.address_reference = "La referencia admite hasta 120 caracteres.";
    if (state.mode === "scheduled") {
      if (!state.scheduled_date || state.scheduled_date < limaNow(now).date) errors.scheduled_date = "Elige una fecha desde hoy.";
      if (!state.time_slot) errors.time_slot = "Elige una franja.";
      else if (state.scheduled_date && slotStarted(state.scheduled_date, state.time_slot, now))
        errors.time_slot = "Esa franja ya empezó. Elige una franja que aún no empiece.";
    }
  }
  if (step === 5 && !state.confirmed) errors.confirmed = "Confirma que el resumen es correcto.";
  return errors;
}

export function orderPayload(state) {
  const data = {
    district_id: +state.district_id,
    address: state.address.trim(),
    address_reference: state.address_reference.trim() || null,
    mode: state.mode,
    summary_confirmed: true,
    items: state.items.map((item) => ({
      subcategory_id: item.subcategory_id,
      description: item.description.trim(),
      urgency: item.urgency,
      brand: item.brand.trim() || null,
      model: item.model.trim() || null,
      symptom_ids: item.symptom_ids,
      media_ids: item.photos.map((photo) => photo.id),
    })),
  };
  if (state.mode === "scheduled") Object.assign(data, { scheduled_date: state.scheduled_date, time_slot: state.time_slot });
  return data;
}

/** Barra inferior: «2 rubros elegidos · Cómputo, Electricidad». */
export function liveSummary(state, specialties = []) {
  const count = state.items.length;
  const label = count === 1 ? "1 rubro elegido" : count ? `${count} rubros elegidos` : "Ningún rubro elegido";
  const ids = count ? [...new Set(state.items.map((item) => item.specialty_id))] : state.specialtyIds;
  const names = ids.map((id) => specialties.find((s) => s.id === id)?.name || state.items.find((i) => i.specialty_id === id)?.specialty_name).filter(Boolean);
  return names.length ? `${label} · ${names.join(", ")}` : label;
}

/** Cupo: máximo de rubros del pedido según las solicitudes activas (D-11). */
export function capacity(quota) {
  if (!Number.isFinite(quota?.available)) return MAX_ITEMS;
  return Math.max(0, Math.min(MAX_ITEMS, quota.available));
}

export function quotaMessage(quota) {
  if (!Number.isFinite(quota?.active) || !quota.active) return "";
  const active = quota.active === 1 ? "Tienes 1 solicitud activa" : `Tienes ${quota.active} solicitudes activas`;
  if (!quota.available) return `${active}: podrás hacer otro pedido cuando alguna se cierre.`;
  const room = Math.min(MAX_ITEMS, quota.available);
  return `${active}: puedes agregar ${room === 1 ? "1 rubro" : `${room} rubros`}.`;
}

export const formatFee = (fee) => (fee == null ? "" : `Desde S/ ${Number(fee).toFixed(2)}`);
