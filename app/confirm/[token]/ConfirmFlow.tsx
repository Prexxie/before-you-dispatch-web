"use client";

import { useEffect, useState } from "react";
import {
  ConfirmationDetails,
  NotFoundError,
  OrderStatus,
  getConfirmation,
  submitConfirmation,
} from "@/lib/api";
import LocationStep from "./LocationStep";

type View =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "error" }
  | { kind: "ask"; details: ConfirmationDetails }
  | { kind: "answered"; details: ConfirmationDetails; status: OrderStatus };

const STATUS_MESSAGES: Record<Exclude<OrderStatus, "pending_confirmation">, string> = {
  confirmed: "You're confirmed for today's delivery.",
  not_ready: "Thanks, we'll let the vendor know.",
  dispatched: "Your delivery is on its way.",
  delivered: "This delivery has been completed.",
  failed: "This delivery couldn't be completed. Please contact the vendor.",
};

async function fetchView(token: string): Promise<View> {
  try {
    const details = await getConfirmation(token);
    return details.awaitingResponse
      ? { kind: "ask", details }
      : { kind: "answered", details, status: details.status };
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
        next.kind === "answered" ? next : { kind: "answered", details, status },
      );
    } catch (err) {
      if (err instanceof NotFoundError) setView({ kind: "invalid" });
      else setSubmitError(true);
    } finally {
      setSubmitting(null);
    }
  }

  switch (view.kind) {
    case "loading":
      return <p className="text-zinc-500">Loading your delivery…</p>;

    case "invalid":
      return (
        <div>
          <h1 className="text-xl font-semibold">This link isn&apos;t valid</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Please check the link you were sent, or contact the vendor.
          </p>
        </div>
      );

    case "error":
      return (
        <div>
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            We couldn&apos;t load your delivery. Check your connection and try
            again.
          </p>
          <button
            onClick={retry}
            className="mt-6 w-full rounded-lg border border-zinc-300 py-3 font-medium dark:border-zinc-700"
          >
            Try again
          </button>
        </div>
      );

    case "ask":
      return (
        <div>
          <ItemSummary details={view.details} />
          <h1 className="mt-6 text-xl font-semibold">
            You have a delivery today. Are you ready to receive it?
          </h1>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => answer(view.details, true)}
              disabled={submitting !== null}
              className="w-full rounded-lg bg-green-600 py-3 font-medium text-white disabled:opacity-60"
            >
              {submitting === true ? "Sending…" : "Yes, I'm ready"}
            </button>
            <button
              onClick={() => answer(view.details, false)}
              disabled={submitting !== null}
              className="w-full rounded-lg border border-zinc-300 py-3 font-medium disabled:opacity-60 dark:border-zinc-700"
            >
              {submitting === false ? "Sending…" : "Not now"}
            </button>
          </div>
          {submitError && (
            <p className="mt-4 text-sm text-red-600">
              That didn&apos;t go through. Check your connection and try again.
            </p>
          )}
        </div>
      );

    case "answered":
      return (
        <div>
          <ItemSummary details={view.details} />
          <p className="mt-6 text-lg font-medium">
            {STATUS_MESSAGES[view.status as keyof typeof STATUS_MESSAGES]}
          </p>
          {view.status === "confirmed" && (
            <LocationStep
              token={token}
              saved={view.details.location}
              previous={view.details.previousLocation}
            />
          )}
        </div>
      );
  }
}

function ItemSummary({ details }: { details: ConfirmationDetails }) {
  return (
    <div className="rounded-lg bg-zinc-100 px-4 py-3 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500">Your delivery</p>
      <p className="font-medium">{details.itemDescription}</p>
    </div>
  );
}
