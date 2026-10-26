import React, { useEffect, useRef, useState } from "react";
import { CONTENT_REVEAL_SECONDS } from "../video-timing";
const NOOP = () => {};
const POSTER = "/media/landing/habitacion-estatica.webp";

/** El zoom pertenece al archivo original: nunca se transforma la capa fija. */
export default function HeroBackground({
  intro = false,
  phase = "ready",
  onPhaseChange = NOOP,
}) {
  const ref = useRef(null);
  const [posterOnly, setPosterOnly] = useState(false);
  // Fuera del hero el velo oscuro lo pone esta capa fija, no cada sección.
  const [deep, setDeep] = useState(false);
  useEffect(() => {
    const video = ref.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let disposed = false;
    let failed = false;
    let playingIntro = intro;
    let transitioning = false;
    let transitionTimer;
    let watchdog;
    const finishIntro = () => {
      if (disposed) return;
      playingIntro = false;
      clearTimeout(watchdog);
      clearTimeout(transitionTimer);
      onPhaseChange("ready");
    };
    const checkCue = () => {
      if (
        !playingIntro ||
        transitioning ||
        video.currentTime < CONTENT_REVEAL_SECONDS
      )
        return;
      transitioning = true;
      onPhaseChange("transition");
      transitionTimer = setTimeout(() => {
        finishIntro();
        sync();
      }, 800);
    };
    const canPlay = () =>
      !disposed &&
      (playingIntro || visible) &&
      !motion.matches &&
      !document.hidden &&
      !failed;
    const fallback = () => {
      if (disposed) return;
      failed = true;
      video.pause();
      setPosterOnly(true);
      finishIntro();
    };
    const sync = () => {
      if (disposed) return;
      setPosterOnly(motion.matches || failed);
      if (motion.matches && playingIntro) finishIntro();
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
        setDeep(!entry.isIntersecting);
        sync();
      },
      { threshold: 0.15 },
    );
    const hero = document.getElementById("inicio");
    if (hero) observer.observe(hero);
    else setDeep(true);
    video.addEventListener("timeupdate", checkCue);
    if (playingIntro) watchdog = setTimeout(fallback, 12000);
    video.addEventListener("ended", repeatBody);
    video.addEventListener("error", fallback);
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      disposed = true;
      clearTimeout(watchdog);
      clearTimeout(transitionTimer);
      video.removeEventListener("timeupdate", checkCue);
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
      data-phase={phase}
      data-depth={deep ? "deep" : "hero"}
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
