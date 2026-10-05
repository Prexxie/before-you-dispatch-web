"use client";

import { ChangeEvent, useRef, useState } from "react";
import { resizeImageToDataUrl } from "@/lib/imageResize";

// Reject absurd files outright, before ever trying to resize one.
const MAX_LOGO_PICK_BYTES = 15 * 1024 * 1024;

// The logo-circle + camera badge from the design (Vendor: Set Up Workspace,
// reused as-is for Vendor: Settings' profile edit). A click opens a file
// picker; the picked photo is resized client-side to a small data URL with
// a live preview, before it's ever sent anywhere.
export default function LogoPicker({
  value,
  onChange,
  label = "Add a business photo or logo",
  changeLabel = "Change business photo or logo",
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
  // Screen-reader name of the button once a photo is set.
  changeLabel?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets picking the same file again re-fire onChange
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > MAX_LOGO_PICK_BYTES) {
      setError("That image is too large.");
      return;
    }
    try {
      onChange(await resizeImageToDataUrl(file));
    } catch {
      setError("Couldn't read that image. Try a different one.");
    }
  }

  return (
    <div className="logo-upload">
      <button
        type="button"
        className="logo-circle"
        onClick={() => fileInput.current?.click()}
        aria-label={value ? changeLabel : label}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- a
          // freshly picked or already-saved data URL, not a served asset.
          <img src={value} alt="" />
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7l1 1.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        )}
        <span className="cam" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        onChange={pick}
        style={{ display: "none" }}
      />
      <span style={{ fontSize: 12.5, color: "var(--ink-faint)", fontWeight: 600 }}>
        {label} (optional)
      </span>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="underline"
          style={{ fontSize: 12.5, marginTop: 4 }}
        >
          Remove photo
        </button>
      )}
      {error && (
        <p className="mt-1 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
