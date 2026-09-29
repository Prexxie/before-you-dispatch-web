"use client";

import LogoLoader from "@/components/LogoLoader";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  ConfirmationDetails,
  ConflictError,
  FailureReason,
  NotFoundError,
  OrderStatus,
  confirmReceived,
  getConfirmation,
  submitConfirmation,
} from "@/lib/api";
import { displayPhone, firstName, telLink } from "@/lib/links";
import {
  AlertIcon,
  CheckIcon,
  LogoMark,
  MinusCircleIcon,
  PackageIcon,
  PinIcon,
  RiderIcon,
} from "@/components/icons";
import PhoneScreen, {
  ResultScreen,
  Tone,
  asSentenceStart,
} from "@/components/PhoneScreen";
import VendorStrip, { VendorContact } from "@/components/VendorStrip";
import StepNav from "@/components/StepNav";
import LocationStep from "./LocationStep";

// One gentle sentence on why the last attempt failed, for a redelivery.
function lastTimeReason(reason: FailureReason | null): string {
  switch (reason) {
    case "address_not_found":
      return " Last time the rider couldn't find your address.";
    case "customer_not_ready":
      return " Last time you weren't ready when the rider arrived.";
    case "customer_unreachable":
      return " Last time the rider couldn't reach you.";
    default:
      return "";
  }
}

type View =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "error" }
  | { kind: "ready"; details: ConfirmationDetails };

// How often the customer's page checks for changes while a delivery is in
// progress (the vendor's dashboard and the rider's page use 15 s; the customer
// is watching a phone screen waiting for "on its way" and "arrived", so this
// is quicker). It also refreshes the moment they come back to the tab.
const CUSTOMER_REFRESH_MS = 5_000;

async function fetchView(token: string): Promise<View> {
  try {
    return { kind: "ready", details: await getConfirmation(token) };
  } catch (err) {
    return { kind: err instanceof NotFoundError ? "invalid" : "error" };
  }
}

