import { serverNow } from "../../administration/http";

// D-92 y D-95 (PEDIDO-02): pedido por especialidades. Estado del asistente, validación por paso (la misma que aplica el
// servidor en POST /orders) y cuerpo del envío. Cada elemento de items es una especialidad con sus subcategorías y será una
// solicitud; no hay tope de subcategorías.
export const DESCRIPTION_MIN = 20;
export const DESCRIPTION_MAX = 1000;
export const MAX_PHOTOS = 5;
export const STEPS = [
  ["Especialidades", "Marca una o varias especialidades, o describe el problema arriba."],
  ["Subcategorías", "Marca todos los trabajos que necesitas de cada especialidad."],
  ["Detalle por especialidad", "Cuéntanos qué pasa en cada especialidad; las fotos ayudan al técnico."],
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

const subcategoryOf = (subcategory) => ({ id: subcategory.id, name: subcategory.name, reference_fee: subcategory.reference_fee ?? null });

export const emptyItem = (specialty, subcategories = []) => ({
  specialty_id: specialty.id,
  specialty_name: specialty.name,
  subcategories: subcategories.map(subcategoryOf),
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
    case "addSubcategory": {
      const { specialty, subcategory } = action;
      const specialtyIds = state.specialtyIds.includes(specialty.id) ? state.specialtyIds : [...state.specialtyIds, specialty.id];
      const own = state.items.find((item) => item.specialty_id === specialty.id);
      if (own?.subcategories.some((entry) => entry.id === subcategory.id)) return state;
      if (own) {
        return { ...state, specialtyIds, items: state.items.map((item) => (item === own ? { ...item, subcategories: [...item.subcategories, subcategoryOf(subcategory)] } : item)) };
      }
      const created = emptyItem(specialty, [subcategory]);
      const item = state.sameDescription && state.items[0] ? { ...created, description: state.items[0].description } : created;
      return { ...state, specialtyIds, items: [...state.items, item] };
    }
    // Quita la subcategoría y sus síntomas; la especialidad sin subcategorías deja de ser una solicitud.
    case "removeSubcategory": {
      const without = action.symptomIds || [];
      return {
        ...state,
        items: state.items
          .map((item) => (item.specialty_id === action.specialtyId
            ? { ...item, subcategories: item.subcategories.filter((entry) => entry.id !== action.id), symptom_ids: item.symptom_ids.filter((id) => !without.includes(id)) }
            : item))
          .filter((item) => item.subcategories.length),
      };
    }
    case "item": {
      const shared = state.sameDescription && action.name === "description";
      return {
        ...state,
        items: state.items.map((item) => (shared || item.specialty_id === action.id ? { ...item, [action.name]: action.value } : item)),
      };
    }
    case "sameDescription": {
      const source = state.items.find((item) => item.specialty_id === action.from) || state.items[0];
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
      if (Object.keys(found).length) errors[item.specialty_id] = found;
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
      specialty_id: item.specialty_id,
      subcategory_ids: item.subcategories.map((subcategory) => subcategory.id),
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

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

/** Barra inferior: «3 especialidades · 5 trabajos: Cómputo (2), Refrigeración comercial (2), Electricidad (1)». */
export function liveSummary(state, specialties = []) {
  if (!state.specialtyIds.length) return "Aún no eliges especialidades";
  const counted = state.specialtyIds.map((id) => {
    const item = state.items.find((entry) => entry.specialty_id === id);
    return { name: specialties.find((s) => s.id === id)?.name || item?.specialty_name, count: item?.subcategories.length || 0 };
  }).filter((entry) => entry.name);
  const total = counted.reduce((sum, entry) => sum + entry.count, 0);
  const label = plural(state.specialtyIds.length, "especialidad", "especialidades");
  if (!total) return `${label} · Sin trabajos aún: ${counted.map((entry) => entry.name).join(", ")}`;
  return `${label} · ${plural(total, "trabajo", "trabajos")}: ${counted.map((entry) => `${entry.name} (${entry.count})`).join(", ")}`;
}

/** D-95: con el máximo de pedidos activos el asistente no deja empezar otro. Sin cupo legible decide el servidor. */
export const orderBlocked = (quota) => quota?.available === 0;

export const formatFee = (fee) => (fee == null ? "" : `Desde S/ ${Number(fee).toFixed(2)}`);
