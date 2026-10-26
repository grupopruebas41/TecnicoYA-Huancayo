import { useLayoutEffect } from "react";

const ACCOUNT_HASH = /^#cuenta(?:\/|$)/;
const OTHER_APP_HASHES = ["#plataforma", "#catalogo"];
let pendingSectionId = null;
let activeAlignment = null;

export function currentRoute() {
  if (ACCOUNT_HASH.test(window.location.hash)) return window.location.hash;
  if (OTHER_APP_HASHES.includes(window.location.hash)) {
    return window.location.hash;
  }
  return window.location.pathname.replace(/\/$/, "") === "/nosotros"
    ? "/nosotros"
    : "/";
}

export function navigateToPath(path, { sectionId = null } = {}) {
  pendingSectionId = sectionId;
  window.history.pushState(null, "", path);
  window.dispatchEvent(new Event("tecnicoya:navigate"));
}

export function navigateToSection(id) {
  if (document.getElementById(id)) return scrollToSection(id);
  navigateToPath("/", { sectionId: id });
  return true;
}

export function consumePendingSection() {
  const id = pendingSectionId;
  pendingSectionId = null;
  return id;
}

function clearPublicHash() {
  if (
    !window.location.hash ||
    ACCOUNT_HASH.test(window.location.hash) ||
    OTHER_APP_HASHES.includes(window.location.hash)
  ) return;
  window.history.replaceState(
    window.history.state,
    "",
    window.location.pathname + window.location.search,
  );
}

function visibleRect(element) {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return rect;
}

/**
 * "top": el borde superior de la sección queda justo bajo la cabecera fija
 * (y la barra del submenú). "center": el bloque se centra en el espacio libre
 * bajo ellas y, si no cabe, se alinea arriba.
 */
export function calculateScrollTarget({
  sectionRect,
  headerRect = null,
  subnavRect = null,
  viewportHeight,
  scrollY,
  mode = "top",
}) {
  const fixedBottom = Math.max(
    0,
    headerRect?.bottom || 0,
    subnavRect?.bottom || 0,
  );
  const availableHeight = Math.max(0, viewportHeight - fixedBottom);
  const sectionHeight = Math.max(0, sectionRect.height);
  const desiredTop = mode === "center" && sectionHeight <= availableHeight
    ? fixedBottom + (availableHeight - sectionHeight) / 2
    : fixedBottom;

  return Math.max(0, sectionRect.top + scrollY - desiredTop);
}

function fixedChrome(scope) {
  return {
    header: document.querySelector(".ty-header"),
    subnav: scope?.closest(".about-page")
      ? document.querySelector(".ty-about-navbar")
      : null,
  };
}

/** Publica la altura real de la cabecera (y submenú) para los min-height del CSS. */
export function useFixedChromeOffset(deps) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const header = document.querySelector(".ty-header");
      const subnav = document.querySelector(".ty-about-navbar");
      const headerBottom = visibleRect(header)?.bottom || 0;
      const fixedBottom = Math.max(headerBottom, visibleRect(subnav)?.bottom || 0);
      if (headerBottom) root.style.setProperty("--ty-header-bottom", headerBottom + "px");
      if (fixedBottom) root.style.setProperty("--ty-fixed-top", fixedBottom + "px");
    };
    update();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    document.querySelectorAll(".ty-header, .ty-about-navbar").forEach((el) => observer?.observe(el));
    window.addEventListener("resize", update, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, deps);
}

export function scrollToTop() {
  cleanupAlignment();
  window.scrollTo({ top: 0, behavior: isReducedMotion() ? "auto" : "smooth" });
}

function cleanupAlignment() {
  activeAlignment?.cleanup();
  activeAlignment = null;
}

function isReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToSection(id) {
  const section = document.getElementById(id);
  clearPublicHash();
  if (!section) return false;

  cleanupAlignment();
  const { header, subnav } = fixedChrome(section);
  // Un grupo marcado con data-frame="center" se encuadra completo (Cómo funciona).
  const frame = section.closest("[data-frame='center']");
  const align = (behavior) => {
    const sectionRect = (frame || section).getBoundingClientRect();
    const hero = id === "inicio" || section.classList.contains("ty-about-hero");
    const top = hero
      ? Math.max(0, window.scrollY + sectionRect.top)
      : calculateScrollTarget({
          sectionRect,
          headerRect: visibleRect(header),
          subnavRect: visibleRect(subnav),
          viewportHeight: window.innerHeight,
          scrollY: window.scrollY,
          mode: frame ? "center" : "top",
        });
    window.scrollTo({ top, behavior: isReducedMotion() ? "auto" : behavior });
  };

  align("smooth");
  const heading = section.matches("h1, h2, h3")
    ? section
    : section.querySelector("h1, h2, h3") || section;
  if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
  window.dispatchEvent(new CustomEvent("tecnicoya:section-active", { detail: { id } }));

  const realign = () => align("auto");
  const onImageLoad = (event) => {
    if (event.target instanceof HTMLImageElement && section.contains(event.target)) {
      realign();
    }
  };
  const cancel = () => cleanupAlignment();
  const cleanup = () => {
    window.removeEventListener("resize", realign);
    window.removeEventListener("pointerdown", cancel);
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchstart", cancel);
    window.removeEventListener("keydown", cancel);
    document.removeEventListener("load", onImageLoad, true);
  };
  const currentAlignment = { id, cleanup };
  activeAlignment = currentAlignment;
  window.addEventListener("resize", realign, { passive: true });
  window.addEventListener("pointerdown", cancel, { once: true, passive: true });
  window.addEventListener("wheel", cancel, { once: true, passive: true });
  window.addEventListener("touchstart", cancel, { once: true, passive: true });
  window.addEventListener("keydown", cancel, { once: true });
  document.addEventListener("load", onImageLoad, true);
  document.fonts?.ready?.then(() => {
    if (activeAlignment === currentAlignment) realign();
  });
  window.dispatchEvent(new CustomEvent("tecnicoya:section-aligned", { detail: { id } }));
  return true;
}

export function useScrollToTopOnLoad(route) {
  useLayoutEffect(() => {
    cleanupAlignment();
    window.history.scrollRestoration = "manual";
    clearPublicHash();
    window.scrollTo(0, 0);
  }, [route]);
}
