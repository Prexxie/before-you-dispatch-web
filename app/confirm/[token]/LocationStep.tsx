"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { LatLng } from "@/components/PinMap";
import { Place, searchPlaces, suggestPlaces } from "@/lib/geocode";
import {
  ConfirmationDetails,
  LocationInput,
  LocationLockedError,
  NotFoundError,
  submitLocation,
} from "@/lib/api";
import {
  CheckIcon,
  HistoryIcon,
  LocateIcon,
  NoteIcon,
  PinIcon,
  RiderIcon,
  SearchIcon,
} from "@/components/icons";
import StepNav from "@/components/StepNav";
import PhoneScreen, { ResultScreen, asSentenceStart } from "@/components/PhoneScreen";

// Leaflet touches `window` on import, so it can only load in the browser.
const PinMap = dynamic(() => import("@/components/PinMap"), {
  ssr: false,
  loading: () => null,
});

// Where the map starts if the phone won't share its location.
const FALLBACK_CENTER: LatLng = { lat: 6.5244, lng: 3.3792 }; // Lagos

// Matches the API's limit (API.md, POST /orders/:customerToken/location).
const NOTE_MAX_LENGTH = 200;
const ADDRESS_MAX_LENGTH = 200;

// Where the pin currently comes from, for the chip on the map.
type PinSource = "current" | "saved" | null;

// The steps after "I'm ready", with browser-style navigation: `onBack` (from
// the first step here) returns to step one (ready / not now), which lives in
// ConfirmFlow, for a customer who changed their mind before the rider is sent.
type Props = { token: string; details: ConfirmationDetails; onBack: () => void };

type Step = "review" | "editor" | "done";

export default function LocationStep({ token, details, onBack }: Props) {
  const [savedLocation, setSavedLocation] = useState(details.location);
  const [locked, setLocked] = useState<string | null>(null);
  // The location remembered from their earlier delivery, kept from when this
  // step started: once they save a location the API stops sending it, but
  // "Back" must still be able to show the "Same location?" page.
  const [remembered] = useState(details.previousLocation);

  // Where they start: their pin is already saved, or a redelivery with a
  // remembered location ("same location?"), or the map.
  const initial: Step = details.location
    ? "done"
    : details.redelivery !== null && remembered !== null
      ? "review"
      : "editor";
  // The pages they've been through, and where they are in that list. Going
  // back keeps the later pages so Forward can return to them.
  const [nav, setNav] = useState<{ stack: Step[]; pos: number }>({
    stack: [initial],
    pos: 0,
  });
  const step = nav.stack[nav.pos];
  const canForward = nav.pos < nav.stack.length - 1;

  function go(next: Step) {
    setNav((n) => ({ stack: [...n.stack.slice(0, n.pos + 1), next], pos: n.pos + 1 }));
  }
  function back() {
    if (nav.pos === 0) onBack();
    else setNav((n) => ({ ...n, pos: n.pos - 1 }));
  }
  function forward() {
    setNav((n) => (n.pos < n.stack.length - 1 ? { ...n, pos: n.pos + 1 } : n));
  }

  if (locked) {
    return (
      <ResultScreen
        icon={<RiderIcon size={24} />}
        tone="brand"
        eyebrow={`Hi ${details.customerFirstName}`}
        title="Your rider is already on the way"
        sub={locked}
      />
    );
  }

  // The map stays mounted once they've reached it, just hidden while they're
  // on another page, so the pin, address and note they entered aren't lost
  // by going back.
  const editorReached = nav.stack.includes("editor");

  return (
    <>
      {step === "review" && remembered && (
        <ReviewSavedLocation
          token={token}
          details={details}
          prev={remembered}
          onKeep={(stored) => {
            setSavedLocation(stored);
            go("done");
          }}
          onChange={() => go("editor")}
          onLocked={setLocked}
          onBack={back}
          onForward={canForward ? forward : undefined}
        />
      )}

      {step === "done" && savedLocation && (
        <ResultScreen
          icon={<CheckIcon />}
          tone="brand"
          eyebrow={`All set, ${details.customerFirstName}`}
          title="Your rider will find you"
          sub="We'll send the rider with your pin and landmark note. You can still change them until the rider leaves."
        >
          <div className="summary">
            <div className="summary-row">
              <span className="summary-label">Order</span>
              <span className="summary-val">{asSentenceStart(details.itemDescription)}</span>
            </div>
            {savedLocation.address && (
              <div className="summary-row">
                <span className="summary-label">Address</span>
                <span className="summary-val">{savedLocation.address}</span>
              </div>
            )}
            <div className="summary-row">
              <span className="summary-label">Landmark</span>
              <span className="summary-val">{savedLocation.landmarkNote}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Status</span>
              <span className="badge badge-success">Ready</span>
            </div>
          </div>
          <button onClick={() => go("editor")} className="btn btn-secondary btn-block">
            Change my pin
          </button>
          <button type="button" onClick={back} className="undo-link" style={{ marginTop: 14 }}>
            Changed your mind? Go back
          </button>
        </ResultScreen>
      )}

      {editorReached && (
        <div hidden={step !== "editor"}>
          <PinEditor
            token={token}
            details={details}
            current={savedLocation}
            onSaved={(stored) => {
              setSavedLocation(stored);
              go("done");
            }}
            onCancel={
              savedLocation ? () => (canForward ? forward() : go("done")) : undefined
            }
            onLocked={setLocked}
            onBack={back}
            onForward={canForward ? forward : undefined}
          />
        </div>
      )}
    </>
  );
}

