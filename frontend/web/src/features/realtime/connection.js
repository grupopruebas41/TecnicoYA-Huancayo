import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { request } from "../administration/http";
export function makeEcho() {
  const env = import.meta.env;
  if (!env.VITE_REVERB_APP_KEY || !env.VITE_REVERB_HOST) return null;
  return new Echo({
    broadcaster: "reverb",
    Pusher,
    key: env.VITE_REVERB_APP_KEY,
    wsHost: env.VITE_REVERB_HOST,
    wsPort: Number(env.VITE_REVERB_PORT),
    wssPort: Number(env.VITE_REVERB_PORT),
    forceTLS: env.VITE_REVERB_SCHEME === "https",
    enabledTransports: ["ws", "wss"],
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        request("/broadcasting/auth", {
          socket_id: socketId,
          channel_name: channel.name,
        })
          .then((r) => callback(null, r.data))
          .catch((e) => callback(e, null));
      },
    }),
  });
}
export function subscribeRealtime(
  echo,
  name,
  events,
  onEvent,
  onRecover,
  onStatus,
) {
  if (!echo) {
    onStatus(false);
    return () => {};
  }
  const connection = echo.connector.pusher.connection;
  const channel = echo.private(name);
  // DEF-60: un socket conectado no basta. Hasta que el canal se suscribe (autorización incluida), los eventos se pierden.
  let socket = connection.state === "connected";
  let subscribed = channel.subscription?.subscribed === true;
  let lost = false;
  let active = true;
  const report = () => {
    if (active) onStatus(socket && subscribed);
  };
  const state = ({ current }) => {
    socket = current === "connected";
    if (!socket) subscribed = false;
    if (
      current === "disconnected" ||
      current === "unavailable" ||
      current === "failed"
    )
      lost = true;
    report();
  };
  connection.bind("state_change", state);
  report();
  for (const event of events) channel.listen("." + event, onEvent);
  channel.subscribed?.(() => {
    subscribed = true;
    report();
    // Lo perdido se recupera con el canal ya suscrito: así no queda un hueco entre la lectura y el primer evento.
    if (lost && active) {
      lost = false;
      onRecover();
    }
  });
  channel.error?.(() => {
    subscribed = false;
    report();
  });
  return () => {
    active = false;
    connection.unbind("state_change", state);
    for (const event of events) channel.stopListening("." + event, onEvent);
    echo.leave(name);
  };
}
