import { useEffect, useRef, useState } from "react";
import { request } from "../features/administration/http";
export function useMotion() {
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(m.matches);
    m.addEventListener("change", change);
    return () => m.removeEventListener("change", change);
  }, []);
  return reduced;
}
export function useReveal() {
  const ref = useRef(null);
  const reduced = useMotion();
  useEffect(() => {
    if (reduced) return;
    const elements = ref.current?.querySelectorAll("[data-reveal]") || [];
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.target)
            e.target.classList.toggle("is-visible", e.isIntersecting);
        }),
      { threshold: 0.12 },
    );
    elements.forEach((e) => observer.observe(e));
    return () => observer.disconnect();
  }, [reduced]);
  return ref;
}
export function useCatalog() {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setError("");
    Promise.all([
      request("/catalog/specialties"),
      request("/catalog/districts"),
    ])
      .then(async ([s, d]) => {
        const specialties = s.data.filter((x) => x.active !== false);
        const subs = await Promise.all(
          specialties.map((x) =>
            request("/catalog/subcategories?specialty_id=" + x.id),
          ),
        );
        if (live)
          setData({
            specialties,
            districts: d.data.filter((x) => x.active !== false),
            subcategories: subs.flatMap((r) =>
              r.data.filter((x) => x.active !== false),
            ),
          });
      })
      .catch(() => {
        if (live)
          setError("No pudimos cargar el catálogo. Inténtalo nuevamente.");
      });
    return () => {
      live = false;
    };
  }, [retry]);
  return { data, error, reload: () => setRetry((n) => n + 1) };
}
export function useCount(value) {
  const reduced = useMotion();
  const ref = useRef(null);
  const [count, setCount] = useState(value);
  useEffect(() => {
    if (reduced) {
      setCount(value);
      return;
    }
    let frame;
    const observer = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(frame);
      if (!e.isIntersecting) return;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / 900);
        setCount(Math.round(value * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    if (ref.current) observer.observe(ref.current);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [value, reduced]);
  return [ref, count];
}
