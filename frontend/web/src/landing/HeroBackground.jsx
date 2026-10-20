import React, { useEffect, useRef, useState } from "react";
import { CONTENT_REVEAL_SECONDS } from "../video-timing";
const POSTER = "/media/landing/habitacion-estatica.webp";

/** El zoom pertenece al archivo original: nunca se transforma la capa fija. */
export default function HeroBackground() {
  const ref = useRef(null);
  const [posterOnly, setPosterOnly] = useState(false);
  useEffect(() => {
    const video = ref.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let disposed = false;
    let failed = false;
    const canPlay = () =>
      !disposed && visible && !motion.matches && !document.hidden && !failed;
    const fallback = () => {
      if (disposed) return;
      failed = true;
      video.pause();
      setPosterOnly(true);
    };
    const sync = () => {
      if (disposed) return;
      setPosterOnly(motion.matches || failed);
      if (!canPlay()) {
        video.pause();
        return;
      }
      video
        .play()
        ?.then(() => {
          // Un play pendiente no debe reactivar el video fuera de pantalla.
          if (!canPlay()) video.pause();
        })
        .catch((error) => {
          if (error.name !== "AbortError") fallback();
        });
    };
    const repeatBody = () => {
      // Omite únicamente la entrada ya reproducida, sin reiniciarla al hacer scroll.
      video.currentTime = CONTENT_REVEAL_SECONDS;
      sync();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= 0.15;
        sync();
      },
      { threshold: 0.15 },
    );
    const hero = document.getElementById("inicio");
    if (hero) observer.observe(hero);
    video.addEventListener("ended", repeatBody);
    video.addEventListener("error", fallback);
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      disposed = true;
      observer.disconnect();
      video.pause();
      video.removeEventListener("ended", repeatBody);
      video.removeEventListener("error", fallback);
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  return (
    <div
      className="ty-fixed-background"
      style={{ position: "fixed", inset: 0, zIndex: -1 }}
      aria-hidden="true"
    >
      <img src={POSTER} alt="" fetchpriority="high" />
      <video
        ref={ref}
        src="/media/habitacion.mp4"
        poster={POSTER}
        muted
        playsInline
        preload="metadata"
        hidden={posterOnly}
      />
    </div>
  );
}
