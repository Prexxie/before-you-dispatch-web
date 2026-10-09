"use client";

import { ReactNode, useEffect, useRef } from "react";

// Landing-page motion. Everything here only adds polish: with no JavaScript
// the page is fully visible and still. It does not follow the OS "reduce
// motion" setting: many Android phones (Redmi, battery saver) report it on by
// default, which switched the whole landing page off.

// Scroll reveal for the landing page, driven entirely by class names so the
// markup stays plain. `.lp-reveal` elements start hidden (`pre`) and fade up
// ("in") whenever they scroll into view, and reset when they leave, so the
// motion plays every time, not just the first. `.lp-draw` elements get the
// same classes so their own step-by-step animation can (re)start. Without
// JavaScript, or with reduced motion, nothing is ever hidden.
export function ScrollReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = document.querySelectorAll<HTMLElement>(".lp-reveal, .lp-draw");
    // "Visible" means 15% of the element, or 15% of the screen's height for
    // an element taller than that (on a phone the stacked comparison is
    // several screens tall, so 15% of it is never on screen at once).
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const seen =
            e.isIntersecting &&
            (e.intersectionRatio >= 0.15 ||
              e.intersectionRect.height >= window.innerHeight * 0.15);
          e.target.classList.toggle("in", seen);
        }
      },
      // Fine steps so tall elements are re-checked as they scroll by.
      { threshold: Array.from({ length: 51 }, (_, i) => i / 50), rootMargin: "0px 0px -4% 0px" },
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
    if (typeof IntersectionObserver === "undefined") return;
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

// A rider driving along one of the landing page's dotted routes, once:
// - the hero's ("load"): when the page loads or is refreshed, in from the
//   left edge and out past the top right;
// - the closing banner's ("view"): the first time it scrolls into view, from
//   the start ring to the pin, fading out on arrival.
// `route` finds the <path> inside the rider's parent element. The routes are
// SVGs scaled to their boxes, so each frame maps the point on the path to
// screen space; the rider stays on the line at any width and tilts with the
// curve without being squashed. Hidden with reduced motion, without
// JavaScript, and once the drive is over.
const RIDE_DELAY_MS = 700; // on load: after the hero copy has risen in
const RIDE_MS = 9000;

export function RouteRider({
  route,
  startOn,
  className,
  duration = RIDE_MS,
  children,
}: {
  route: string;
  startOn: "load" | "view";
  className: string;
  duration?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    const box = el?.parentElement;
    const path = box?.querySelector<SVGPathElement>(route);
    if (!el || !box || !path) return;

    const total = path.getTotalLength();
    const ease = (t: number) => (1 - Math.cos(Math.PI * t)) / 2; // sine in-out: steady pace
    const local = (x: number, y: number, rect: DOMRect, ctm: DOMMatrix) => {
      const pt = new DOMPoint(x, y).matrixTransform(ctm);
      return { x: pt.x - rect.left, y: pt.y - rect.top };
    };
    const place = (len: number) => {
      const ctm = path.getScreenCTM();
      if (!ctm) return;
      const rect = box.getBoundingClientRect();
      const a = path.getPointAtLength(len);
      const b = path.getPointAtLength(Math.min(total, len + 2));
      const p = local(a.x, a.y, rect, ctm);
      const q = local(b.x, b.y, rect, ctm);
      const angle = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
      el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${angle}deg)`;
    };

    // The route is shorter on a phone, so the drive is quicker too.
    const ride_ms = window.innerWidth <= 900 ? Math.min(duration, 5000) : duration;
    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let start: number | null = null;
    const step = (now: number) => {
      start ??= now;
      const t = Math.min(1, (now - start) / ride_ms);
      place(ease(t) * total);
      if (t < 1) frame = requestAnimationFrame(step);
      else el.classList.remove("riding");
    };
    const ride = () => {
      place(0);
      el.classList.add("riding");
      frame = requestAnimationFrame(step);
    };

    let io: IntersectionObserver | undefined;
    if (startOn === "load") {
      timer = setTimeout(ride, RIDE_DELAY_MS);
    } else if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io?.disconnect();
            timer = setTimeout(ride, 300);
          }
        },
        { threshold: 0.6 },
      );
      io.observe(box);
    }
    return () => {
      io?.disconnect();
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [route, startOn, duration]);
  return (
    <span ref={ref} className={`lp-route-rider ${className}`} aria-hidden="true">
      <span>{children}</span>
    </span>
  );
}
