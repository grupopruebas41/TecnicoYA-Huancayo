import { useLayoutEffect } from "react";

const ACCOUNT_HASH = /^#cuenta(?:\/|$)/;
const OTHER_APP_HASHES = ["#plataforma", "#catalogo"];
let pendingSectionId = null;

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

export function scrollToSection(id) {
  const section = document.getElementById(id);
  clearPublicHash();
  if (!section) return false;

  const reducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  section.scrollIntoView?.({
    behavior: reducedMotion ? "auto" : "smooth",
    block: "start",
  });

  const heading = section.matches("h1, h2, h3")
    ? section
    : section.querySelector("h1, h2, h3") || section;
  if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
  return true;
}

export function useScrollToTopOnLoad(route) {
  useLayoutEffect(() => {
    window.history.scrollRestoration = "manual";
    clearPublicHash();
    window.scrollTo(0, 0);
  }, [route]);
}
