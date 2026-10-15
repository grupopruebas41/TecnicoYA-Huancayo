import React, { useState } from "react";
import { request } from "./http";
import {
  MutationForm,
  useResource,
  useSubcategories,
  ResourceState,
} from "./Sprint02Common";
import { validateRate } from "./sprint02Validation";
export default function ServicesEditor({ profile, reload }) {
  const catalog = useSubcategories();
  const [services, set] = useState(
    (profile.services || []).filter((s) => s.active !== false),
  );
  function validate() {
    const e = {};
    services.forEach((s, i) => {
      const error = validateRate(s.reference_fee);
      if (error) e["services." + i + ".reference_fee"] = [error];
    });
    return e;
  }
  return (
    <div>
      <h3>Servicios y tarifas</h3>
      <ResourceState resource={catalog} />
      <MutationForm
        reload={reload}
        validate={validate}
        onSave={async () => {
          await request(
            "/technicians/me/services",
            {
              services: services.map((s) => ({
                subcategory_id: s.subcategory_id,
                reference_fee: s.reference_fee,
              })),
              expected_version: profile.version,
            },
            "PUT",
          );
          await reload();
        }}
      >
        <label>
          Añadir servicio
          <select
            value=""
            onChange={(e) => {
              const item = catalog.data.find((s) => s.id === +e.target.value);
              if (item)
                set([
                  ...services,
                  {
                    subcategory_id: item.id,
                    subcategory_name: item.name,
                    reference_fee: "",
                  },
                ]);
            }}
          >
            <option value="">Selecciona una subcategoría</option>
            {catalog.data
              ?.filter((s) => !services.some((v) => v.subcategory_id === s.id))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </label>
        {!services.length && <p>No has añadido servicios.</p>}
        {services.map((s, i) => (
          <div className="s02-card" key={s.subcategory_id}>
            <h4>{s.subcategory_name}</h4>
            <label>
              Tarifa de {s.subcategory_name} (S/)
              <input
                inputMode="decimal"
                value={s.reference_fee}
                onChange={(e) =>
                  set(
                    services.map((v, n) =>
                      i === n ? { ...v, reference_fee: e.target.value } : v,
                    ),
                  )
                }
              />
            </label>
            <p>Versión de tarifa: {s.rate_version || "Nueva"}</p>
            <button
              type="button"
              onClick={() => set(services.filter((_, n) => i !== n))}
            >
              Quitar servicio
            </button>
          </div>
        ))}
      </MutationForm>
    </div>
  );
}
