"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useState } from "react";
import type { LatLng } from "@/components/PinMap";
import {
  LocationInput,
  LocationLockedError,
  NotFoundError,
  submitLocation,
} from "@/lib/api";

// Leaflet touches `window` on import, so it can only load in the browser.
const PinMap = dynamic(() => import("@/components/PinMap"), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
  ),
});

// Where the map starts if the phone won't share its location.
const FALLBACK_CENTER: LatLng = { lat: 6.5244, lng: 3.3792 }; // Lagos

// Matches the API's limit (API.md, POST /orders/:customerToken/location).
const NOTE_MAX_LENGTH = 200;

type SearchResult = { display_name: string; lat: string; lon: string };

type Props = {
  token: string;
  // Pin already saved for this order: show it, with the option to change it.
  saved: LocationInput | null;
  // Pin from the customer's earlier order: start the map there.
  previous: LocationInput | null;
};

export default function LocationStep({ token, saved, previous }: Props) {
  const [savedLocation, setSavedLocation] = useState(saved);
  const [editing, setEditing] = useState(saved === null);
  const start = saved ?? previous;

  const [pin, setPin] = useState<LatLng>(
    start ? { lat: start.lat, lng: start.lng } : FALLBACK_CENTER,
  );
  const [recenterKey, setRecenterKey] = useState(0);
  // Only ever rendered client-side (after the customer confirms), so
  // navigator is available here. A known pin beats the phone's guess, so
  // only auto-locate when there isn't one.
  const [locating, setLocating] = useState(
    () => start === null && "geolocation" in navigator,
  );
  const [locateFailed, setLocateFailed] = useState(
    () => start === null && !("geolocation" in navigator),
  );

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);

  const [note, setNote] = useState(start?.landmarkNote ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  function moveTo(next: LatLng) {
    setPin(next);
    setRecenterKey((k) => k + 1);
  }

  // State only changes in the callbacks, so this is safe to call from an effect.
  function requestPosition() {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        moveTo({ lat: coords.latitude, lng: coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocateFailed(true);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function locate() {
    if (!("geolocation" in navigator)) {
      setLocateFailed(true);
      return;
    }
    setLocating(true);
    setLocateFailed(false);
    requestPosition();
  }

  useEffect(() => {
    if (start === null && "geolocation" in navigator) requestPosition();
    // Run once on mount; `start` comes from props that don't change here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setSaveError(null);
    try {
      const stored = await submitLocation(token, {
        ...pin,
        landmarkNote: note.trim(),
      });
      setSavedLocation(stored);
      setEditing(false);
    } catch (err) {
      if (err instanceof LocationLockedError) {
        setLocked(true);
        setSaveError(err.message);
      } else if (err instanceof NotFoundError) {
        setSaveError("This link isn't valid any more. Please contact the vendor.");
      } else {
        setSaveError("That didn't save. Check your connection and try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!editing && savedLocation) {
    return (
      <div className="mt-8 rounded-lg bg-green-50 px-4 py-3 text-green-800 dark:bg-green-950 dark:text-green-200">
        <p className="font-medium">
          Got it. Your rider will use this pin and note to find you.
        </p>
        <p className="mt-2 text-sm">
          Landmark: <span className="font-medium">{savedLocation.landmarkNote}</span>
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-3 text-sm font-medium underline underline-offset-2"
        >
          Change my pin
        </button>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="mt-8 rounded-lg bg-zinc-100 px-4 py-3 dark:bg-zinc-900">
        <p>{saveError}</p>
      </div>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">Show the rider where to find you</h2>
      {previous && !savedLocation && (
        <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
          We&apos;ve loaded the spot and note you used last time. Drag the pin
          if you&apos;re somewhere else today.
        </p>
      )}
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {locating
          ? "Finding your location…"
          : "Drag the pin (or tap the map) to your exact spot."}
      </p>
      {locateFailed && (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          We couldn&apos;t get your location. Search for your estate or street
          instead.
        </p>
      )}

      <form onSubmit={search} className="mt-4 flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your estate or street"
          aria-label="Search your estate or street"
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
      <button
        type="button"
        onClick={locate}
        disabled={locating}
        className="mt-2 text-sm font-medium text-green-700 underline underline-offset-2 disabled:opacity-60 dark:text-green-400"
      >
        Use my current location
      </button>

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
        {saveError && (
          <p className="mt-3 text-sm text-red-600">{saveError}</p>
        )}
        {savedLocation && (
          <button
            type="button"
            onClick={() => {
              moveTo({ lat: savedLocation.lat, lng: savedLocation.lng });
              setNote(savedLocation.landmarkNote);
              setEditing(false);
              setSaveError(null);
            }}
            className="mt-3 w-full text-sm font-medium text-zinc-600 underline underline-offset-2 dark:text-zinc-400"
          >
            Keep my saved pin
          </button>
        )}
      </form>
    </section>
  );
}
