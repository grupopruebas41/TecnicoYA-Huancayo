export const initialWizard = {
  step: 1,
  specialty_id: "",
  subcategory_id: "",
  description: "",
  district_id: "",
  address: "",
  mode: "asap",
  preferred_start_at: "",
  preferred_end_at: "",
  source: "automatic",
  target_technician_id: null,
};
export function wizardReducer(state, action) {
  if (action.type === "step") return { ...state, step: action.step };
  if (action.type === "field") {
    const next = { ...state, [action.name]: action.value };
    if (action.name === "specialty_id" && action.value !== state.specialty_id)
      next.subcategory_id = "";
    return next;
  }
  return state;
}
export function registrationPayload(state) {
  const data = {
    subcategory_id: +state.subcategory_id,
    description: state.description.trim(),
    district_id: +state.district_id,
    address: state.address.trim(),
    mode: state.mode,
    source: state.source,
    target_technician_id: state.target_technician_id,
  };
  if (state.mode === "scheduled") {
    data.preferred_start_at = new Date(state.preferred_start_at).toISOString();
    data.preferred_end_at = new Date(state.preferred_end_at).toISOString();
  }
  return data;
}
function localDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
// defaults: valores de una solicitud nueva, como el distrito principal del cliente (D-80).
export function stateFromRecord(record, defaults = {}) {
  if (!record) return { ...initialWizard, ...defaults };
  return {
    ...initialWizard,
    ...record,
    step: 5,
    preferred_start_at: localDate(record.preferred_start_at),
    preferred_end_at: localDate(record.preferred_end_at),
    subcategory_id: String(record.subcategory.id),
    district_id: String(record.district.id),
  };
}
