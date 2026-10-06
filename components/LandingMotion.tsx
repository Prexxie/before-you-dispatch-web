"use client";

import { useEffect, useRef } from "react";

// Landing-page motion. Everything here only adds polish: with no JavaScript,
// or with reduced motion, the page is fully visible and still.

// Scroll reveal for the landing page, driven entirely by class names so the
// markup stays plain. `.lp-reveal` elements start hidden (`pre`) and fade up
// ("in") whenever they scroll into view, and reset when they leave, so the
// motion plays every time, not just the first. `.lp-draw` elements get the
// same classes so their own step-by-step animation can (re)start. Without
// JavaScript, or with reduced motion, nothing is ever hidden.
export function ScrollReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = document.querySelectorAll<HTMLElement>(".lp-reveal, .lp-draw");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          e.target.classList.toggle("in", e.isIntersecting);
        }
      },
      // A bit of margin so things reset once well out of sight, not at the edge.
      { threshold: 0.15, rootMargin: "0px 0px -4% 0px" },
    );
    els.forEach((el) => {
      el.classList.add("pre");
      io.observe(el);
    });
    return () => {
      io.disconnect();
      els.forEach((el) => el.classList.remove("pre", "in"));
    };
  }, []);
  return null;
}

// "100%" counting up from 0 when it scrolls into view. The server renders the
// final number, so it's right before (and without) JavaScript.
export function CountUp({
  to,
  prefix = "",
  suffix = "",
  duration = 1400,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const show = (n: number) => {
      el.textContent = `${prefix}${Math.round(n)}${suffix}`;
    };
    let raf = 0;
    const io = new IntersectionObserver((entries) => {
      cancelAnimationFrame(raf);
      if (!entries.some((e) => e.isIntersecting)) {
        // Out of sight: get ready to count again next time.
        show(0);
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        show(to * (1 - Math.pow(1 - t, 3)));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      show(to);
    };
  }, [to, prefix, suffix, duration]);
  return (
    <span ref={ref}>
      {prefix}
      {to}
      {suffix}
    </span>
  );
}

// The sticky nav: a stronger shadow once the page has scrolled, and the link
// for the section being read is highlighted.
export function NavShadow() {
  useEffect(() => {
    const nav = document.querySelector(".lp-nav");
    if (!nav) return;
    const links = Array.from(
      nav.querySelectorAll<HTMLAnchorElement>('.lp-nav-links a[href^="#"]'),
    );
    const sections = links
      .map((a) => document.getElementById(a.getAttribute("href")!.slice(1)))
      .filter((el): el is HTMLElement => el !== null);
    const mark = (id: string | null) =>
      links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${id}`));

    const update = () => {
      nav.classList.toggle("scrolled", window.scrollY > 8);
      // The last section whose top has passed the middle of the screen.
      const line = window.innerHeight * 0.4;
      let current: string | null = null;
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= line) current = s.id;
      }
      mark(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return null;
}
