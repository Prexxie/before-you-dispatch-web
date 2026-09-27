"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useState } from "react";
import type { LatLng } from "@/components/PinMap";
import { submitLocation } from "@/lib/api";

// Leaflet touches `window` on import, so it can only load in the browser.
const PinMap = dynamic(() => import("@/components/PinMap"), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
  ),
});

// Where the map starts if the phone won't share its location.
const FALLBACK_CENTER: LatLng = { lat: 6.5244, lng: 3.3792 }; // Lagos

const NOTE_MAX_LENGTH = 200;

type SearchResult = { display_name: string; lat: string; lon: string };

export default function LocationStep({ token }: { token: string }) {
  const [pin, setPin] = useState<LatLng>(FALLBACK_CENTER);
  const [recenterKey, setRecenterKey] = useState(0);
  // Only ever rendered client-side (after the customer confirms), so
  // navigator is available here.
  const [locating, setLocating] = useState(() => "geolocation" in navigator);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);

  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function moveTo(next: LatLng) {
    setPin(next);
    setRecenterKey((k) => k + 1);
  }

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        moveTo({ lat: coords.latitude, lng: coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // Nominatim's usage policy allows occasional searches but not
  // search-as-you-type, so this only runs when the customer submits.
  async function search(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const params = new URLSearchParams({
        q,
        format: "json",
        limit: "5",
        countrycodes: "ng",
      });
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
      );
      setResults(res.ok ? await res.json() : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await submitLocation(token, { ...pin, landmarkNote: note.trim() });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="mt-8 rounded-lg bg-green-50 px-4 py-3 text-green-800 dark:bg-green-950 dark:text-green-200">
        Got it. Your rider will use this pin and note to find you.
      </div>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">Show the rider where to find you</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {locating
          ? "Finding your location…"
          : "Drag the pin (or tap the map) to your exact spot."}
      </p>

      <form onSubmit={search} className="mt-4 flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your estate or street"
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={searching}
          className="rounded-lg border border-zinc-300 px-4 py-2 font-medium disabled:opacity-60 dark:border-zinc-700"
        >
          {searching ? "…" : "Search"}
        </button>
      </form>

      {results && (
        <ul className="mt-2 divide-y divide-zinc-200 rounded-lg border border-zinc-200 text-sm dark:divide-zinc-800 dark:border-zinc-800">
          {results.length === 0 && (
            <li className="px-3 py-2 text-zinc-500">
              No matches. Try a nearby street or landmark.
            </li>
          )}
          {results.map((r) => (
            <li key={`${r.lat},${r.lon}`}>
              <button
                type="button"
                onClick={() => {
                  moveTo({ lat: Number(r.lat), lng: Number(r.lon) });
                  setResults(null);
                }}
                className="w-full px-3 py-2 text-left"
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <PinMap pin={pin} recenterKey={recenterKey} onPinChange={setPin} />
      </div>

      <form onSubmit={save} className="mt-4">
        <label htmlFor="landmark" className="block font-medium">
          Landmark note
        </label>
        <textarea
          id="landmark"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={NOTE_MAX_LENGTH}
          rows={2}
          required
          placeholder="e.g. Blue gate, opposite the pharmacy"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={saving || note.trim() === ""}
          className="mt-3 w-full rounded-lg bg-green-600 py-3 font-medium text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save my location"}
        </button>
      </form>
    </section>
  );
}
