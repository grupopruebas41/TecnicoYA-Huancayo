import React, { useEffect, useRef, useState } from "react";
import { request } from "../administration/http";
import { ConnectionStatus, useRealtimeResource } from "./Realtime";
import { OfferError } from "../offers/offerErrors";
export default function Notifications({ userId }) {
  const [items, setItems] = useState([]),
    [error, setError] = useState(null),
    [loading, setLoading] = useState(true);
  const last = useRef(0),
    lock = useRef(false);
  async function refresh() {
    if (lock.current) return;
    lock.current = true;
    try {
      let page = 1,
        total = 1;
      const incoming = [];
      const after = last.current;
      do {
        const result = await request(
          `/notifications?after_id=${after}&page=${page}&per_page=50`,
        );
        incoming.push(...result.data.items);
        total = result.data.pagination.last_page;
        page++;
      } while (page <= total);
      setItems((old) => {
        const unique = new Map(old.map((n) => [n.event_id || n.id, n]));
        for (const n of incoming) unique.set(n.event_id || n.id, n);
        return [...unique.values()].sort((a, b) => b.id - a.id);
      });
      for (const n of incoming) last.current = Math.max(last.current, n.id);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      lock.current = false;
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, [userId]);
  const connected = useRealtimeResource(
    `users.${userId}`,
    ["notification.created"],
    refresh,
  );
  return (
    <section aria-label="Notificaciones" className="s02-panel">
      <h2>Notificaciones</h2>
      <ConnectionStatus connected={connected} />
      <button type="button" onClick={refresh}>
        Actualizar notificaciones
      </button>
      <OfferError error={error} />
      {loading ? (
        <p role="status">Cargando notificaciones…</p>
      ) : (
        !error && !items.length && <p>No tienes notificaciones.</p>
      )}
      <ul>
        {items.map((n) => (
          <li key={n.event_id || n.id}>
            <h3>{n.title}</h3>
            <p>{n.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
