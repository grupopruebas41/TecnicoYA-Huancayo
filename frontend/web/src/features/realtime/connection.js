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
  let lost = false;
  const state = ({ current }) => {
    onStatus(current === "connected");
    if (
      current === "disconnected" ||
      current === "unavailable" ||
      current === "failed"
    )
      lost = true;
    if (current === "connected" && lost) {
      lost = false;
      onRecover();
    }
  };
  connection.bind("state_change", state);
  onStatus(connection.state === "connected");
  const channel = echo.private(name);
  for (const event of events) channel.listen("." + event, onEvent);
  channel.error?.(() => onStatus(false));
  return () => {
    connection.unbind("state_change", state);
    for (const event of events) channel.stopListening("." + event, onEvent);
    echo.leave(name);
  };
}
