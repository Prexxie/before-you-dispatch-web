"use client";

import { CSSProperties, useState } from "react";
import { createPortal } from "react-dom";
import { logOut } from "@/lib/api";
import { LOGOUT_LOADING, LOGOUT_TITLE } from "@/lib/brand";
import LogoLoader from "./LogoLoader";

// How long the logout loader stays up at least.
const MIN_LOADER_MS = 1200;

export default function LogoutButton({
  className,
  style,
  showIcon = false,
}: {
  className?: string;
  style?: CSSProperties;
  showIcon?: boolean;
}) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleClick() {
    setLoggingOut(true);
    // Logging out takes a moment at most, so hold the loader for a beat:
    // otherwise it flashes up and is gone before it can be seen.
    await Promise.all([logOut(), new Promise((r) => setTimeout(r, MIN_LOADER_MS))]);
    // Full navigation: clears in-memory state and lets middleware see the
    // now-cleared cookie on the way to the login page.
    window.location.href = "/vendor/login";
  }

  return (
    <>
    {/* In document.body, not here: the button lives in the sidebar/top bar,
        whose stacking context would keep the cover from hiding the page. */}
    {loggingOut &&
      createPortal(
        <LogoLoader page cover title={LOGOUT_TITLE} label={LOGOUT_LOADING} />,
        document.body,
      )}
    <button
      type="button"
      onClick={handleClick}
      disabled={loggingOut}
      className={className}
      style={{
        background: "none",
        border: "none",
        width: "100%",
        textAlign: "left",
        cursor: loggingOut ? "default" : "pointer",
        font: "inherit",
        color: "inherit",
        display: showIcon ? "flex" : undefined,
        alignItems: showIcon ? "center" : undefined,
        gap: showIcon ? 10 : undefined,
        ...style,
      }}
    >
      {showIcon && <LogoutIcon />}
      {loggingOut ? "Logging out…" : "Log out"}
    </button>
    </>
  );
}

// Design: "Vendor: Manage Riders" / "Vendor: Settings" sidebar.
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
