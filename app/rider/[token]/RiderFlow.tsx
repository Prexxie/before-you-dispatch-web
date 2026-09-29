"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  ConflictError,
  FAILURE_REASON_LABELS,
  FailureReason,
  RiderJob,
  confirmArrived,
  confirmPickup,
  undoArrived,
  undoPickup,
  getRiderJob,
  submitOutcome,
} from "@/lib/api";
import { useLiveData } from "@/lib/useLiveData";
import { formatTime } from "@/lib/time";
import {
  directionsLink,
  directionsLinkToAddress,
  displayPhone,
  firstName,
  telLink,
} from "@/lib/links";
import PhoneScreen, { ResultScreen, asSentenceStart } from "@/components/PhoneScreen";
import { VendorContact } from "@/components/VendorStrip";
import {
  AlertIcon,
  BackIcon,
  CheckIcon,
  ClockIcon,
  CrossIcon,
  DirectionsIcon,
  LockIcon,
  LogoMark,
  NextStopIcon,
  NoteIcon,
  PackageIcon,
  PinCheckIcon,
  PinIcon,
} from "@/components/icons";

// Leaflet touches `window` on import, so it can only load in the browser.
const PinMap = dynamic(() => import("@/components/PinMap"), {
  ssr: false,
  loading: () => null,
});

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const finished = (job: RiderJob) =>
  job.status === "delivered" || job.status === "failed";

export default function RiderFlow({ token }: { token: string }) {
  // Refreshes so "I've Picked Up the Order" and "Mark Delivery Completed"
  // unlock by themselves as the rider and customer act.
  const [view, setJob] = useLiveData(() => getRiderJob(token), token, finished);
  const [failing, setFailing] = useState(false);

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
  if (view.kind === "missing") {
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
        sub="Check your internet connection. This page will keep trying."
      />
    );
  }

  const job = view.data;
  if (finished(job)) return <DoneScreen job={job} />;

  if (job.status !== "dispatched") {
    return (
      <PhoneScreen centered>
        <LogoMark size={20} className="mb-7 block" />
        <p className="eyebrow">Order #{job.orderNumber}</p>
        <h1 className="h1">Not sent out yet</h1>
        <p className="sub">
          {job.vendor?.name ?? "The business"} hasn&apos;t sent this delivery
          out yet. This page will update by itself once they do.
        </p>
      </PhoneScreen>
    );
  }
  if (job.receivedAt) {
    return <CompleteScreen token={token} job={job} onChange={setJob} />;
  }
  if (failing) {
    return (
      <CouldntDeliverScreen
        token={token}
        job={job}
        onBack={() => setFailing(false)}
        onChange={setJob}
      />
    );
  }
  if (!job.pickedUpAt || !job.location) {
    return <PickupScreen token={token} job={job} onChange={setJob} />;
  }
  return (
    <EnRouteScreen
      token={token}
      job={job}
      location={job.location}
      onChange={setJob}
      onCouldntDeliver={() => setFailing(true)}
    />
  );
}

