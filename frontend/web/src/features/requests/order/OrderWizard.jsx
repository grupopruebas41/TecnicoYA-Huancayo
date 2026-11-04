import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { request } from "../../administration/http";
import { Notice } from "../../administration/forms";
import ConfirmDialog from "../../../components/ConfirmDialog";
import ProblemSearch from "../../client/ProblemSearch";
import Icon from "../../panel/icons";
import {
  STEPS, initialOrder, liveSummary, orderBlocked, orderPayload, orderReducer, validateOrderStep,
} from "./orderModel";
import { DetailStep, LocationStep, OrderBlocked, OrderConfirmation, SpecialtyStep, SubcategoryStep, SummaryStep } from "./OrderSteps";
import "./order.css";

// Stepper: el paso actual y los completados (con check); la línea marca el avance con --progress.
function OrderStepper({ step }) {
  return (
    <ol className="request-steps order-steps" aria-label="Pasos del pedido" style={{ "--progress": (step - 1) / (STEPS.length - 1) }}>
      {STEPS.map(([name], index) => {
        const done = index + 1 < step;
        return (
          <li key={name} aria-current={step === index + 1 ? "step" : undefined} className={done ? "is-done" : undefined}>
            <span>{done ? <Icon name="check" /> : index + 1}</span> {name}
            {done && <span className="sr-only"> (completado)</span>}
          </li>
        );
      })}
    </ol>
  );
}

/** La clave de idempotencia pertenece al cuerpo del intento: el mismo pedido reintentado reutiliza su clave. */
function useOrderAttempt() {
  const attempt = useRef(null);
  return (payload) => {
    const body = JSON.stringify(payload);
    if (attempt.current?.body !== body) attempt.current = { body, key: crypto.randomUUID() };
    return request("/orders", payload, "POST", { headers: { "Idempotency-Key": attempt.current.key } });
  };
}

/**
 * Pedido por especialidades (D-92 y D-95): especialidades y subcategorías de selección múltiple sin tope, detalle por
 * especialidad, ubicación y horario comunes, resumen y envío atómico (POST /orders): una solicitud por especialidad. Con 3
 * pedidos activos bloquea con un enlace a Mis solicitudes. La solicitud dirigida a un técnico y los borradores anteriores
 * siguen en RequestWizard (una sola subcategoría).
 */
