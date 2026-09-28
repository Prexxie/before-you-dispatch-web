"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  ConflictError,
  FAILURE_REASON_LABELS,
  FailureReason,
  NotFoundError,
  RiderJob,
  getRiderJob,
  submitOutcome,
} from "@/lib/api";
import { directionsLink } from "@/lib/links";
import PhoneScreen, { ResultScreen, asSentenceStart } from "@/components/PhoneScreen";
import {
  AlertIcon,
  BackIcon,
  CheckIcon,
  CrossIcon,
  DirectionsIcon,
  LogoMark,
  NoteIcon,
  PackageIcon,
} from "@/components/icons";

// Leaflet touches `window` on import, so it can only load in the browser.
const PinMap = dynamic(() => import("@/components/PinMap"), {
  ssr: false,
  loading: () => null,
});

type View =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "error" }
  | { kind: "ready"; job: RiderJob };

async function fetchView(token: string): Promise<View> {
  try {
    return { kind: "ready", job: await getRiderJob(token) };
  } catch (err) {
    return { kind: err instanceof NotFoundError ? "invalid" : "error" };
  }
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function RiderFlow({ token }: { token: string }) {
  const [view, setView] = useState<View>({ kind: "loading" });
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchView(token).then((next) => {
      if (!cancelled) setView(next);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  function reload() {
    setView({ kind: "loading" });
    fetchView(token).then(setView);
  }

  if (view.kind === "loading") {
    return (
      <PhoneScreen centered>
        <LogoMark size={20} className="mb-7 block" />
        <p className="sub" role="status">
          Loading the delivery…
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
        title="This delivery link isn't valid"
        sub="Check the link you were sent, or ask the business that sent it."
      />
    );
  }
  if (view.kind === "error") {
    return (
      <ResultScreen
        icon={<AlertIcon />}
        tone="neutral"
        eyebrow="Connection problem"
        title="We couldn't load this delivery"
        sub="Check your internet connection and try again."
      >
        <button onClick={reload} className="btn btn-secondary btn-block">
          Try again
        </button>
      </ResultScreen>
    );
  }

  const { job } = view;
  if (job.status === "delivered" || job.status === "failed") {
    return <DoneScreen job={job} />;
  }
  if (marking) {
    return (
      <OutcomeScreen
        token={token}
        job={job}
        onBack={() => setMarking(false)}
        onDone={(status, failureReason) =>
          setView({ kind: "ready", job: { ...job, status, failureReason } })
        }
        onStale={reload}
      />
    );
  }
  return <JobScreen job={job} onMark={() => setMarking(true)} />;
}

// Design: "Rider: Assigned Delivery"
function JobScreen({ job, onMark }: { job: RiderJob; onMark: () => void }) {
  const { lat, lng, landmarkNote } = job.location;
  return (
    <PhoneScreen>
      <p className="eyebrow">New Job</p>
      <h1 className="h1">Delivery assigned to you</h1>

      <div className="card" style={{ marginBottom: 18, padding: 24 }}>
        <div className="mb-4 flex items-center gap-2.5">
          <span className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
            {initials(job.customerName)}
          </span>
          <div>
            <div className="text-[14.5px] font-bold text-ink">{job.customerName}</div>
            <a
              href={`tel:${job.customerPhone.replace(/\s/g, "")}`}
              className="text-[12.5px] text-ink-soft"
            >
              {job.customerPhone}
            </a>
          </div>
        </div>
        <p className="field-label">
          <PackageIcon />
          Item
        </p>
        <div className="text-[14.5px] text-ink">{job.itemDescription}</div>
      </div>

      <div
        className="map"
        style={{ height: 180, marginBottom: 18 }}
        role="img"
        aria-label="Map showing the customer's pinned location"
      >
        <PinMap pin={{ lat, lng }} recenterKey={0} readOnly />
        <a
          className="map-attrib"
          style={{ bottom: 8 }}
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
        >
          &copy; OpenStreetMap
        </a>
      </div>

      <p className="field-label">
        <NoteIcon />
        Landmark note
      </p>
      <div className="linkbox" style={{ marginBottom: 18 }}>
        {landmarkNote}
      </div>

      <a
        href={directionsLink(lat, lng)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-secondary btn-block"
      >
        <DirectionsIcon />
        Get Directions
      </a>
      {job.status === "dispatched" && (
        <button onClick={onMark} className="btn btn-primary btn-block mt-3">
          Mark this delivery
        </button>
      )}
    </PhoneScreen>
  );
}

// Design: "Rider: Mark Outcome"
function OutcomeScreen({
  token,
  job,
  onBack,
  onDone,
  onStale,
}: {
  token: string;
  job: RiderJob;
  onBack: () => void;
  onDone: (status: "delivered" | "failed", reason: FailureReason | null) => void;
  onStale: () => void;
}) {
  const [reason, setReason] = useState<FailureReason | "">("");
  const [needReason, setNeedReason] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function mark(outcome: "delivered" | "failed") {
    setError(null);
    if (outcome === "failed" && reason === "") {
      setNeedReason(true);
      return;
    }
    setSending(true);
    try {
      const result = await submitOutcome(
        token,
        outcome === "delivered"
          ? { outcome }
          : { outcome, reason: reason as FailureReason },
      );
      onDone(result.status as "delivered" | "failed", result.failureReason);
    } catch (err) {
      if (err instanceof ConflictError) {
        // Already marked (e.g. from another phone): show what's recorded.
        if (err.status === "delivered" || err.status === "failed") onStale();
        else setError(err.message);
      } else {
        setError("That didn't go through. Check your connection and try again.");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <PhoneScreen>
      <p className="eyebrow">Order #{job.orderNumber}</p>
      <h1 className="h1">Mark this delivery</h1>
      <p className="sub">
        {job.customerName} &middot; {job.itemDescription}
      </p>

      <button
        className="outcome-btn outcome-delivered"
        onClick={() => mark("delivered")}
        disabled={sending}
      >
        <CheckIcon size={16} />
        Delivered
      </button>
      <button
        className="outcome-btn outcome-failed"
        onClick={() => mark("failed")}
        disabled={sending}
      >
        <CrossIcon />
        Failed / Couldn&apos;t deliver
      </button>

      <div className="card" style={{ marginTop: 8 }}>
        <label className="field-label" htmlFor="reason">
          If failed, reason
        </label>
        <select
          id="reason"
          className="field"
          style={{ marginBottom: 0 }}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value as FailureReason | "");
            setNeedReason(false);
          }}
          aria-invalid={needReason}
          aria-describedby={needReason ? "reason-error" : undefined}
        >
          <option value="">Choose a reason</option>
          {(Object.keys(FAILURE_REASON_LABELS) as FailureReason[]).map((r) => (
            <option key={r} value={r}>
              {FAILURE_REASON_LABELS[r]}
            </option>
          ))}
        </select>
        {needReason && (
          <p id="reason-error" className="field-error" style={{ margin: "8px 0 0" }}>
            Choose a reason, then tap Failed again.
          </p>
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
      <button onClick={onBack} className="tag-back mt-5">
        <BackIcon />
        Back to delivery details
      </button>
    </PhoneScreen>
  );
}

function DoneScreen({ job }: { job: RiderJob }) {
  const vendor = job.vendorName ?? "The business";
  if (job.status === "delivered") {
    return (
      <ResultScreen
        icon={<CheckIcon />}
        tone="brand"
        eyebrow={`Order #${job.orderNumber}`}
        title="Marked as delivered"
        sub={`Thanks, ${job.riderName.split(/\s+/)[0]}. ${vendor} can see it on their dashboard.`}
      >
        <Summary job={job} badge={["badge-success", "Delivered"]} />
      </ResultScreen>
    );
  }
  return (
    <ResultScreen
      icon={<AlertIcon />}
      tone="danger"
      eyebrow={`Order #${job.orderNumber}`}
      title="Marked as failed"
      sub={`${vendor} can see it on their dashboard.`}
    >
      <Summary
        job={job}
        badge={[
          "badge-danger",
          job.failureReason ? FAILURE_REASON_LABELS[job.failureReason] : "Failed",
        ]}
      />
    </ResultScreen>
  );
}

function Summary({ job, badge }: { job: RiderJob; badge: [string, string] }) {
  return (
    <div className="summary">
      <div className="summary-row">
        <span className="summary-label">Customer</span>
        <span className="summary-val">{job.customerName}</span>
      </div>
      <div className="summary-row">
        <span className="summary-label">Item</span>
        <span className="summary-val">{asSentenceStart(job.itemDescription)}</span>
      </div>
      <div className="summary-row">
        <span className="summary-label">Status</span>
        <span className={`badge ${badge[0]}`}>{badge[1]}</span>
      </div>
    </div>
  );
}
