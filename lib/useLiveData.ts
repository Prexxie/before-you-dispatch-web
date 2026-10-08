"use client";

import { useEffect, useRef, useState } from "react";
import { NotFoundError } from "./api";

// Decided 28 Sep: vendor pages check for changes every 15 seconds.
export const REFRESH_MS = 15_000;

export type LiveState<T> =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "error" }
  | { kind: "ready"; data: T };

// Loads now, then again every REFRESH_MS while the tab is visible (and
// straight away when it becomes visible again), until `done(data)` says
// nothing more can change. A failed refresh keeps the last good data.
export function useLiveData<T>(
  load: () => Promise<T>,
  key: string,
  done: (data: T) => boolean = () => false,
): [LiveState<T>, (data: T) => void] {
  const [state, setState] = useState<LiveState<T>>({ kind: "loading" });
  // Latest callbacks without restarting the loop on every render.
  const loadRef = useRef(load);
  const doneRef = useRef(done);
  // Bumped by the setter below, so a refresh that was already in flight when
  // the page saved a change (a new rider, a dispatch) can't land afterwards
  // and put the old data back.
  const versionRef = useRef(0);
  useEffect(() => {
    loadRef.current = load;
    doneRef.current = done;
  });

  useEffect(() => {
    let stopped = false;
    let finished = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function run() {
      clearTimeout(timer);
      const version = versionRef.current;
      try {
        const data = await loadRef.current();
        if (stopped) return;
        if (version !== versionRef.current) {
          timer = setTimeout(tick, REFRESH_MS);
          return;
        }
        setState({ kind: "ready", data });
        if (doneRef.current(data)) {
          finished = true;
          return;
        }
      } catch (err) {
        if (stopped) return;
        if (err instanceof NotFoundError) {
          setState({ kind: "missing" });
          return;
        }
        setState((s) => (s.kind === "ready" ? s : { kind: "error" }));
      }
      timer = setTimeout(tick, REFRESH_MS);
    }

    function tick() {
      if (document.visibilityState === "visible") run();
      else timer = setTimeout(tick, REFRESH_MS);
    }

    function onVisible() {
      if (!finished && document.visibilityState === "visible") run();
    }

    run();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [key]);

  return [
    state,
    (data: T) => {
      versionRef.current += 1;
      setState({ kind: "ready", data });
    },
  ];
}
