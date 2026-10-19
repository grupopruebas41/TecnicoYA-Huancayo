import React, { useEffect, useRef, useState } from "react";
// El ancla es la respuesta del servidor; performance.now evita cambios del reloj civil.
export default function OfferCountdown({
  expiresAt,
  serverTime,
  onExpire = () => {},
}) {
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
  return (
    <div>
      <span role="timer" aria-live="off">
        {seconds === null
          ? "Tiempo no disponible"
          : `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`}
      </span>
      <span aria-live="polite">{seconds === 0 ? "Plazo vencido" : ""}</span>
    </div>
  );
}
