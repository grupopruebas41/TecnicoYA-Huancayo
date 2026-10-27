// Herramientas del navegador para la imagen del comunicado (D-83). Viven aparte para simularlas en Vitest
// (jsdom no tiene canvas). El servidor vuelve a revisar el archivo y quita el EXIF.

/** Carga el archivo elegido y devuelve sus medidas reales. */
export async function readImage(file) {
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    // Se espera el evento load y no image.decode(): Chrome rechaza a veces decode() con imágenes grandes válidas.
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });
  } catch {
    URL.revokeObjectURL(url);
    throw new Error('No pudimos leer la imagen. Prueba con otro archivo JPG, PNG o WebP.');
  }
  return {image, url, width: image.naturalWidth, height: image.naturalHeight};
}

const QUALITIES = [0.9, 0.82, 0.74, 0.66, 0.58, 0.5];
const toBlob = (canvas, type, quality) => new Promise(resolve => canvas.toBlob(resolve, type, quality));

/**
 * Dibuja el recorte al tamaño final y lo codifica en WebP (o JPG si el navegador no codifica WebP), bajando la
 * calidad hasta caber en maxBytes. Devuelve null si ni con la calidad mínima entra en el límite.
 */
export async function encodeCrop(image, rect, size, maxBytes) {
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, size.width, size.height);
  for (const type of ['image/webp', 'image/jpeg']) {
    for (const quality of QUALITIES) {
      const blob = await toBlob(canvas, type, quality);
      if (!blob || blob.type !== type) break;
      if (blob.size <= maxBytes) return blob;
    }
  }
  return null;
}
