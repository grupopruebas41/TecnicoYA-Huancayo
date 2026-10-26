import { useLayoutEffect } from "react";

const ACCOUNT_HASH = /^#cuenta(?:\/|$)/;
const OTHER_APP_HASHES = ["#plataforma", "#catalogo"];
const SECTION_MARGIN = 16;
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

export function calculateScrollTarget({
  sectionRect,
  headerRect = null,
  subnavRect = null,
  viewportHeight,
  scrollY,
}) {
  const fixedBottom = Math.max(
    0,
    headerRect?.bottom || 0,
    subnavRect?.bottom || 0,
  );
  const availableTop = fixedBottom + SECTION_MARGIN;
  const availableHeight = Math.max(
    0,
    viewportHeight - availableTop - SECTION_MARGIN,
  );
  const sectionHeight = Math.max(0, sectionRect.height);
  const desiredTop = sectionHeight <= availableHeight
    ? availableTop + (availableHeight - sectionHeight) / 2
    : availableTop;

  return Math.max(0, sectionRect.top + scrollY - desiredTop);
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
  const header = document.querySelector(".ty-header");
  const aboutSubnav = section.closest(".about-page")
    ? document.querySelector(".ty-about-nav")
    : null;
  const align = (behavior) => {
    const sectionRect = section.getBoundingClientRect();
    const hero = id === "inicio" || section.classList.contains("ty-about-hero");
    const top = hero
      ? Math.max(0, window.scrollY + sectionRect.top)
      : calculateScrollTarget({
          sectionRect,
          headerRect: visibleRect(header),
          subnavRect: visibleRect(aboutSubnav),
          viewportHeight: window.innerHeight,
          scrollY: window.scrollY,
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
