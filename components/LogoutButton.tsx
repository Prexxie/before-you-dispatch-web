"use client";

import { useState } from "react";
import { logOut } from "@/lib/api";

export default function LogoutButton({ className }: { className?: string }) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleClick() {
    setLoggingOut(true);
    await logOut();
    // Full navigation: clears in-memory state and lets middleware see the
    // now-cleared cookie on the way to the login page.
    window.location.href = "/vendor/login";
  }

  return (
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
      }}
    >
      {loggingOut ? "Logging out…" : "Log out"}
    </button>
  );
}
