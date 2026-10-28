import React from "react";
import useWizardFlow from "./useWizardFlow";
import { Notice } from "../administration/forms";
import WizardFields from "./WizardFields";
import EvidencePicker from "./EvidencePicker";
import RequestSummary from "./RequestSummary";
const steps = [
  "Especialidad",
  "Subcategoría",
  "Descripción y fotos",
  "Ubicación y horario",
  "Resumen y envío",
];
// Revisión del PR #39: descripción breve de cada paso, debajo de su título.
const hints = [
  "Elige el tipo de servicio que necesitas.",
  "Elige el trabajo específico para que te lleguen técnicos de ese rubro.",
  "Cuéntanos qué pasa y, si quieres, agrega fotos de la falla.",
  "Indica dónde y cuándo quieres la atención.",
  "Revisa el resumen y envía tu solicitud.",
];
// Stepper: círculos numerados unidos por una línea cuyo avance marca --progress (los pasos hechos llevan is-done).
export function StepIndicator({ step }) {
  return (
    <ol className="request-steps" aria-label="Pasos de la solicitud" style={{ "--progress": (step - 1) / (steps.length - 1) }}>
      {steps.map((name, i) => (
        <li key={name} aria-current={step === i + 1 ? "step" : undefined} className={i + 1 < step ? "is-done" : undefined}>
          <span>{i + 1}</span> {name}
        </li>
      ))}
    </ol>
  );
}
export default function RequestWizard({
  initialRecord = null,
  target = null,
  onExit = () => {},
  onBusy = () => {},
  defaultDistrictId = null,
  preset = null,
}) {
  const {
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
  } = useWizardFlow(initialRecord, target, onExit, onBusy, defaultDistrictId, preset);
  return (
    <section className="s02-panel request-wizard" aria-label="Nueva solicitud">
      <StepIndicator step={state.step} />
      <h2 ref={title} tabIndex={-1}>
        Paso {state.step}: {steps[state.step - 1]}
      </h2>
      <p className="muted request-hint">{hints[state.step - 1]}</p>
      <WizardContext target={target} record={record} />
      <div ref={notice} tabIndex={-1}>
        <Notice error={error} success={success} />
      </div>
      {error && (
        <button
          type="button"
          disabled={busy}
          onClick={() => setRetry(retry + 1)}
        >
          Recargar catálogo
        </button>
      )}
      {uncertain && (
        <>
          <p>
            No se pudo confirmar la operación. Consulta el estado antes de
            repetirla.
          </p>
          <button type="button" disabled={busy} onClick={refresh}>
            {record ? "Consultar solicitud" : "Consultar Mis solicitudes"}
          </button>
        </>
      )}
      {state.step < 5 && (
        <form ref={form} key={state.step} className="request-step" noValidate onSubmit={next}>
          <fieldset
            disabled={
              busy || uploading || uncertain || record?.status === "sent"
            }
          >
            <WizardFields
              state={state}
              update={update}
              errors={errors}
              specialties={specialties}
              subcategories={options}
              districts={districts}
              registered={!!record}
            />
          </fieldset>
          <div className="request-actions request-actions-sticky">
            {state.step > 1 && (
              <button
                type="button"
                disabled={busy || uploading || uncertain}
                onClick={() => go(state.step - 1)}
              >
                Atrás
              </button>
            )}
            <button
              type="submit"
              disabled={
                busy || uploading || uncertain || record?.status === "sent"
              }
            >
              {busy ? "Guardando…" : "Siguiente"}
            </button>
          </div>
        </form>
      )}
      {(state.step === 3 || state.step === 5) && (
        <EvidencePicker
          record={record}
          media={media}
          setMedia={setMedia}
          onUpdate={setRecord}
          onBusy={setUploading}
          disabled={submitting}
        />
      )}
      {state.step === 5 && record && (
        <>
          <RequestSummary
            key={record.id}
            record={record}
            onUpdate={setRecord}
            targetName={target?.display_name}
            onBusy={setSubmitting}
            disabled={busy || uploading || uncertain || pending}
          />
          {pending && (
            <>
              <p>
                Hay fotos pendientes de vincular. Vuelve al paso anterior y
                guarda para completar la vinculación.
              </p>
            </>
          )}
          {record.status === "registered" && (
            <button
              type="button"
              disabled={busy || uploading || submitting}
              onClick={() => go(4)}
            >
              Atrás
            </button>
          )}
        </>
      )}
    </section>
  );
}

function WizardContext({ target, record }) {
  return (
    <>
      {target && (
        <p>
          Técnico elegido: {target.display_name}. Solo se ofrecen sus servicios.
        </p>
      )}
      {record && (
        <p>
          Solicitud #{record.id}. Para cambiar especialidad o modalidad, inicia
          una nueva solicitud desde el menú.
        </p>
      )}
    </>
  );
}
