"use client";

import { useEffect } from "react";
import { getAttentionCount } from "@/lib/api";
import { useLiveData } from "@/lib/useLiveData";

// How many orders need the vendor's attention (the dashboard's "Needs your
// attention" card), refreshed every 15 s like the rest of the vendor pages.
// Also shown in the browser tab title, "(3) WakaRoute…", so a vendor with the
// tab in the background still sees it.
export function useAttentionCount(): number {
  const [state] = useLiveData(() => getAttentionCount(), "attention-count");
  const count = state.kind === "ready" ? state.data : 0;
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, "");
    document.title = count > 0 ? `(${count}) ${base}` : base;
    return () => {
      document.title = document.title.replace(/^\(\d+\) /, "");
    };
  }, [count]);
  return count;
}

// The amber count next to the Dashboard link (design: "Vendor: Dashboard"),
// the same amber as the card. It gives a short shake every few seconds to
// catch the eye (not with reduced motion). Hidden at 0.
export function AttentionPill({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    // Keyed on the number so the shake starts over when it changes.
    <span
      key={count}
      className="nav-count"
      aria-label={`${count} ${count === 1 ? "order needs" : "orders need"} your attention`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

// For pages without the sidebar (an order, a new order): fetches the count
// itself.
export function LiveAttentionPill() {
  return <AttentionPill count={useAttentionCount()} />;
}
