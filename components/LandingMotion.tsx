"use client";

import { useEffect, useRef } from "react";

// Landing-page motion. Everything here only adds polish: with no JavaScript,
// or with reduced motion, the page is fully visible and still.

// Scroll reveal for the landing page, driven entirely by class names so the
// markup stays plain. `.lp-reveal` elements below the fold start hidden
// (`pre`) and fade up when they scroll into view; `.lp-draw` elements just get
// "in" so their own animation can start.
export function ScrollReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          el.classList.add("in");
          // Once it has faded in, drop the helper classes so the element's
          // own hover transitions take over again.
          if (el.classList.contains("pre")) {
            timers.push(
              setTimeout(() => el.classList.remove("pre", "in"), 1000),
            );
          }
        }
      },
      { threshold: 0.15 },
    );
    document.querySelectorAll<HTMLElement>(".lp-reveal, .lp-draw").forEach((el) => {
      const below = el.getBoundingClientRect().top > window.innerHeight * 0.92;
      if (el.classList.contains("lp-reveal")) {
        if (reduce || !below) return;
        el.classList.add("pre");
      }
      io.observe(el);
    });
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
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
    show(0);
    let raf = 0;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
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
