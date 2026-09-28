"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  ConfirmationDetails,
  NotFoundError,
  OrderStatus,
  getConfirmation,
  submitConfirmation,
} from "@/lib/api";
import {
  AlertIcon,
  CheckIcon,
  LogoMark,
  MinusCircleIcon,
  RiderIcon,
} from "@/components/icons";
import CustomerScreen, {
  ResultScreen,
  Tone,
  asSentenceStart,
} from "./CustomerScreen";
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

  if (view.kind === "loading") {
    return (
      <CustomerScreen centered>
        <LogoMark size={20} className="mb-7 block" />
        <p className="sub" role="status">
          Loading your delivery…
        </p>
      </CustomerScreen>
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
  const from = details.vendorName ? ` from ${details.vendorName}` : "";

  // Design: "Customer: Confirm Ready"
  if (details.status === "pending_confirmation") {
    return (
      <CustomerScreen centered>
        <LogoMark size={20} className="mb-7 block" />
        <p className="eyebrow">Hi {details.customerFirstName}</p>
        <h1 className="h1">You have a delivery today</h1>
        <p className="sub">
          {asSentenceStart(details.itemDescription)}
          {from}. Are you ready to receive it? We&apos;ll only send the rider
          once you confirm.
        </p>
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
      </CustomerScreen>
    );
  }

  // Design: "Customer: Pin + Landmark" / "Customer: Saved Pin (Returning)"
  if (details.status === "confirmed") {
    return <LocationStep token={token} details={details} />;
  }

  return <StatusScreen details={details} />;
}

// Everything after the customer's answer, except the map step.
function StatusScreen({ details }: { details: ConfirmationDetails }) {
  const first = details.customerFirstName;
  const vendor = details.vendorName ?? "the business";
  const screens: Record<
    Exclude<OrderStatus, "pending_confirmation" | "confirmed">,
    {
      icon: ReactNode;
      tone: Tone;
      eyebrow: string;
      title: string;
      sub: string;
      badge: [string, string];
    }
  > = {
    // Design: "Customer: Not Now". The "Actually, I'm ready" undo is left out
    // until the undo decision is made (the API doesn't allow it yet).
    not_ready: {
      icon: <MinusCircleIcon />,
      tone: "neutral",
      eyebrow: `Got it, ${first}`,
      title: "We won't send the rider today",
      sub: `We've let ${vendor} know you're not ready. They'll contact you directly about your order.`,
      badge: ["badge-neutral", "Not sent today"],
    },
    dispatched: {
      icon: <RiderIcon size={24} />,
      tone: "brand",
      eyebrow: `Hi ${first}`,
      title: "Your delivery is on its way",
      sub: "The rider has your pin and landmark note, so they can find you without calling.",
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
  const s = screens[details.status as keyof typeof screens];

  return (
    <ResultScreen icon={s.icon} tone={s.tone} eyebrow={s.eyebrow} title={s.title} sub={s.sub}>
      <div className="summary">
        <div className="summary-row">
          <span className="summary-label">Order</span>
          <span className="summary-val">{asSentenceStart(details.itemDescription)}</span>
        </div>
        {details.vendorName && (
          <div className="summary-row">
            <span className="summary-label">From</span>
            <span className="summary-val">{details.vendorName}</span>
          </div>
        )}
        {details.location && details.status !== "not_ready" && (
          <div className="summary-row">
            <span className="summary-label">Landmark</span>
            <span className="summary-val">{details.location.landmarkNote}</span>
          </div>
        )}
        <div className="summary-row">
          <span className="summary-label">Status</span>
          <span className={`badge ${s.badge[0]}`}>{s.badge[1]}</span>
        </div>
      </div>
    </ResultScreen>
  );
}
