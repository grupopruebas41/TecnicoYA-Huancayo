import React, { useEffect, useRef, useState } from "react";

/**
 * Segundos que faltan para expiresAt. El ancla es la hora del servidor; performance.now evita cambios del reloj civil.
 * Fase T2 del panel del técnico: el anillo del Inicio usa este mismo cálculo.
 */
export function useCountdown(expiresAt, serverTime, onExpire = () => {}) {
  const [seconds, setSeconds] = useState(0),
    callback = useRef(onExpire);
  callback.current = onExpire;
  useEffect(() => {
    const duration = Date.parse(expiresAt) - Date.parse(serverTime),
      started = performance.now();
    let expired = false;
    function tick() {
      const remaining = Math.max(
        0,
        Math.ceil((duration - (performance.now() - started)) / 1000),
      );
      setSeconds(Number.isFinite(remaining) ? remaining : null);
      if (remaining === 0 && !expired) {
        expired = true;
        callback.current();
      }
    }
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, serverTime]);
  return seconds;
}

export const clock = (seconds) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export default function OfferCountdown({
  expiresAt,
  serverTime,
  onExpire = () => {},
}) {
  const seconds = useCountdown(expiresAt, serverTime, onExpire);
  return (
    <div>
      <span role="timer" aria-live="off">
        {seconds === null ? "Tiempo no disponible" : clock(seconds)}
      </span>
      <span aria-live="polite">{seconds === 0 ? "Plazo vencido" : ""}</span>
    </div>
  );
}
