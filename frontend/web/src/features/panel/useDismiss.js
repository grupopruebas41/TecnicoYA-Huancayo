import {useEffect, useRef} from 'react';

/** Cierra un popover abierto con un clic o toque fuera de su contenedor. */
export default function useDismiss(open, onDismiss) {
  const root = useRef(null);
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  useEffect(() => {
    if (!open) return undefined;
    const outside = event => { if (root.current && !root.current.contains(event.target)) dismiss.current(); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  return root;
}
