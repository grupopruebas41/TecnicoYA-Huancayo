import React, { useState } from "react";
import { request } from "./http";
import { Field } from "./forms";
import { MutationForm, useResource, ResourceState } from "./Sprint02Common";
import { validateSlots, validatePause } from "./sprint02Validation";
const local = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export default function AvailabilityEditor({ profile, reload }) {
  const a = profile.availability || {};
  const [slots, setSlots] = useState(a.slots || []),
    [districts, setDistricts] = useState(a.district_ids || []),
    [pause, setPause] = useState(
      a.pause
        ? {
            ...a.pause,
            starts_at: local(a.pause.starts_at),
            ends_at: local(a.pause.ends_at),
          }
        : null,
    );
  const zones = useResource("/catalog/districts");
  const update = (i, k, v) =>
    setSlots(slots.map((s, n) => (n === i ? { ...s, [k]: v } : s)));
  const existingUnknown = districts.filter(
    (id) => !zones.data?.some((d) => d.id === id),
  );
  return (
    <div>
      <h3>Disponibilidad, zona y pausa</h3>
      <ResourceState resource={zones} />
      <MutationForm
        reload={reload}
        validate={() => ({
          ...validateSlots(slots),
          ...validatePause(pause),
          ...(districts.length > 20
            ? { district_ids: ["Máximo 20 distritos."] }
            : {}),
        })}
        onSave={async () => {
          await request(
            "/technicians/me/availability",
            {
              slots: slots.map((s) => ({ ...s, weekday: +s.weekday })),
              district_ids: districts,
              pause: pause
                ? {
                    ...pause,
                    starts_at: new Date(pause.starts_at).toISOString(),
                    ends_at: pause.ends_at
                      ? new Date(pause.ends_at).toISOString()
                      : null,
                  }
                : null,
              expected_version: profile.version,
            },
            "PUT",
          );
          await reload();
        }}
      >
        {(errors) => (
          <>
            <SlotsFields
              slots={slots}
              setSlots={setSlots}
              update={update}
              errors={errors}
            />
            <fieldset>
              <legend>Zonas de atención</legend>
              {zones.data?.map((d) => (
                <label key={d.id}>
                  <input
                    type="checkbox"
                    checked={districts.includes(d.id)}
                    onChange={(e) =>
                      setDistricts(
                        e.target.checked
                          ? [...districts, d.id]
                          : districts.filter((id) => id !== d.id),
                      )
                    }
                  />
                  {d.name}
                </label>
              ))}
              {existingUnknown.map((id) => (
                <p key={id}>
                  Zona previamente registrada #{id} (no disponible para altas
                  nuevas).{" "}
                  <button
                    type="button"
                    onClick={() =>
                      setDistricts(districts.filter((x) => x !== id))
                    }
                  >
                    Quitar zona #{id}
                  </button>
                </p>
              ))}
            </fieldset>
            <fieldset>
              <legend>Pausa temporal</legend>
              <label>
                <input
                  type="checkbox"
                  checked={!!pause}
                  onChange={(e) =>
                    setPause(
                      e.target.checked
                        ? {
                            starts_at: local(new Date().toISOString()),
                            ends_at: "",
                            reason: "",
                          }
                        : null,
                    )
                  }
                />
                Activar pausa
              </label>
              {pause && (
                <>
                  {[
                    ["starts_at", "Inicio de pausa", "datetime-local"],
                    ["ends_at", "Fin de pausa (opcional)", "datetime-local"],
                    ["reason", "Motivo de pausa", "text"],
                  ].map(([k, label, type]) => (
                    <Field
                      key={k}
                      label={label}
                      name={k}
                      type={type}
                      errors={errors}
                      value={pause[k] || ""}
                      onChange={(e) =>
                        setPause({ ...pause, [k]: e.target.value })
                      }
                    />
                  ))}
                </>
              )}
              <p>
                {a.pause
                  ? "Hay una pausa registrada."
                  : "Sin pausa registrada."}
              </p>
            </fieldset>
          </>
        )}
      </MutationForm>
    </div>
  );
}

function SlotsFields({ slots, setSlots, update, errors }) {
  return (
    <fieldset>
      <legend>Franjas semanales</legend>
      {slots.map((s, i) => (
        <div className="s02-row" key={i}>
          <label>
            Día {i + 1}
            <select
              value={s.weekday}
              onChange={(e) => update(i, "weekday", e.target.value)}
            >
              {[
                "Lunes",
                "Martes",
                "Miércoles",
                "Jueves",
                "Viernes",
                "Sábado",
                "Domingo",
              ].map((d, n) => (
                <option key={d} value={n + 1}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <Field
            label={"Inicio " + (i + 1)}
            name={"slots." + i + ".start"}
            type="time"
            errors={errors}
            value={s.start}
            onChange={(e) => update(i, "start", e.target.value)}
          />
          <Field
            label={"Fin " + (i + 1)}
            name={"slots." + i + ".end"}
            type="time"
            value={s.end}
            onChange={(e) => update(i, "end", e.target.value)}
          />
          <button
            type="button"
            onClick={() => setSlots(slots.filter((_, n) => n !== i))}
          >
            Quitar franja {i + 1}
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={slots.length >= 21}
        onClick={() =>
          setSlots([...slots, { weekday: 1, start: "08:00", end: "08:30" }])
        }
      >
        Añadir franja
      </button>
    </fieldset>
  );
}
