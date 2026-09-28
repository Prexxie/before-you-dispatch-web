"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  ConfirmationDetails,
  ConflictError,
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
  PinIcon,
  RiderIcon,
} from "@/components/icons";
import PhoneScreen, {
  ResultScreen,
  Tone,
  asSentenceStart,
} from "@/components/PhoneScreen";
import VendorStrip, { VendorContact } from "@/components/VendorStrip";
import LocationStep from "./LocationStep";

type View =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "error" }
  | { kind: "ready"; details: ConfirmationDetails };

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
          : { kind: "ready", details: { ...details, status, awaitingResponse: false } },
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
      else setReceiveError("That didn't go through. Check your connection and try again.");
    } finally {
      setReceiving(false);
    }
  }

  if (view.kind === "loading") {
    return (
      <PhoneScreen centered>
        <LogoMark size={20} className="mb-7 block" />
        <p className="sub" role="status">
          Loading your delivery…
        </p>
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

  // Design: "Customer: Confirm Ready"
  if (details.status === "pending_confirmation") {
    return (
      <PhoneScreen centered>
        <LogoMark size={20} className="mb-7 block" />
        <p className="eyebrow">Hi {details.customerFirstName}</p>
        <h1 className="h1">You have a delivery today</h1>
        <p className="sub">
          {asSentenceStart(details.itemDescription)}
          {from}. Are you ready to receive it? We&apos;ll only send the rider
          once you confirm.
        </p>
        <VendorStrip vendor={details.vendor} />
        <button
          onClick={() => answer(details, true)}
          disabled={submitting !== null}
          className="btn btn-primary btn-block mb-3"
        >
          {submitting === true ? "Sending…" : "Yes, I'm ready"}
        </button>
        <button
          onClick={() => answer(details, false)}
          disabled={submitting !== null}
          className="btn btn-secondary btn-block"
        >
          {submitting === false ? "Sending…" : "Not now"}
        </button>
        {submitError && (
          <p className="mt-4 text-sm font-semibold text-danger" role="alert">
            That didn&apos;t go through. Check your connection and try again.
          </p>
        )}
      </PhoneScreen>
    );
  }

  // Design: "Customer: Pin + Landmark" / "Customer: Saved Pin (Returning)"
  if (details.status === "confirmed") {
    return <LocationStep token={token} details={details} />;
  }

  return (
    <StatusScreen
      details={details}
      onReady={() => answer(details, true)}
      busy={submitting !== null}
      error={submitError}
      onReceived={received}
      receiving={receiving}
      receiveError={receiveError}
    />
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

// Everything after the customer's answer, except the map step.
function StatusScreen({
  details,
  onReady,
  busy,
  error,
  onReceived,
  receiving,
  receiveError,
}: {
  details: ConfirmationDetails;
  // "Actually, I'm ready" on the Not Now screen (same day only).
  onReady: () => void;
  busy: boolean;
  error: boolean;
  // "I've received my delivery" on the On Its Way screen.
  onReceived: () => void;
  receiving: boolean;
  receiveError: string | null;
}) {
  const first = details.customerFirstName;
  const vendor = details.vendor?.name ?? "the business";
  const rider = details.rider ? firstName(details.rider.name) : "The rider";
  const received = details.status === "dispatched" && details.receivedAt !== null;
  const arrived =
    details.status === "dispatched" && details.arrivedAt !== null && !received;

  const screens: Record<Exclude<OrderStatus, "pending_confirmation" | "confirmed">, Screen> = {
    // Design: "Customer: Not Now"
    not_ready: {
      icon: <MinusCircleIcon />,
      tone: "neutral",
      eyebrow: `Got it, ${first}`,
      title: "We won't send the rider today",
      sub: `We've let ${vendor} know you're not ready. They'll contact you directly about your order.`,
      badge: ["badge-neutral", "Not sent today"],
    },
    // Design: "Customer: On Its Way"
    dispatched: {
      icon: <RiderIcon size={24} />,
      tone: "brand",
      eyebrow: `Hi ${first}`,
      title: "Your delivery is on its way",
      sub: `${rider} has your pin and landmark note, so they can find you without calling.`,
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
      : screens[details.status as keyof typeof screens];

  return (
    <ResultScreen icon={s.icon} tone={s.tone} eyebrow={s.eyebrow} title={s.title} sub={s.sub}>
      <div className="summary">
        <div className="summary-row">
          <span className="summary-label">Order</span>
          <span className="summary-val">{asSentenceStart(details.itemDescription)}</span>
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
                <a href={telLink(details.rider.phone)}>{displayPhone(details.rider.phone)}</a>
              </small>
            </span>
          </div>
        )}
        <div className="summary-row">
          <span className="summary-label">Status</span>
          <span className={`badge ${s.badge[0]}`}>{s.badge[1]}</span>
        </div>
      </div>

      {details.status === "dispatched" && !received && (
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

      {details.status === "not_ready" && details.canChangeToReady && (
        <>
          <p className="mb-2.5 text-center text-[13px] text-ink-soft">
            Tapped this by mistake?
          </p>
          <button
            onClick={onReady}
            disabled={busy}
            className="btn btn-secondary btn-block"
          >
            {busy ? "Sending…" : "Actually, I'm ready"}
          </button>
          {error && (
            <p className="mt-4 text-sm font-semibold text-danger" role="alert">
              That didn&apos;t go through. Check your connection and try again.
            </p>
          )}
        </>
      )}
    </ResultScreen>
  );
}
