"use client";

import Script from "next/script";
import LogoLoader from "./LogoLoader";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

type GoogleId = {
  initialize: (config: { client_id: string; callback: (r: { credential: string }) => void }) => void;
  renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

// Design: the "Continue with Google" button and the "OR … WITH EMAIL"
// divider. The button itself is Google's own (their sign-in script draws it),
// so it can't match the mockup pixel for pixel; its width follows the card.
// Renders nothing at all when no client ID is configured, rather than a
// button that does nothing.
export default function GoogleButton({
  onCredential,
  dividerText,
  text = "continue_with",
}: {
  onCredential: (credential: string) => void;
  dividerText: string;
  text?: "continue_with" | "signin_with" | "signup_with";
}) {
  const box = useRef<HTMLDivElement>(null);
  const latest = useRef(onCredential);
  const [loaded, setLoaded] = useState(false);
  // The script may already be on the page (navigating between login and
  // sign up): read that without setting state inside an effect.
  const alreadyLoaded = useSyncExternalStore(
    () => () => {},
    () => Boolean(window.google?.accounts?.id),
    () => false,
  );
  const ready = loaded || alreadyLoaded;

  useEffect(() => {
    latest.current = onCredential;
  });
  useEffect(() => {
    if (!ready || !box.current || !CLIENT_ID || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (r) => latest.current(r.credential),
    });
    window.google.accounts.id.renderButton(box.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text,
      shape: "rectangular",
      logo_alignment: "center",
      width: Math.min(400, Math.max(200, box.current.clientWidth)),
    });
  }, [ready, text]);

  if (!CLIENT_ID) return null;
  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setLoaded(true)}
      />
      <div ref={box} data-testid="google-button" style={{ minHeight: 44, display: "flex", justifyContent: "center" }} />
      <div className="divider">{dividerText}</div>
    </>
  );
}

// Shown from the moment Google hands back the credential until the next page
// takes over (verifying with the API, then a full page load), so the form
// doesn't sit there looking untouched for several seconds. Also the holding
// screen on the sign-up page while it picks up a new Google user.
export function GoogleProgress() {
  return (
    <div
      className="card"
      style={{ marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "40px 24px" }}
    >
      <LogoLoader />
    </div>
  );
}
