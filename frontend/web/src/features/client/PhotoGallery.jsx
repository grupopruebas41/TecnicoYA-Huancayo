import React, {useEffect, useRef, useState} from 'react';
import DismissBackdrop from '../../components/DismissBackdrop';

/**
 * Miniaturas de las fotos de una solicitud que se amplían al clic (revisión del PR #39). El visor es un diálogo
 * modal: el foco va a «Cerrar», Escape lo cierra y el foco vuelve a la miniatura.
 */
export default function PhotoGallery({photos = [], requestId}) {
  const [open, setOpen] = useState(null);
  const close = useRef(null);
  const thumbs = useRef([]);
  useEffect(() => { if (open !== null) close.current?.focus(); }, [open]);
  if (!photos.length) return null;
  function dismiss() {
    const index = open;
    setOpen(null);
    // La miniatura sigue montada (solo se quita el visor): se le devuelve el foco en el mismo evento.
    thumbs.current[index]?.focus();
  }
  return <div className="client-photos">
    {photos.map((photo, index) => <button key={photo.media_id} type="button" className="client-thumb" aria-label={`Ampliar foto ${index + 1}`}
      ref={node => { thumbs.current[index] = node; }} onClick={() => setOpen(index)}>
      <img src={photo.url} alt={photo.caption || `Evidencia ${index + 1} de la solicitud`} loading="lazy"/>
    </button>)}
    {/* Cierre S4-S5 (Sonar S6847/S6848): el fondo es un botón nativo (DismissBackdrop) y el diálogo es <dialog> nativo. */}
    {open !== null && <dialog open className="client-lightbox" aria-modal="true" aria-label={`Foto ${open + 1} de la solicitud #${requestId}`}
      onKeyDown={event => { if (event.key === 'Escape') dismiss(); }}>
      <DismissBackdrop onClose={dismiss}/>
      <figure>
        <img src={photos[open].url} alt={photos[open].caption || `Evidencia ${open + 1} de la solicitud`}/>
        {photos[open].caption && <figcaption>{photos[open].caption}</figcaption>}
      </figure>
      <button ref={close} type="button" className="button primary" onClick={dismiss}>Cerrar</button>
    </dialog>}
  </div>;
}
