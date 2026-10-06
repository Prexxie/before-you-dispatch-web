"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Vendor, getMe } from "@/lib/api";
import { firstName } from "@/lib/links";
import { initials } from "@/lib/format";
import LogoutButton from "./LogoutButton";

// The signed-in vendor's own name and email (not the business's), shown as an
// initials avatar. Each shell fetches it itself, so pages don't have to pass it.
function useProfile(): Vendor | null {
  const [me, setMe] = useState<Vendor | null>(null);
  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((v) => {
        if (!cancelled) setMe(v);
      })
      .catch(() => {
        // The avatar just stays blank; nothing else depends on it.
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return me;
}

// Closes a popover on an outside click or Escape.
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouse);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

// Sidebar footer (dashboard, riders, settings): the vendor's avatar, name and
// email. Tapping it opens a menu with "Log out", so it isn't on show all the
// time.
export function ProfileBlock() {
  const me = useProfile();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} style={{ position: "relative" }}>
      {open && (
        <div
          className="profile-menu"
          role="menu"
          style={{ top: "auto", bottom: "calc(100% + 6px)", left: 0, right: 0, width: "auto" }}
        >
          <LogoutButton className="profile-menu-item" showIcon />
        </div>
      )}
      <button
        type="button"
        className={`profile-trigger${open ? " open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="profile-avatar" aria-hidden="true">
          {me ? initials(me.ownerName) : ""}
        </span>
        <span className="profile-who">
          <strong>{me?.ownerName ?? "\u00a0"}</strong>
          <span>{me?.email ?? "\u00a0"}</span>
        </span>
        <svg className="profile-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

const GearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Dark top bar on order pages: avatar chip that opens a small account menu.
export function ProfileMenu() {
  const me = useProfile();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="profile-chip"
        aria-label="Account menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="profile-avatar">{me ? initials(me.ownerName) : ""}</span>
        {me ? firstName(me.ownerName) : ""}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="profile-menu">
          <div className="profile-menu-head">
            <span className="profile-avatar">{me ? initials(me.ownerName) : ""}</span>
            <span className="profile-who">
              <strong>{me?.ownerName}</strong>
              <span>{me?.email}</span>
            </span>
          </div>
          <Link href="/vendor/settings" className="profile-menu-item">
            <GearIcon />
            Settings
          </Link>
          <LogoutButton className="profile-menu-item" showIcon />
        </div>
      )}
    </div>
  );
}