export default function OrderWizard({ navigate = () => {}, onBusy = () => {}, defaultDistrictId = null, preset = null }) {
  const [state, dispatch] = useReducer(orderReducer, null, () =>
    initialOrder({
      district_id: defaultDistrictId ? String(defaultDistrictId) : "",
      specialtyIds: preset ? [+preset.specialty_id] : [],
    }),
  );
  const [catalog, setCatalog] = useState({ specialties: [], districts: [], quota: null, loaded: false });
  const [subcategories, setSubcategories] = useState({});
  const [symptoms, setSymptoms] = useState({});
  const [errors, setErrors] = useState({}),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [retry, setRetry] = useState(0),
    [filter, setFilter] = useState(""),
    [active, setActive] = useState(null),
    [removing, setRemoving] = useState(null),
    [sending, setSending] = useState(false),
    [uploading, setUploading] = useState(false),
    [uncertain, setUncertain] = useState(false),
    [result, setResult] = useState(null),
    [direction, setDirection] = useState("forward");
  const title = useRef(null),
    body = useRef(null),
    presetApplied = useRef(!preset);
  const send = useOrderAttempt();
  const blocked = orderBlocked(catalog.quota);

  useEffect(() => onBusy(sending || uploading || uncertain), [sending, uploading, uncertain, onBusy]);
  useEffect(() => {
    let alive = true;
    // Si el cupo no se puede leer, el servidor lo vuelve a aplicar al enviar (D-95).
    Promise.all([request("/catalog/specialties"), request("/catalog/districts"), request("/orders/quota").catch(() => null)])
      .then(([specialties, districts, quota]) => {
        if (alive) setCatalog({ specialties: specialties.data, districts: districts.data, quota: quota?.data ?? null, loaded: true });
      })
      .catch((failure) => alive && setError(failure.message));
    return () => {
      alive = false;
    };
  }, [retry]);
  // Subcategorías de cada especialidad marcada (una consulta por especialidad, guardada).
  useEffect(() => {
    state.specialtyIds.filter((id) => !subcategories[id]).forEach((id) => {
      setSubcategories((current) => ({ ...current, [id]: { loading: true, items: [] } }));
      request("/catalog/subcategories?specialty_id=" + id)
        .then((r) => setSubcategories((current) => ({ ...current, [id]: { loading: false, items: r.data } })))
        .catch((failure) => {
          setSubcategories((current) => ({ ...current, [id]: undefined }));
          setError(failure.message);
        });
    });
  }, [state.specialtyIds, subcategories]);
  // Problemas frecuentes de cada subcategoría elegida.
  useEffect(() => {
    state.items.flatMap((item) => item.subcategories).filter((sub) => !symptoms[sub.id]).forEach((sub) => {
      setSymptoms((current) => ({ ...current, [sub.id]: [] }));
      request(`/catalog/subcategories/${sub.id}/symptoms`)
        .then((r) => setSymptoms((current) => ({ ...current, [sub.id]: r.data })))
        .catch(() => {});
    });
  }, [state.items, symptoms]);
  // Atajo o sugerencia del Inicio (D-93, D-94): marca esa subcategoría y empieza en el detalle de su especialidad.
  useEffect(() => {
    if (presetApplied.current || !catalog.loaded) return;
    const specialty = catalog.specialties.find((item) => item.id === +preset.specialty_id);
    const sub = subcategories[+preset.specialty_id]?.items.find((item) => item.id === +preset.subcategory_id);
    if (!specialty || !sub) return;
    presetApplied.current = true;
    if (!blocked) {
      dispatch({ type: "addSubcategory", specialty, subcategory: sub });
      setActive(specialty.id);
      dispatch({ type: "step", step: 3 });
    }
  }, [catalog, subcategories, preset, blocked]);
  // El título del paso (o de la confirmación) recibe el foco al cambiar.
  useEffect(() => {
    title.current?.focus();
  }, [state.step, result, blocked]);

  const go = useCallback((step, item = null) => {
    setDirection(step < state.step ? "back" : "forward");
    setErrors({});
    setSuccess("");
    if (item) setActive(item);
    dispatch({ type: "step", step });
  }, [state.step]);

  const isMarked = (subcategoryId) => state.items.some((entry) => entry.subcategories.some((sub) => sub.id === subcategoryId));
  function addFromSearch({ item }) {
    setError("");
    if (isMarked(item.subcategory_id)) {
      setSuccess(`Ya estaba en tu pedido: ${item.specialty_name} › ${item.subcategory_name}.`);
      return;
    }
    const specialty = catalog.specialties.find((entry) => entry.id === item.specialty_id) || { id: item.specialty_id, name: item.specialty_name };
    dispatch({ type: "addSubcategory", specialty, subcategory: { id: item.subcategory_id, name: item.subcategory_name } });
    setSuccess(`Agregado: ${item.specialty_name} › ${item.subcategory_name}.`);
  }
  function toggleSpecialty(specialty) {
    if (state.specialtyIds.includes(specialty.id) && state.items.some((item) => item.specialty_id === specialty.id)) {
      setRemoving(specialty);
      return;
    }
    dispatch({ type: "toggleSpecialty", id: specialty.id });
  }
  function toggleSubcategory(sub, specialty) {
    if (isMarked(sub.id)) dispatch({ type: "removeSubcategory", specialtyId: specialty.id, id: sub.id, symptomIds: (symptoms[sub.id] || []).map((symptom) => symptom.id) });
    else dispatch({ type: "addSubcategory", specialty, subcategory: sub });
  }

  function focusFirstInvalid(found) {
    requestAnimationFrame(() => {
      const target = body.current?.querySelector('[aria-invalid="true"]');
      if (target) target.focus();
      else if (Object.keys(found).length) body.current?.querySelector(".field-error")?.focus?.();
    });
  }
  async function next(event) {
    event?.preventDefault();
    if (sending || uploading || uncertain) return;
    const found = validateOrderStep(state.step, state, catalog.specialties);
    setErrors(found);
    setError("");
    setSuccess("");
    if (state.step === 3 && Object.keys(found).length) {
      const first = state.items.find((item) => found[item.specialty_id]);
      setActive(first.specialty_id);
    }
    if (Object.keys(found).length) {
      focusFirstInvalid(found);
      return;
    }
    if (state.step < 5) {
      if (state.step === 2 && !state.items.some((item) => item.specialty_id === active)) setActive(state.items[0]?.specialty_id);
      go(state.step + 1);
      return;
    }
    await submit();
  }
  async function submit() {
    setSending(true);
    try {
      const response = await send(orderPayload(state));
      setResult(response.data);
      onBusy(false);
    } catch (failure) {
      if (failure.status === 0) setUncertain(true);
      setError(failure.message);
      if (failure.code === "ACTIVE_REQUEST_LIMIT") request("/orders/quota").then((r) => setCatalog((c) => ({ ...c, quota: r.data }))).catch(() => {});
    } finally {
      setSending(false);
    }
  }

  if (result) {
    return (
      <section className="s02-panel request-wizard order-wizard" aria-label="Nueva solicitud">
        <OrderConfirmation result={result} titleRef={title} onOpen={(id) => navigate("requests", { open: id })} onList={() => navigate("requests")} />
      </section>
    );
  }
  if (blocked) {
    return (
      <section className="s02-panel request-wizard order-wizard" aria-label="Nueva solicitud">
        <OrderBlocked max={catalog.quota.max} titleRef={title} onList={() => navigate("requests")} />
      </section>
    );
  }
  const groups = state.specialtyIds
    .map((id) => catalog.specialties.find((specialty) => specialty.id === id))
    .filter(Boolean)
    .map((specialty) => ({ specialty, subcategories: subcategories[specialty.id]?.items || [], loading: !!subcategories[specialty.id]?.loading }));
  const locked = sending || uploading || uncertain;
  const [stepTitle, stepHint] = STEPS[state.step - 1];
  return (
    <section className="s02-panel request-wizard order-wizard" aria-label="Nueva solicitud">
      <OrderStepper step={state.step} />
      <form className="order-form" noValidate onSubmit={next}>
        <div key={state.step} className={"order-step is-" + direction} ref={body}>
          <h2 ref={title} tabIndex={-1}>Paso {state.step}: {stepTitle}</h2>
          <p className="muted request-hint">{stepHint}</p>
          <Notice error={error} success={success} />
          {error && !catalog.loaded && (
            <button type="button" className="button outline" onClick={() => setRetry(retry + 1)}>Recargar catálogo</button>
          )}
          {uncertain && (
            <div className="order-uncertain">
              <p>No pudimos confirmar el envío. Consulta Mis solicitudes antes de repetirlo; si no aparece, reintenta: no se duplicará.</p>
              <button type="button" className="button outline" onClick={() => navigate("requests")}>Consultar Mis solicitudes</button>
              <button type="button" className="button outline" onClick={() => { setUncertain(false); submit(); }}>Reintentar envío</button>
            </div>
          )}
          {state.step === 1 && (
            <>
              <ProblemSearch label="¿Qué se malogró?" onSelect={addFromSearch}
                onNoMatch={() => body.current?.querySelector("input[name=specialty_ids]")?.focus()} />
              <SpecialtyStep specialties={catalog.specialties} selected={state.specialtyIds} onToggle={toggleSpecialty} error={errors.specialty_ids} />
            </>
          )}
          {state.step === 2 && (
            <SubcategoryStep groups={groups} items={state.items} filter={filter} onFilter={setFilter}
              onToggle={toggleSubcategory} error={errors.subcategory_ids} />
          )}
          {state.step === 3 && (
            <DetailStep items={state.items} active={active} onActive={setActive} symptoms={symptoms} errors={errors}
              onItem={(id, name, value) => dispatch({ type: "item", id, name, value })}
              sameDescription={state.sameDescription} onSameDescription={(value, from) => dispatch({ type: "sameDescription", value, from })}
              onBusy={setUploading} />
          )}
          {state.step === 4 && (
            <LocationStep state={state} districts={catalog.districts} errors={errors} onField={(name, value) => dispatch({ type: "field", name, value })} />
          )}
          {state.step === 5 && (
            <SummaryStep state={state} districts={catalog.districts} symptoms={symptoms} error={errors.confirmed}
              onEdit={(step, item) => go(step, item)} onConfirm={(value) => dispatch({ type: "field", name: "confirmed", value })} />
          )}
        </div>
        <div className="order-bar">
          <p className="order-live" aria-live="polite">{liveSummary(state, catalog.specialties)}</p>
          <div className="order-bar-actions">
            {state.step > 1 && (
              <button type="button" className="button outline" disabled={locked} onClick={() => go(state.step - 1)}>Atrás</button>
            )}
            <button type="submit" className="button primary" disabled={locked || !catalog.loaded}>
              {state.step < 5 ? "Siguiente" : sending ? "Enviando…" : "Enviar pedido"}
            </button>
          </div>
        </div>
      </form>
      {removing && (
        <ConfirmDialog
          title="Quitar especialidad"
          description={`Se quitarán las subcategorías elegidas de ${removing.name}. ¿Deseas continuar?`}
          onCancel={() => setRemoving(null)}
          onConfirm={() => {
            dispatch({ type: "toggleSpecialty", id: removing.id });
            setRemoving(null);
          }}
        />
      )}
    </section>
  );
}