// Design: "Rider: Assigned Delivery" (pickup leg only; the customer's pin
// stays hidden — by the API, not just the UI — until pickup is confirmed).
function PickupScreen({
  token,
  job,
  onChange,
}: {
  token: string;
  job: RiderJob;
  onChange: (job: RiderJob) => void;
}) {
  const customer = firstName(job.customerName);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickedUp() {
    setConfirming(true);
    setError(null);
    try {
      const result = await confirmPickup(token);
      onChange({ ...job, pickedUpAt: result.pickedUpAt, location: result.location });
    } catch (err) {
      setError(
        err instanceof ConflictError
          ? err.message
          : "That didn't go through. Check your connection and try again.",
      );
    } finally {
      setConfirming(false);
    }
  }

  return (
    <PhoneScreen>
      <p className="eyebrow">New Job &middot; Order #{job.orderNumber}</p>
      <h1 className="h1">Delivery assigned to you</h1>
      <p className="sub">
        Head to the pickup point below. Once you have the items, confirm
        pickup to unlock the customer&apos;s pin.
      </p>

      <div className="card" style={{ marginBottom: 18, padding: 24 }}>
        {job.vendor && (
          <>
            <div className="leg">
              <span
                className="avatar"
                style={{ width: 36, height: 36, fontSize: 13, background: "#FDF2F4", color: "#9F1239" }}
              >
                {initials(job.vendor.name)}
              </span>
              <div>
                <div className="leg-label">Pick up from</div>
                <div className="leg-name">{job.vendor.name}</div>
                <div className="leg-meta">
                  <VendorContact vendor={job.vendor} />
                </div>
              </div>
            </div>
            <div className="leg-divider" />
          </>
        )}
        <p className="field-label">
          <PackageIcon />
          Item to collect
        </p>
        <div className="text-[14.5px] text-ink mb-4">{job.itemDescription}</div>
        <div className="next-leg">
          <NextStopIcon />
          <span>
            Then deliver to <strong>{job.customerName}</strong> &middot; pin
            shown after pickup
          </span>
        </div>
      </div>

      {job.vendor?.address && (
        <a
          href={directionsLinkToAddress(job.vendor.address)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-block mb-3"
        >
          <DirectionsIcon />
          Get Directions to Pickup
        </a>
      )}
      <button onClick={pickedUp} disabled={confirming} className="btn btn-primary btn-block">
        {confirming ? "Confirming…" : "I've Picked Up the Order"}
      </button>
      {error && (
        <p className="mt-3 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
      <p className="caption">
        Waiting on {customer}? Their pin appears here the moment you confirm.
      </p>
    </PhoneScreen>
  );
}

// Design: "Rider: Heading to Customer" (post-pickup, pre-receipt).
function EnRouteScreen({
  token,
  job,
  location,
  onChange,
  onCouldntDeliver,
}: {
  token: string;
  job: RiderJob;
  location: NonNullable<RiderJob["location"]>;
  onChange: (job: RiderJob) => void;
  onCouldntDeliver: () => void;
}) {
  const { lat, lng, landmarkNote, address } = location;
  const customer = firstName(job.customerName);
  const [arriving, setArriving] = useState(false);
  const [arriveError, setArriveError] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);

  async function arrived() {
    setArriving(true);
    setArriveError(null);
    try {
      const result = await confirmArrived(token);
      onChange({ ...job, arrivedAt: result.arrivedAt });
    } catch (err) {
      setArriveError(
        err instanceof ConflictError
          ? err.message
          : "That didn't go through. Check your connection and try again.",
      );
    } finally {
      setArriving(false);
    }
  }

  // A mistaken tap: go back a step. Undoing pickup locks the pin and returns
  // to the pickup screen; undoing arrival returns to "I've Arrived".
  async function undo(step: "pickup" | "arrival") {
    setUndoing(true);
    setArriveError(null);
    try {
      if (step === "pickup") {
        await undoPickup(token);
        onChange({ ...job, pickedUpAt: null, location: null, arrivedAt: null });
      } else {
        await undoArrived(token);
        onChange({ ...job, arrivedAt: null });
      }
    } catch (err) {
      setArriveError(
        err instanceof ConflictError
          ? err.message
          : "That didn't go through. Check your connection and try again.",
      );
    } finally {
      setUndoing(false);
    }
  }

  return (
    <PhoneScreen>
      <p className="eyebrow">Order #{job.orderNumber}</p>
      <span className="badge badge-success pickup-badge">
        <CheckIcon size={10} />
        Picked up &middot; {formatTime(job.pickedUpAt!)}
      </span>
      {job.arrivedAt && (
        <span className="badge badge-accent pickup-badge" style={{ marginLeft: 8 }}>
          <CheckIcon size={10} />
          Arrived &middot; {formatTime(job.arrivedAt)}
        </span>
      )}
      <h1 className="h1">Heading to {customer}</h1>
      <p className="sub">
        You have the items. Use the pin and landmark note below to find them.
      </p>

      <div className="card" style={{ marginBottom: 18, padding: 24 }}>
        <div className="leg mb-4">
          <span className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
            {initials(job.customerName)}
          </span>
          <div>
            <div className="leg-label">Deliver to</div>
            <div className="leg-name">{job.customerName}</div>
            <div className="leg-meta">
              <a href={telLink(job.customerPhone)}>{displayPhone(job.customerPhone)}</a>
            </div>
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

      {address && (
        <>
          <p className="field-label">
            <PinIcon />
            Customer&apos;s address
          </p>
          <div className="linkbox" style={{ marginBottom: 18 }}>
            {address}
          </div>
        </>
      )}

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
        style={{ marginBottom: 14 }}
      >
        <DirectionsIcon />
        Get Directions
      </a>
      {address && (
        <p className="caption" style={{ marginTop: -6, marginBottom: 14 }}>
          Directions go to the customer&apos;s pin. Google may label it with the
          nearest house number, so go by the address above.
        </p>
      )}

      {job.arrivedAt ? (
        <>
          <button className="btn btn-locked btn-block" disabled>
            <CheckIcon size={15} />
            Arrived at {customer}&apos;s Location
          </button>
          {!job.receivedAt && (
            <button
              type="button"
              onClick={() => undo("arrival")}
              disabled={undoing}
              className="undo-link"
            >
              Arrived by mistake? Undo
            </button>
          )}
          {arriveError && (
            <p className="mt-1 text-sm font-semibold text-danger" role="alert">
              {arriveError}
            </p>
          )}
        </>
      ) : (
        <>
          <button onClick={arrived} disabled={arriving} className="btn btn-primary btn-block">
            <PinCheckIcon />
            {arriving ? "Confirming…" : "I've Arrived"}
          </button>
          <p className="caption">
            Tap this once you&apos;re at {customer}&apos;s location. They&apos;ll see
            you&apos;ve arrived.
          </p>
          <button
            type="button"
            onClick={() => undo("pickup")}
            disabled={undoing}
            className="undo-link"
          >
            Picked up by mistake? Undo pickup
          </button>
          {arriveError && (
            <p className="mt-3 text-sm font-semibold text-danger" role="alert">
              {arriveError}
            </p>
          )}
        </>
      )}

      <div className="wait-strip" role="status">
        <ClockIcon />
        <span>
          Hand over the items, then ask {customer} to tap{" "}
          <strong>&ldquo;I&apos;ve received my delivery&rdquo;</strong> on
          their link. You can complete the delivery once they do.
        </span>
      </div>
      <button className="btn btn-locked btn-block" disabled>
        <LockIcon />
        Mark Delivery Completed
      </button>
      <button type="button" onClick={onCouldntDeliver} className="text-link">
        Couldn&apos;t deliver?
      </button>
    </PhoneScreen>
  );
}

// Design: "Rider: Customer Confirmed Receipt"
function CompleteScreen({
  token,
  job,
  onChange,
}: {
  token: string;
  job: RiderJob;
  onChange: (job: RiderJob) => void;
}) {
  const customer = firstName(job.customerName);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function complete() {
    setSending(true);
    setError(null);
    try {
      const result = await submitOutcome(token, { outcome: "delivered" });
      onChange({ ...job, status: result.status, failureReason: null });
    } catch (err) {
      if (err instanceof ConflictError && (err.status === "delivered" || err.status === "failed")) {
        onChange({ ...job, status: err.status });
      } else {
        setError(
          err instanceof ConflictError
            ? err.message
            : "That didn't go through. Check your connection and try again.",
        );
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <ResultScreen
      icon={<CheckIcon />}
      tone="brand"
      eyebrow={`Order #${job.orderNumber}`}
      title={`${customer} has their delivery`}
      sub={`They tapped "I've received my delivery" at ${formatTime(job.receivedAt!)}. Mark it completed to finish the job.`}
    >
      <Summary job={job} badge={["badge-success", "Received by customer"]} />
      <button onClick={complete} disabled={sending} className="btn btn-complete btn-block">
        <CheckIcon size={16} />
        {sending ? "Completing…" : "Mark Delivery Completed"}
      </button>
      {error && (
        <p className="mt-4 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
    </ResultScreen>
  );
}

// Design: "Rider: Couldn't Deliver"
function CouldntDeliverScreen({
  token,
  job,
  onBack,
  onChange,
}: {
  token: string;
  job: RiderJob;
  onBack: () => void;
  onChange: (job: RiderJob) => void;
}) {
  const customer = firstName(job.customerName);
  const vendor = job.vendor?.name ?? "the business";
  const [reason, setReason] = useState<FailureReason | "">("");
  const [needReason, setNeedReason] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markFailed() {
    setError(null);
    if (reason === "") {
      setNeedReason(true);
      return;
    }
    setSending(true);
    try {
      const result = await submitOutcome(token, { outcome: "failed", reason });
      onChange({ ...job, status: result.status, failureReason: result.failureReason });
    } catch (err) {
      setError(
        err instanceof ConflictError
          ? err.message
          : "That didn't go through. Check your connection and try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <PhoneScreen>
      <p className="eyebrow">Order #{job.orderNumber}</p>
      <h1 className="h1">Couldn&apos;t deliver?</h1>
      <p className="sub">
        {job.customerName} &middot; {job.itemDescription}. Tell {vendor} what
        went wrong.
      </p>

      <div className="card" style={{ marginBottom: 18 }}>
        <label className="field-label" htmlFor="reason">
          Reason
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
            Choose a reason first.
          </p>
        )}
      </div>

      <button className="outcome-btn outcome-failed" onClick={markFailed} disabled={sending}>
        <CrossIcon />
        {sending ? "Saving…" : "Mark as Failed"}
      </button>
      {error && (
        <p className="mt-1 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
      <p className="mt-4 text-[13px] leading-normal text-ink-soft">
        Handed it over but {customer} can&apos;t confirm? Call {vendor}
        {job.vendor?.phone && (
          <>
            {" "}on{" "}
            <a className="font-bold text-brand" href={telLink(job.vendor.phone)}>
              {displayPhone(job.vendor.phone)}
            </a>
          </>
        )}
        . They can mark it delivered for you.
      </p>
      <button onClick={onBack} className="tag-back mt-5">
        <BackIcon />
        Back to delivery details
      </button>
    </PhoneScreen>
  );
}

function DoneScreen({ job }: { job: RiderJob }) {
  const vendor = job.vendor?.name ?? "The business";
  if (job.status === "delivered") {
    return (
      <ResultScreen
        icon={<CheckIcon />}
        tone="brand"
        eyebrow={`Order #${job.orderNumber}`}
        title="Delivery completed"
        sub={
          job.deliveryConfirmedBy === "vendor"
            ? `${vendor} marked this delivered for the customer.`
            : `Thanks, ${firstName(job.riderName)}. ${vendor} can see it on their dashboard.`
        }
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
      {job.vendor && (
        <div className="summary-row">
          <span className="summary-label">From</span>
          <span className="summary-val">{job.vendor.name}</span>
        </div>
      )}
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
