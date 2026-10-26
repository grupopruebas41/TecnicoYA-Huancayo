import React from "react";
import AnnouncementCarousel from "../announcements/AnnouncementCarousel";
import { useResource } from "./Sprint02Common";
// Comunicados vigentes del rol (D-83): carrusel a todo el ancho del contenido. Sin comunicados, o si la lista no
// carga, no se muestra nada: el Inicio sigue con el resto de su contenido.
export default function RoleAnnouncements() {
  const r = useResource("/announcements");
  if (!r.data?.length) return null;
  return <AnnouncementCarousel items={r.data} label="Comunicados para tu cuenta" />;
}
