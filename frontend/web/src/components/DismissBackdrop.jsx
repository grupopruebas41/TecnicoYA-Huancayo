import React from 'react';
import './dismissBackdrop.css';

/**
 * Fondo de un diálogo como botón nativo: un clic fuera del diálogo lo cierra. Cierre S4-S5 (Sonar S6847/S6848): reemplaza
 * los manejadores de clic del contenedor. Queda fuera del orden de tabulación porque con el teclado el diálogo se cierra
 * con Esc o con su propio botón «Cerrar».
 */
// Su nombre es distinto del botón «Cerrar» del diálogo, para no repetir dos controles con el mismo nombre.
export default function DismissBackdrop({onClose, disabled = false, label = 'Cerrar al tocar fuera'}) {
  return <button type="button" className="dismiss-backdrop" aria-label={label} tabIndex={-1} disabled={disabled} onClick={onClose}/>;
}
