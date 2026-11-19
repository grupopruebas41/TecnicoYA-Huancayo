import {useEffect, useRef} from 'react';

/**
 * Escucha eventos nativos del elemento de `ref` mientras `active` sea verdadero. Cierre S4-S5 (Sonar S6847/S6848):
 * para lo que no es una interacción del propio contenedor (pausar un carrusel al pasar el mouse o al entrar el foco,
 * deslizar con el dedo, o las flechas que llegan desde sus botones nativos), sin volverlo un control falso.
 * Las claves son nombres de eventos del DOM; con el sufijo «Capture» se escuchan en la fase de captura (como onFocus
 * de React, que también recibe el foco de los hijos).
 */
export default function useEvents(ref, handlers, active = true) {
  const latest = useRef(handlers);
  latest.current = handlers;
  const types = Object.keys(handlers).join(' ');
  useEffect(() => {
    const node = ref.current;
    if (!node || !active) return undefined;
    const bound = types.split(' ').filter(Boolean).map(key => {
      const capture = key.endsWith('Capture');
      const name = capture ? key.slice(0, -'Capture'.length) : key;
      const listener = event => latest.current[key]?.(event);
      node.addEventListener(name, listener, capture);
      return () => node.removeEventListener(name, listener, capture);
    });
    return () => bound.forEach(unbind => unbind());
  }, [ref, types, active]);
}
