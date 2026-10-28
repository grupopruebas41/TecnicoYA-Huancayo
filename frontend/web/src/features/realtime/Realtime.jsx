import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { makeEcho, subscribeRealtime } from "./connection";
import { createEventDedupe } from "./eventDedupe";
const Context = createContext(null);
export function RealtimeProvider({ children }) {
  const [echo, setEcho] = useState(null);
  useEffect(() => {
    let client;
    try {
      client = makeEcho();
      setEcho(client);
    } catch {
      setEcho(null);
    }
    return () => client?.disconnect();
  }, []);
  return <Context.Provider value={echo}>{children}</Context.Provider>;
}
export function useRealtimeResource(name, events, refresh, version = 0) {
  const echo = useContext(Context),
    latest = useRef({ refresh, version });
  latest.current = { refresh, version };
  const [connected, setConnected] = useState(false);
  const names = events.join(",");
  useEffect(() => {
    if (!name) {
      setConnected(false);
      return;
    }
    const accept = createEventDedupe();
    const reload = (event) => {
      Promise.resolve(latest.current.refresh(event)).catch(() => {
        /* La vista muestra su propio error de lectura. */
      });
    };
    return subscribeRealtime(
      echo,
      name,
      names.split(","),
      (event) => {
        if (
          accept(
            event,
            typeof latest.current.version === "function"
              ? latest.current.version(event)
              : latest.current.version,
          )
        )
          reload(event);
      },
      () => reload(),
      setConnected,
    );
  }, [echo, name, names]);
  return connected;
}
export function ConnectionStatus({ connected }) {
  return (
    // Chip discreto (revisión del PR #39); el texto no cambia: lo usan las E2E del S4.
    <p role="status" className={"realtime-chip" + (connected ? " is-live" : "")}>
      {connected
        ? "Conexión en tiempo real activa."
        : "Sin conexión en tiempo real. Actualiza para ver cambios."}
    </p>
  );
}
