import React, { useEffect, useState, useRef, useCallback } from "react";
import "./styles/tokens.css";
import "./landing.css";
import "./landing/polish.css";
import AccountApp from "./features/administration/AccountApp";
import Catalog from "./features/administration/Catalog";
import "./features/administration/sprint02.css";
import Home from "./landing/Home";
import HeroBackground from "./landing/HeroBackground";
import About from "./landing/About";
import { Header, Footer } from "./landing/Shared";
import { useCatalog, useReveal } from "./landing/hooks";
import {
  consumePendingSection,
  currentRoute,
  scrollToSection,
  useFixedChromeOffset,
  useScrollToTopOnLoad,
} from "./landing/navigation";
function PublicSite({ route, introCompleted }) {
  const [phase, setPhase] = useState(() =>
    introCompleted.current ||
    route === "/nosotros" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "ready"
      : "intro",
  );
  const startsWithIntro = useRef(phase === "intro");
  const changePhase = useCallback(
    (next) => {
      if (next === "ready") introCompleted.current = true;
      setPhase(next);
    },
    [introCompleted],
  );
  useEffect(() => {
    if (phase === "ready") {
      introCompleted.current = true;
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [phase, introCompleted]);
  const catalog = useCatalog();
  const about = route === "/nosotros";
  const reveal = useReveal();
  useFixedChromeOffset([phase, route]);
  useEffect(() => {
    if (phase !== "ready") return;
    window.dispatchEvent(new Event("tecnicoya:hero-change"));
    const pendingSection = consumePendingSection();
    if (pendingSection) scrollToSection(pendingSection);
  }, [phase, route]);
  return (
    <div className={"landing-page " + (about ? "about-page" : "")} ref={reveal}>
      <HeroBackground
        intro={startsWithIntro.current}
        phase={phase}
        onPhaseChange={changePhase}
      />
      <div className="ty-intro-content" hidden={phase !== "ready"}>
        <a className="skip" href="#contenido">
          Ir al contenido
        </a>
        <Header />
        <main id="contenido">
          {about ? <About catalog={catalog} /> : <Home catalog={catalog} />}
        </main>
        <Footer />
      </div>
    </div>
  );
}
export default function App() {
  const introCompleted = useRef(false);
  const [route, setRoute] = useState(currentRoute);
  useScrollToTopOnLoad(route);
  useEffect(() => {
    const change = () => setRoute(currentRoute());
    const hashChange = () => {
      const nextRoute = currentRoute();
      if (nextRoute === "/") {
        window.history.replaceState(
          window.history.state,
          "",
          window.location.pathname + window.location.search,
        );
        window.scrollTo(0, 0);
      }
      setRoute(nextRoute);
    };
    window.addEventListener("popstate", change);
    window.addEventListener("tecnicoya:navigate", change);
    window.addEventListener("hashchange", hashChange);
    return () => {
      window.removeEventListener("popstate", change);
      window.removeEventListener("tecnicoya:navigate", change);
      window.removeEventListener("hashchange", hashChange);
    };
  }, []);
  const account =
    route.startsWith("#cuenta") ||
    ["#plataforma", "#catalogo"].includes(route);
  if (account)
    return (
      <div className="account-page">
        <header className="header">
          <a className="brand" href="#inicio">
            <span className="monogram">t</span>TécnicoYa
          </a>
          <a className="button glass" href="#inicio">
            Volver al inicio
          </a>
        </header>
        <main id="contenido">
          {route === "#catalogo" ? <Catalog /> : <AccountApp />}
        </main>
      </div>
    );
  return (
    <PublicSite
      key={route === "/nosotros" ? "about" : "home"}
      route={route}
      introCompleted={introCompleted}
    />
  );
}
