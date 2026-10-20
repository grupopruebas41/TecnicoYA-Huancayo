import React, { useEffect, useState } from "react";
import "./styles/tokens.css";
import "./landing.css";
import AccountApp from "./features/administration/AccountApp";
import Catalog from "./features/administration/Catalog";
import "./features/administration/sprint02.css";
import Home from "./landing/Home";
import HeroBackground from "./landing/HeroBackground";
import About from "./landing/About";
import { Header, Footer } from "./landing/Shared";
import { useCatalog, useReveal } from "./landing/hooks";
function PublicSite({ route }) {
  const catalog = useCatalog();
  const about = route.startsWith("#nosotros");
  const reveal = useReveal();
  useEffect(() => {
    window.dispatchEvent(new Event("tecnicoya:hero-change"));
    const id = about ? route.split("/")[1] : route.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView?.();
    else window.scrollTo?.(0, 0);
  }, [route, about]);
  return (
    <div className={"landing-page " + (about ? "about-page" : "")} ref={reveal}>
      <HeroBackground />
      <a className="skip" href="#contenido">
        Ir al contenido
      </a>
      <Header />
      <main id="contenido">
        {about ? <About catalog={catalog} /> : <Home catalog={catalog} />}
      </main>
      <Footer />
    </div>
  );
}
export default function App() {
  const [route, setRoute] = useState(window.location.hash);
  useEffect(() => {
    const change = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  const account =
    ["#cuenta", "#plataforma", "#catalogo"].includes(route) ||
    route.startsWith("#cuenta/");
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
      key={route.startsWith("#nosotros") ? "about" : "home"}
      route={route}
    />
  );
}
