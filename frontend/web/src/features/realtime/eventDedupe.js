export function createEventDedupe() {
  const seen = new Set(),
    versions = new Map();
  return (event, currentVersion = 0) => {
    if (!event?.event_id || seen.has(event.event_id)) return false;
    seen.add(event.event_id);
    if (seen.size > 200) seen.delete(seen.values().next().value);
    const key = event.offer_id
      ? `offer:${event.offer_id}`
      : `request:${event.request_id}`;
    if (event.version != null) {
      if (event.version <= Math.max(currentVersion, versions.get(key) || 0))
        return false;
      versions.set(key, event.version);
    }
    return true;
  };
}
