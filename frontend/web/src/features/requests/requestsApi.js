import { registrationPayload } from "./wizardState";
import { request } from "../administration/http";
// La clave y el cuerpo pertenecen al intento, no al render ni al clic.
export function createSubmissionAttempt(id) {
  const key = crypto.randomUUID();
  let body;
  return {
    resetVersion() {
      body = undefined;
    },
    send(version) {
      body ??= { expected_version: version, summary_confirmed: true };
      return request("/requests/" + id + "/submission", body, "POST", {
        headers: { "Idempotency-Key": key },
      });
    },
  };
}
export async function attachPending(record, media) {
  let current = record;
  for (const image of media) {
    if (current.attachments?.some((a) => a.media_id === image.id)) continue;
    await request("/requests/" + current.id + "/attachments", {
      media_id: image.id,
      expected_version: current.version,
    });
    current = (await request("/requests/" + current.id)).data;
  }
  return current;
}

export function createRegistrationAttempt() {
  let key, body;
  return {
    async send(payload) {
      key ??= crypto.randomUUID();
      body ??= structuredClone(payload);
      const send = () =>
        request("/requests", body, "POST", {
          headers: { "Idempotency-Key": key },
        });
      try {
        try {
          return await send();
        } catch (error) {
          if (error.status !== 0) throw error;
          return await send();
        }
      } catch (error) {
        if (error.status !== 0) {
          key = undefined;
          body = undefined;
        }
        throw error;
      }
    },
  };
}
export async function saveRegistration(
  state,
  current,
  target,
  attempt = createRegistrationAttempt(),
) {
  if (!current)
    return (
      await attempt.send(
        registrationPayload({
          ...state,
          source: target ? "profile" : state.source,
          target_technician_id: target?.id || state.target_technician_id,
        }),
      )
    ).data;
  if (
    current.description === state.description.trim() &&
    current.address === state.address.trim() &&
    +current.district.id === +state.district_id
  )
    return current;
  return (
    await request(
      "/requests/" + current.id,
      {
        description: state.description.trim(),
        address: state.address.trim(),
        district_id: +state.district_id,
        expected_version: current.version,
      },
      "PATCH",
    )
  ).data;
}