// Design: "Customer: Same Location? (Redelivery)". After a failed delivery the
// customer confirms their remembered location is still right (one tap) or
// changes it. When the rider couldn't find the address, "update" leads.
function ReviewSavedLocation({
  token,
  details,
  prev,
  onKeep,
  onChange,
  onLocked,
  onBack,
  onForward,
}: {
  token: string;
  details: ConfirmationDetails;
  prev: LocationInput;
  onKeep: (stored: LocationInput) => void;
  onChange: () => void;
  onLocked: (message: string) => void;
  onBack: () => void;
  onForward?: () => void;
}) {
  const addressNotFound = details.redelivery?.failureReason === "address_not_found";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function keep() {
    setSaving(true);
    setError(null);
    try {
      onKeep(await submitLocation(token, prev));
    } catch (err) {
      if (err instanceof LocationLockedError) onLocked(err.message);
      else if (err instanceof NotFoundError)
        setError("This link isn't valid any more. Please contact the business.");
      else setError("That didn't save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const same = (
    <button
      key="same"
      type="button"
      onClick={keep}
      disabled={saving}
      className={`btn ${addressNotFound ? "btn-secondary" : "btn-primary mb-3"} btn-block`}
    >
      {saving ? "Saving…" : "Yes, same location"}
    </button>
  );
  const change = (
    <button
      key="change"
      type="button"
      onClick={onChange}
      disabled={saving}
      className={`btn ${addressNotFound ? "btn-primary mb-3" : "btn-secondary"} btn-block`}
    >
      Update my location
    </button>
  );

  return (
    <PhoneScreen>
      <StepNav onBack={onBack} onForward={onForward} />
      <p className="eyebrow">Step 2 of 2</p>
      <h1 className="h1">Same location as last time?</h1>
      <p className="sub" style={{ marginBottom: 16 }}>
        {addressNotFound
          ? "The rider couldn't find you here last time. Check it's right, or update it before they set off."
          : "Check your location is still right before the rider sets off."}
      </p>
      <div className="map" style={{ height: 200, marginBottom: 20 }}>
        <PinMap pin={{ lat: prev.lat, lng: prev.lng }} recenterKey={0} readOnly />
        <span className="map-chip saved">Your saved pin</span>
        <a
          className="map-attrib"
          style={{ right: 16 }}
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
        >
          &copy; OpenStreetMap
        </a>
      </div>
      <div className="summary">
        {prev.address && (
          <div className="summary-row">
            <span className="summary-label">Address</span>
            <span className="summary-val">{prev.address}</span>
          </div>
        )}
        <div className="summary-row">
          <span className="summary-label">Landmark</span>
          <span className="summary-val">{prev.landmarkNote}</span>
        </div>
      </div>
      {addressNotFound ? [change, same] : [same, change]}
      {error && (
        <p className="mt-3 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
    </PhoneScreen>
  );
}

function PinEditor({
  token,
  details,
  current,
  onSaved,
  onCancel,
  onLocked,
  onBack,
  onForward,
}: {
  token: string;
  details: ConfirmationDetails;
  // This order's saved pin, when the customer is changing it.
  current: LocationInput | null;
  onSaved: (stored: LocationInput) => void;
  onCancel?: () => void;
  onLocked: (message: string) => void;
  onBack: () => void;
  onForward?: () => void;
}) {
  // The returning-customer design applies when the pin comes from an earlier
  // order; changing this order's own pin reuses it with different copy.
  const start = current ?? details.previousLocation;
  const returning = current === null && details.previousLocation !== null;

  const [pin, setPin] = useState<LatLng>(
    start ? { lat: start.lat, lng: start.lng } : FALLBACK_CENTER,
  );
  const [recenterKey, setRecenterKey] = useState(0);
  const [source, setSource] = useState<PinSource>(start ? "saved" : null);
  const [showTip, setShowTip] = useState(start === null);
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
  const [results, setResults] = useState<Place[] | null>(null);
  // Only the newest search may fill the list, so a slow earlier one can't
  // overwrite it.
  const searchAbort = useRef<AbortController | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [note, setNote] = useState(start?.landmarkNote ?? "");
  // Filled from the search result they pick; editable, since a search result
  // rarely has the exact house number ("5, Temidire Street").
  const [address, setAddress] = useState(start?.address ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function moveTo(next: LatLng) {
    setPin(next);
    setRecenterKey((k) => k + 1);
  }

  // The customer placed the pin themselves (drag or tap).
  function pinMoved(next: LatLng) {
    setPin(next);
    setSource(null);
    setShowTip(false);
  }

  // State only changes in the callbacks, so this is safe to call from an effect.
  function requestPosition() {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        moveTo({ lat: coords.latitude, lng: coords.longitude });
        setSource("current");
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

  async function runSearch(q: string, full: boolean) {
    searchAbort.current?.abort();
    const ctrl = new AbortController();
    searchAbort.current = ctrl;
    setSearching(true);
    // Favour places near the pin (the customer's spot, or Lagos).
    const found = await (full ? searchPlaces : suggestPlaces)(q, pin, ctrl.signal);
    if (ctrl.signal.aborted) return;
    setResults(found);
    setSearching(false);
  }

  // Suggestions while typing (Photon, after a pause). Nominatim's usage
  // policy forbids search-as-you-type, so it only joins in on submit.
  function onQueryChange(value: string) {
    setQuery(value);
    if (debounce.current) clearTimeout(debounce.current);
    const q = value.trim();
    if (q.length < 3) {
      searchAbort.current?.abort();
      setSearching(false);
      setResults(null);
      return;
    }
    debounce.current = setTimeout(() => runSearch(q, false), 400);
  }

  function search(e: FormEvent) {
    e.preventDefault();
    if (debounce.current) clearTimeout(debounce.current);
    const q = query.trim();
    if (q) runSearch(q, true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      onSaved(await submitLocation(token, { ...pin, landmarkNote: note.trim(), address: address.trim() || null }));
    } catch (err) {
      if (err instanceof LocationLockedError) onLocked(err.message);
      else if (err instanceof NotFoundError)
        setSaveError("This link isn't valid any more. Please contact the business.");
      else setSaveError("That didn't save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const title = returning
    ? "Same spot as last time?"
    : current
      ? "Move your pin"
      : "Drop your pin";

  let hint: string | null = null;
  if (!returning) {
    if (locating) hint = "Finding your location…";
    else if (locateFailed)
      hint = "We couldn't get your location. Search your estate or street instead.";
    else if (!current)
      hint = "Allow location access and the map jumps to you. You can still search or drag if it isn't quite right.";
  }

  return (
    <PhoneScreen>
      <StepNav onBack={onBack} onForward={onForward} />
      <p className="eyebrow">Step 2 of 2</p>
      <h1 className="h1">{title}</h1>

      {returning ? (
        <div className="saved-banner">
          <HistoryIcon />
          <span>
            Welcome back, {details.customerFirstName}. We loaded the pin and
            note from your last order
            {details.vendor ? ` with ${details.vendor.name}` : ""}. Drag
            the pin if you&apos;re somewhere else today.
          </span>
        </div>
      ) : (
        <p className="sub" style={{ marginBottom: 20 }}>
          {current
            ? "Drag the pin or search if you've moved. The rider will use the new spot."
            : locateFailed
              ? "Search your estate or street, then drag the pin to your exact spot."
              : "We've centered the map near you. Search your estate or street if it's off, then drag the pin to your exact spot."}
        </p>
      )}

      <div className="map" style={returning ? { height: 260, marginBottom: 20 } : hint ? undefined : { marginBottom: 20 }}>
        <PinMap
          pin={pin}
          recenterKey={recenterKey}
          onPinChange={pinMoved}
          showTip={showTip && !returning}
        />

        <form onSubmit={search} className="map-search" role="search">
          <button
            type="submit"
            disabled={searching}
            aria-label="Search"
            className={searching ? "animate-pulse" : undefined}
          >
            <SearchIcon />
          </button>
          <input
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            aria-label="Search your estate or street"
            placeholder="Search your estate or street"
          />
        </form>

        {results && (
          <div className="map-results">
            {results.length === 0 && (
              <p>No matches. Try a nearby street or landmark.</p>
            )}
            {results.map((r) => (
              <button
                key={`${r.lat},${r.lng}`}
                type="button"
                onClick={() => {
                  moveTo({ lat: r.lat, lng: r.lng });
                  setAddress(r.label);
                  setSource(null);
                  setShowTip(false);
                  setResults(null);
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        {source === "current" && (
          <span className="map-chip">Near your current location</span>
        )}
        {source === "saved" && (
          <span className="map-chip saved">Your saved pin</span>
        )}
        <a
          className="map-attrib"
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
        >
          &copy; OpenStreetMap
        </a>
        <button
          type="button"
          className="map-locate"
          onClick={locate}
          disabled={locating}
          aria-label="Center on my location"
        >
          <LocateIcon />
        </button>
      </div>
      {hint && (
        <p className="map-hint" role="status">
          {hint}
        </p>
      )}

      <form onSubmit={save}>
        <label className="field-label" htmlFor="address">
          <PinIcon />
          Your address
        </label>
        <input
          id="address"
          className="field"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          maxLength={ADDRESS_MAX_LENGTH}
          autoComplete="street-address"
          placeholder="e.g. 5, Temidire Street, Mafoluku, Oshodi, Lagos"
        />
        <p className="note-caption" style={{ marginTop: -8, marginBottom: 16 }}>
          Add your house number. The rider reads this alongside the pin.
        </p>
        <label className="field-label" htmlFor="landmark">
          <NoteIcon />
          Landmark note
        </label>
        <textarea
          id="landmark"
          className="field"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={NOTE_MAX_LENGTH}
          required
          placeholder="e.g. Blue gate, opposite the pharmacy"
        />
        {returning && (
          <p className="note-caption">
            From your last order. Edit it if anything has changed.
          </p>
        )}
        <button
          type="submit"
          disabled={saving || note.trim() === ""}
          className="btn btn-primary btn-block"
        >
          {saving ? "Saving…" : "Confirm Location"}
        </button>
        {saveError && (
          <p className="mt-3 text-sm font-semibold text-danger" role="alert">
            {saveError}
          </p>
        )}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary btn-block mt-3"
          >
            Keep my saved pin
          </button>
        )}
      </form>
    </PhoneScreen>
  );
}