export default function ConfirmFlow({ token }: { token: string }) {
  const [view, setView] = useState<View>({ kind: "loading" });
  const [submitting, setSubmitting] = useState<boolean | null>(null);
  const [submitError, setSubmitError] = useState(false);
  // The customer tapped "Not now" and is looking at the warning.
  const [declining, setDeclining] = useState(false);
  // On the map step they tapped "Back" to change their mind about step one.
  const [backToStepOne, setBackToStepOne] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [receiveError, setReceiveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchView(token).then((next) => {
      if (!cancelled) setView(next);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  function retry() {
    setView({ kind: "loading" });
    fetchView(token).then(setView);
  }

  async function answer(details: ConfirmationDetails, ready: boolean) {
    setSubmitting(ready);
    setSubmitError(false);
    try {
      const status = await submitConfirmation(token, ready);
      // Reload so a confirmed customer gets their saved pin from an earlier
      // order, which the API only offers once they've confirmed.
      const next = await fetchView(token);
      setView(
        next.kind === "ready"
          ? next
          : {
              kind: "ready",
              details: { ...details, status, awaitingResponse: false },
            },
      );
    } catch (err) {
      if (err instanceof NotFoundError) setView({ kind: "invalid" });
      else setSubmitError(true);
    } finally {
      setSubmitting(null);
    }
  }

  // "I've received my delivery" (CLAUDE.md flow step 6).
  async function received() {
    setReceiving(true);
    setReceiveError(null);
    try {
      await confirmReceived(token);
      const next = await fetchView(token);
      if (next.kind === "ready") setView(next);
    } catch (err) {
      if (err instanceof NotFoundError) setView({ kind: "invalid" });
      else if (err instanceof ConflictError) setReceiveError(err.message);
      else
        setReceiveError(
          "That didn't go through. Check your connection and try again.",
        );
    } finally {
      setReceiving(false);
    }
  }

  // Keep the page current once the customer has confirmed: the vendor sending
  // the rider, pickup, arrival and completion all happen on other screens.
  const pollStatus = view.kind === "ready" ? view.details.status : null;
  const busyRef = useRef(false);
  useEffect(() => {
    busyRef.current = submitting !== null || receiving;
  });
  useEffect(() => {
    if (pollStatus !== "confirmed" && pollStatus !== "dispatched") return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function refresh() {
      clearTimeout(timer);
      // Skip while the customer's own tap is in flight, and drop a reply that
      // arrives after one started, so an older answer can't undo it.
      if (document.visibilityState === "visible" && !busyRef.current) {
        const next = await fetchView(token);
        if (stopped) return;
        if (next.kind === "ready" && !busyRef.current) {
          setView((prev) =>
            prev.kind === "ready" &&
            JSON.stringify(prev.details) === JSON.stringify(next.details)
              ? prev
              : next,
          );
        }
      }
      timer = setTimeout(refresh, CUSTOMER_REFRESH_MS);
    }
    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }

    timer = setTimeout(refresh, CUSTOMER_REFRESH_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [pollStatus, token]);

  if (view.kind === "loading") {
    return (
      <PhoneScreen centered>
        <LogoLoader label="Loading your delivery…" />
      </PhoneScreen>
    );
  }

  if (view.kind === "invalid") {
    return (
      <ResultScreen
        icon={<AlertIcon />}
        tone="neutral"
        eyebrow="Link not recognised"
        title="This link isn't valid"
        sub="Check the link you were sent, or contact the business that sent it."
      />
    );
  }

  if (view.kind === "error") {
    return (
      <ResultScreen
        icon={<AlertIcon />}
        tone="neutral"
        eyebrow="Connection problem"
        title="We couldn't load your delivery"
        sub="Check your internet connection and try again."
      >
        <button onClick={retry} className="btn btn-secondary btn-block">
          Try again
        </button>
      </ResultScreen>
    );
  }

  const { details } = view;
  const from = details.vendor ? ` from ${details.vendor.name}` : "";

  // Design: "Customer: Confirm Ready" (also where "Back" from the map step
  // lands, with a Forward arrow to return to it).
  const choiceScreen = (
    <PhoneScreen centered>
      {details.status === "confirmed" && (
        <StepNav onForward={() => setBackToStepOne(false)} />
      )}
      <LogoMark size={20} className="mb-7 block" />
      <p className="eyebrow">Hi {details.customerFirstName}</p>
      {details.redelivery ? (
        // Design: "Customer: Redelivery Confirm"
        <>
          <h1 className="h1">Let&apos;s try your delivery again</h1>
          <p className="sub">
            We couldn&apos;t complete your earlier delivery of{" "}
            {details.itemDescription.trim().replace(/\.+$/, "")}
            {from}.{lastTimeReason(details.redelivery.failureReason)} Are you
            ready to receive it today? We&apos;ll only send the rider once you
            confirm.
          </p>
        </>
      ) : (
        <>
          <h1 className="h1">You have a delivery today</h1>
          <p className="sub">
            {asSentenceStart(details.itemDescription)}
            {from}. Are you ready to receive it? We&apos;ll only send the rider
            once you confirm.
          </p>
        </>
      )}
      <VendorStrip vendor={details.vendor} />
      <button
        onClick={() =>
          details.status === "confirmed"
            ? setBackToStepOne(false)
            : answer(details, true)
        }
        disabled={submitting !== null}
        className="btn btn-primary btn-block mb-3"
      >
        {submitting === true ? "Sending…" : "Yes, I'm ready"}
      </button>
      <button
        onClick={() => setDeclining(true)}
        disabled={submitting !== null}
        className="btn btn-secondary btn-block"
      >
        Not now
      </button>
      {submitError && !declining && (
        <p className="mt-4 text-sm font-semibold text-danger" role="alert">
          That didn&apos;t go through. Check your connection and try again.
        </p>
      )}
      {declining && (
        <DeclineDialog
          vendorName={details.vendor?.name ?? "the business"}
          busy={submitting === false}
          error={submitError}
          onDecline={() => answer(details, false)}
          onClose={() => setDeclining(false)}
        />
      )}
    </PhoneScreen>
  );

  if (details.status === "pending_confirmation") return choiceScreen;

  // Design: "Customer: Pin + Landmark" / "Customer: Saved Pin (Returning)".
  // The steps stay mounted while step one shows (just hidden), so going back
  // and forward keeps what they'd entered.
  if (details.status === "confirmed") {
    return (
      <>
        {backToStepOne && choiceScreen}
        <div hidden={backToStepOne}>
          <LocationStep
            token={token}
            details={details}
            onBack={() => setBackToStepOne(true)}
          />
        </div>
      </>
    );
  }

  return (
    <StatusScreen
      details={details}
      onReceived={received}
      receiving={receiving}
      receiveError={receiveError}
    />
  );
}

// Design: "Customer: Decline Warning". "Not now" is final, so it asks first,
// in a dialog over the confirm screen. Escape or a tap outside goes back;
// only "No, Exit" declines.
function DeclineDialog({
  vendorName,
  busy,
  error,
  onDecline,
  onClose,
}: {
  vendorName: string;
  busy: boolean;
  error: boolean;
  onDecline: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,25,23,0.55)] p-6"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="decline-title"
        aria-describedby="decline-text"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] rounded-[16px] bg-white p-6 pt-7 shadow-[0_20px_48px_-12px_rgba(28,25,23,0.45)]"
      >
        <div className="mb-[18px] flex h-12 w-12 items-center justify-center rounded-full bg-[#FFFBEB] text-[#D97706]">
          <AlertIcon size={22} />
        </div>
        <p
          id="decline-title"
          className="mb-2 text-xl font-semibold leading-tight text-ink"
        >
          Decline this delivery?
        </p>
        <p
          id="decline-text"
          className="mb-[22px] text-sm leading-[1.55] text-ink-soft"
        >
          This closes your link for good and no rider will be sent. You
          can&apos;t undo it from your phone. If you change your mind,{" "}
          {vendorName} will have to send you a new link.
        </p>
        <button
          autoFocus
          onClick={onClose}
          disabled={busy}
          className="btn btn-primary btn-block mb-2.5"
        >
          Go back
        </button>
        <button
          onClick={onDecline}
          disabled={busy}
          className="btn btn-danger-outline btn-block"
        >
          {busy ? "Sending…" : "No, Exit"}
        </button>
        {error && (
          <p className="mt-3 text-sm font-semibold text-danger" role="alert">
            That didn&apos;t go through. Check your connection and try again.
          </p>
        )}
      </div>
    </div>
  );
}

type Screen = {
  icon: ReactNode;
  tone: Tone;
  eyebrow: string;
  title: string;
  sub: string;
  badge: [string, string];
};

// Where the delivery is, once the vendor has sent the rider (design: the
// progress list on "Customer: Rider Collecting Order" and the screens after).
function DeliverySteps({
  rider,
  pickedUp,
  arrived,
  received,
}: {
  rider: string;
  pickedUp: boolean;
  arrived: boolean;
  received: boolean;
}) {
  type StepState = "done" | "current" | "todo";
  const steps: { label: string; state: StepState }[] = [
    { label: "Rider sent", state: "done" },
    {
      label: `${rider} picks up your order`,
      state: pickedUp || arrived || received ? "done" : "current",
    },
    {
      label: `${rider} arrives at your location`,
      state: arrived || received ? "done" : pickedUp ? "current" : "todo",
    },
    {
      label: "You confirm you've received it",
      state: received ? "done" : arrived ? "current" : "todo",
    },
  ];
  return (
    <ul className="steps" style={{ marginBottom: 22 }}>
      {steps.map((s) => (
        <li key={s.label} className={`step ${s.state}`}>
          <span className="step-dot" aria-hidden="true">
            {s.state === "done" && <CheckIcon size={12} />}
            {s.state === "current" && (
              <svg width="12" height="12" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" fill="currentColor" />
              </svg>
            )}
          </span>
          {s.label}
        </li>
      ))}
    </ul>
  );
}

// Everything after the customer's answer, except the map step.
function StatusScreen({
  details,
  onReceived,
  receiving,
  receiveError,
}: {
  details: ConfirmationDetails;
  // "I've received my delivery" on the On Its Way screen.
  onReceived: () => void;
  receiving: boolean;
  receiveError: string | null;
}) {
  const first = details.customerFirstName;
  const vendor = details.vendor?.name ?? "the business";
  const rider = details.rider ? firstName(details.rider.name) : "The rider";
  const received =
    details.status === "dispatched" && details.receivedAt !== null;
  const arrived =
    details.status === "dispatched" && details.arrivedAt !== null && !received;
  const pickedUp =
    details.status === "dispatched" && details.pickedUpAt !== null;
  // Sent by the vendor but the rider hasn't collected the order yet.
  const collecting = details.status === "dispatched" && !pickedUp && !received;

  const screens: Record<
    Exclude<OrderStatus, "pending_confirmation" | "confirmed">,
    Screen
  > = {
    // Design: "Customer: Declined (Link Closed)". The customer chose "Not now"
    // and confirmed the warning, so the link is closed; the business can send
    // a new one.
    not_ready: {
      icon: <MinusCircleIcon />,
      tone: "neutral",
      eyebrow: `Got it, ${first}`,
      title: "Delivery declined",
      sub: `We've let ${vendor} know. This link is now closed and no rider will be sent. If you change your mind, contact them and they can send you a new link.`,
      badge: ["badge-neutral", "Declined"],
    },
    // Design: "Customer: On Its Way (Picked Up)"
    dispatched: {
      icon: <RiderIcon size={24} />,
      tone: "brand",
      eyebrow: `Hi ${first}`,
      title: "Your order is on its way",
      sub: `${rider} has picked up your order from ${vendor} and is heading to you. They have your pin, address and landmark note, so they can find you without calling.`,
      badge: ["badge-filled", "On its way"],
    },
    delivered: {
      icon: <CheckIcon />,
      tone: "brand",
      eyebrow: `Thanks, ${first}`,
      title: "Your delivery has arrived",
      sub: "This delivery is complete.",
      badge: ["badge-success", "Delivered"],
    },
    failed: {
      icon: <AlertIcon />,
      tone: "danger",
      eyebrow: `Hi ${first}`,
      title: "This delivery couldn't be completed",
      sub: `Please contact ${vendor} to arrange another delivery.`,
      badge: ["badge-danger", "Not delivered"],
    },
  };
  // Design: "Customer: Delivery Received"
  const s: Screen = received
    ? {
        icon: <CheckIcon />,
        tone: "brand",
        eyebrow: `Thanks, ${first}`,
        title: "Delivery received",
        sub: `We've let ${vendor} know. ${rider} will now mark the delivery completed.`,
        badge: ["badge-success", "Received"],
      }
    : // Design: "Customer: Rider Arrived"
      arrived
      ? {
          icon: <PinIcon />,
          tone: "accent",
          eyebrow: `Hi ${first}`,
          title: "Your rider has arrived",
          sub: `${rider} is at your location with your delivery.`,
          badge: ["badge-accent", "Arrived"],
        }
      : // Design: "Customer: Rider Collecting Order"
        collecting
        ? {
            icon: <PackageIcon size={24} />,
            tone: "brand",
            eyebrow: `Hi ${first}`,
            title: `${rider} is collecting your order`,
            sub: `${rider} is on the way to ${vendor} to pick up your order. This page updates as soon as they have it.`,
            badge: ["badge-outline", "Rider sent"],
          }
        : screens[details.status as keyof typeof screens];

  return (
    <ResultScreen
      icon={s.icon}
      tone={s.tone}
      eyebrow={s.eyebrow}
      title={s.title}
      sub={s.sub}
    >
      {details.status === "dispatched" && (
        <DeliverySteps
          rider={rider}
          pickedUp={pickedUp}
          arrived={details.arrivedAt !== null}
          received={received}
        />
      )}
      <div className="summary">
        <div className="summary-row">
          <span className="summary-label">Order</span>
          <span className="summary-val">
            {asSentenceStart(details.itemDescription)}
          </span>
        </div>
        {details.vendor && (
          <div className="summary-row">
            <span className="summary-label">From</span>
            <span className="summary-val">
              {details.vendor.name}
              <small>
                <VendorContact vendor={details.vendor} />
              </small>
            </span>
          </div>
        )}
        {details.status === "dispatched" && !received && details.rider && (
          <div className="summary-row">
            <span className="summary-label">Rider</span>
            <span className="summary-val">
              {firstName(details.rider.name)}
              <small>
                <a href={telLink(details.rider.phone)}>
                  {displayPhone(details.rider.phone)}
                </a>
              </small>
            </span>
          </div>
        )}
        <div className="summary-row">
          <span className="summary-label">Status</span>
          <span className={`badge ${s.badge[0]}`}>{s.badge[1]}</span>
        </div>
      </div>

      {/* Receipt can only be confirmed once the rider has tapped "I've
          arrived" (design: "Customer: Rider Arrived"). */}
      {!received && (collecting || (pickedUp && !arrived)) && (
        <p className="caption">
          You&apos;ll be able to confirm receipt once your rider arrives.
        </p>
      )}

      {arrived && (
        <>
          <button
            onClick={onReceived}
            disabled={receiving}
            className="btn btn-primary btn-block"
          >
            {receiving ? "Sending…" : "I've Received My Delivery"}
          </button>
          <p className="caption">Tap this once the items are in your hands.</p>
          {receiveError && (
            <p className="mt-4 text-sm font-semibold text-danger" role="alert">
              {receiveError}
            </p>
          )}
        </>
      )}

      {details.status === "not_ready" && (
        <p className="caption">This link is no longer active.</p>
      )}
    </ResultScreen>
  );
}
