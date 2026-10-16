import { useEffect, useReducer, useRef, useState } from "react";
import { request } from "../administration/http";
import { wizardReducer, stateFromRecord } from "./wizardState";
import { validateStep, fieldErrors } from "./requestValidation";
import { attachPending, saveRegistration } from "./requestsApi";
function useWizardCatalog(specialtyId, target, retry, setError) {
  const [specialties, setSpecialties] = useState([]),
    [subcategories, setSubcategories] = useState([]),
    [districts, setDistricts] = useState([]);
  useEffect(() => {
    let active = true;
    Promise.all([
      request("/catalog/specialties"),
      request("/catalog/districts"),
    ])
      .then(async ([a, b]) => {
        let choices = a.data;
        if (target) {
          const groups = await Promise.all(
            a.data.map((x) =>
              request("/catalog/subcategories?specialty_id=" + x.id),
            ),
          );
          choices = a.data.filter((x, i) =>
            groups[i].data.some((s) =>
              target.services.some((t) => +t.subcategory_id === +s.id),
            ),
          );
        }
        if (active) {
          setSpecialties(choices);
          setDistricts(b.data);
        }
      })
      .catch((error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  useEffect(() => {
    let active = true;
    setSubcategories([]);
    if (specialtyId)
      request("/catalog/subcategories?specialty_id=" + specialtyId)
        .then((r) => {
          if (active) setSubcategories(r.data);
        })
        .catch((error) => {
          if (active) setError(error.message);
        });
    return () => {
      active = false;
    };
  }, [specialtyId, retry]);
  return { specialties, subcategories, districts };
}
export default function useWizardFlow(initialRecord, target, onExit, onBusy) {
  const [state, dispatch] = useReducer(
      wizardReducer,
      initialRecord,
      stateFromRecord,
    ),
    [record, setRecord] = useState(initialRecord),
    [media, setMedia] = useState([]);
  const [errors, setErrors] = useState({}),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [uncertain, setUncertain] = useState(false),
    [retry, setRetry] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    onBusy(busy || uploading || submitting || uncertain);
  }, [busy, uploading, submitting, uncertain, onBusy]);
  const notice = useRef(null);
  useEffect(() => {
    if (error && !Object.keys(errors).length) notice.current?.focus();
  }, [error, errors]);
  const title = useRef(null),
    form = useRef(null),
    lock = useRef(false);
  const { specialties, subcategories, districts } = useWizardCatalog(
    state.specialty_id,
    target,
    retry,
    setError,
  );
  useEffect(() => {
    title.current?.focus();
  }, [state.step]);
  useEffect(() => {
    const invalidField = form.current?.querySelector('[aria-invalid="true"]');
    if (invalidField) invalidField.focus();
    else if (Object.keys(errors).length) notice.current?.focus();
  }, [errors]);
  const update = (name, value) => dispatch({ type: "field", name, value });
  const go = (step) => {
    setSuccess("");
    setErrors({});
    dispatch({ type: "step", step });
  };
  const offered = subcategories.filter(
    (s) => !target || target.services.some((t) => +t.subcategory_id === +s.id),
  );
  const options =
    record && !offered.some((s) => +s.id === +state.subcategory_id)
      ? [...offered, record.subcategory]
      : offered;
  const pending = media.some(
    (m) => !record?.attachments?.some((a) => a.media_id === m.id),
  );
  async function refresh() {
    if (!record) {
      onExit();
      return;
    }
    setBusy(true);
    try {
      const current = (await request("/requests/" + record.id)).data;
      setRecord(current);
      setUncertain(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    let current = record;
    try {
      current = await saveRegistration(state, current, target);
      setRecord(current);
      current = await attachPending(current, media);
      setRecord(current);
      go(5);
      setSuccess(record ? "Solicitud actualizada." : "Solicitud registrada. Revisa el resumen antes de enviarla.");
    } catch (error) {
      setError(error.message);
      setErrors(fieldErrors(error));
      if (error.status === 0 || error.status === 409) {
        setUncertain(true);
        if (current) {
          try {
            setRecord((await request("/requests/" + current.id)).data);
            setUncertain(false);
          } catch {
            /* Solo la lectura confirma el estado. */
          }
        }
      }
    }
  }
  async function next(event) {
    event.preventDefault();
    if (lock.current || uploading || uncertain) return;
    const invalid =
      record && state.step < 3 ? {} : validateStep(state.step, state);
    setErrors(invalid);
    setError("");
    setSuccess("");
    if (Object.keys(invalid).length) return;
    if (state.step < 4) {
      go(state.step + 1);
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      await save();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return {
    state,
    record,
    media,
    setMedia,
    setRecord,
    errors,
    error,
    success,
    busy,
    uploading,
    uncertain,
    retry,
    setRetry,
    submitting,
    setSubmitting,
    notice,
    title,
    form,
    update,
    go,
    options,
    pending,
    refresh,
    next,
    specialties,
    districts,
    setUploading,
  };
}
