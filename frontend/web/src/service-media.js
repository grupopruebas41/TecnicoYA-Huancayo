export const specialtyImages = Object.freeze({
  computo: "/media/services/computo.png",
  refrigeracion: "/media/services/refrigeracion.png",
  electricidad: "/media/services/electricidad.png",
});

export const subcategoryImages = Object.freeze({
  "computo/hardware": "computo/hardware.png",
  "computo/mantenimiento-preventivo": "computo/mantenimiento.png",
  "computo/instalacion-y-configuracion-de-software": "computo/software.png",
  "computo/redes-e-infraestructura": "computo/redes.png",
  "computo/recuperacion-de-datos": "computo/datos.png",
  "computo/eliminacion-de-virus-y-seguridad-informatica": "computo/seguridad.png",
  "computo/soporte-tecnico-remoto": "computo/remoto.png",
  "computo/reparacion-de-impresoras-y-equipos-de-oficina": "computo/impresoras.png",
  "computo/sistemas-de-punto-de-venta-pos": "computo/pos.png",
  "computo/camaras-de-seguridad-cctv": "computo/cctv.png",
  "computo/software-de-facturacion-electronica": "computo/facturacion.png",
  "refrigeracion/refrigeracion-domestica": "refrigeracion/domestica.png",
  "refrigeracion/refrigeracion-comercial-vitrinas": "refrigeracion/vitrinas.png",
  "refrigeracion/camaras-de-frio": "refrigeracion/camaras.png",
  "refrigeracion/congeladores-industriales": "refrigeracion/congeladores.png",
  "refrigeracion/aire-acondicionado-climatizacion": "refrigeracion/climatizacion.png",
  "refrigeracion/carga-y-recarga-de-gas-refrigerante": "refrigeracion/refrigerante.png",
  "refrigeracion/reparacion-de-compresores": "refrigeracion/compresores.png",
  "refrigeracion/maquinas-de-hielo-y-dispensadores": "refrigeracion/hielo.png",
  "refrigeracion/mantenimiento-preventivo": "refrigeracion/mantenimiento.png",
  "electricidad/instalaciones-residenciales": "electricidad/residencial.png",
  "electricidad/instalaciones-comerciales-industriales": "electricidad/comercial.png",
  "electricidad/tableros-electricos": "electricidad/tableros.png",
  "electricidad/iluminacion": "electricidad/iluminacion.png",
  "electricidad/puesta-a-tierra": "electricidad/tierra.png",
  "electricidad/certificacion-y-medidores": "electricidad/medidores.png",
  "electricidad/energia-solar-paneles-fotovoltaicos": "electricidad/solar.png",
  "electricidad/grupos-electrogenos-generadores": "electricidad/generadores.png",
  "electricidad/cercos-electricos-y-alarmas": "electricidad/alarmas.png",
  "electricidad/automatizacion-basica-domotica": "electricidad/domotica.png",
});

export function slugify(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function serviceCategory(value = "") {
  const slug = slugify(value);
  if (slug.includes("refriger")) return "refrigeracion";
  if (slug.includes("electric")) return "electricidad";
  if (slug.includes("comput") || slug.includes("tecnolog")) return "computo";
  return slug;
}

export function getSubcategoryImage(item, carouselItems = [], specialtySlug = "") {
  if (item.image_url) return item.image_url;
  const media = carouselItems.find(
    (entry) =>
      entry.subcategory_id === item.id ||
      entry.subcategory_id === item.subcategory_id,
  );
  if (media?.image_url || media?.media_url) return media.image_url || media.media_url;
  const path = subcategoryImages[`${serviceCategory(specialtySlug)}/${slugify(item.slug || item.name)}`];
  return path ? `/media/services/subcategorias/${path}` : "/media/landing/tecnico-taller.webp";
}
