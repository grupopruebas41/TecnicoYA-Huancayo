import React from "react";
import { CarouselDeck } from "../../ServiceCarousel";
import { useResource, ResourceState } from "./Sprint02Common";
export default function RoleAnnouncements() {
  const r = useResource("/announcements");
  return (
    <section className="s02-announcements">
      <h2>Comunicados</h2>
      <ResourceState resource={r} />
      {r.data?.length === 0 && (
        <p>No hay comunicados vigentes para tu cuenta.</p>
      )}
      {r.data?.length > 0 && (
        <CarouselDeck items={r.data} label="Avisos para tu cuenta" />
      )}
    </section>
  );
}
