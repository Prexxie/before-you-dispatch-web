"use client";

import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  ConflictError,
  failureText,
  Rider,
  VendorOrder,
  dispatchOrder,
  getMe,
  getRiders,
  getVendorOrder,
  markDeliveredByVendor,
  redeliverOrder,
  retriggerOrder,
} from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useLiveData } from "@/lib/useLiveData";
import { formatTime } from "@/lib/time";
import {
  customerLink,
  customerMessage,
  firstName,
  riderLink,
  riderMessage,
  whatsappLink,
} from "@/lib/links";
import {
  BackIcon,
  CheckIcon,
  CrossIcon,
  LinkIcon,
  MessageIcon,
  RiderIcon,
  WhatsAppIcon,
} from "@/components/icons";

export default function OrderView({ id }: { id: string }) {
  // Bumped when a failed or declined order gets a fresh start, so refreshing
  // (which stops once an order is finished) starts again.
  const [round, setRound] = useState(0);
  // Who's sending: the account owner's first name, for the messages.
  const [sender, setSender] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((me) => {
        if (!cancelled && me) setSender(firstName(me.ownerName));
      })
      .catch(() => {
        // Messages fall back to the business name alone.
      });
    return () => {
      cancelled = true;
    };
  }, []);
  // Refresh until the order is finished.
  const [view, setOrder] = useLiveData(
    () => getVendorOrder(id),
    `${id}:${round}`,
    (order) => order.status === "delivered" || order.status === "failed",
  );

  if (view.kind === "loading") {
    return <p className="sub">Loading order…</p>;
  }
  if (view.kind === "missing") {
    return (
      <>
        <p className="eyebrow">Order</p>
        <h1 className="h1">Order not found</h1>
        <p className="sub">Check the link, or go back to your dashboard.</p>
        <BackToDashboard />
      </>
    );
  }
  if (view.kind === "error") {
    return (
      <>
        <p className="eyebrow">Order</p>
        <h1 className="h1">We couldn&apos;t load this order</h1>
        <p className="sub">Check your connection. This page will keep trying.</p>
        <BackToDashboard />
      </>
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/vendor" },
          { label: `Order #${view.data.orderNumber}` },
        ]}
      />
      <OrderScreen
      order={view.data}
      sender={sender}
      onChange={(next) => {
        setOrder(next);
        if (next.status === "pending_confirmation") setRound((r) => r + 1);
      }}
      />
    </>
  );
}

function OrderScreen({
  order,
  sender,
  onChange,
}: {
  order: VendorOrder;
  sender: string | null;
  onChange: (order: VendorOrder) => void;
}) {
  const customer = firstName(order.customerName);
  const rider = firstName(order.rider.name);
  const eyebrow = <p className="eyebrow">Order #{order.orderNumber}</p>;

  // Design: "Vendor: Link Generated"
  if (order.status === "pending_confirmation") {
    return (
      <>
        {eyebrow}
        <h1 className="h1">
          {order.attempt > 1 ? `New link ready for ${customer}` : "Order created"}
        </h1>
        <p className="sub">
          Share this link with {customer}. They&apos;ll confirm they&apos;re
          ready before any rider is sent.
        </p>
        <CustomerLinkCard order={order} sender={sender} />
        <AttemptHistory order={order} />
        <p className="mt-4 text-[13px] text-ink-soft" role="status">
          Waiting for {customer} to answer. This page updates by itself.
        </p>
      </>
    );
  }

  // Design: "Vendor: Declined (Retrigger)"
  if (order.status === "not_ready") {
    return (
      <>
        {eyebrow}
        <h1 className="h1">{customer} declined this delivery</h1>
        <p className="sub">
          They chose &ldquo;Not now&rdquo; and confirmed the decline, so their
          link is closed and no rider was sent. If the delivery is going out
          today after all, you can retrigger it.
        </p>
        <div className="card">
          <p className="field-label">Delivery progress</p>
          <ul className="steps">
            <li className="step done">
              <span className="step-dot" aria-hidden="true">
                <CheckIcon size={12} />
              </span>
              Confirmation link sent to {customer}
              <span className="step-time">{formatTime(order.createdAt)}</span>
            </li>
            <li className="step failed">
              <span className="step-dot" aria-hidden="true">
                <CrossIcon size={12} />
              </span>
              {customer} declined. Link closed
              <span className="step-time">{formatTime(order.notReadyAt)}</span>
            </li>
          </ul>
          <NextAttemptPanel kind="retrigger" order={order} onChange={onChange} />
          <BackToDashboard />
        </div>
      </>
    );
  }

  if (order.status === "confirmed" && !order.riderToken) {
    return (
      <>
        {eyebrow}
        <h1 className="h1">{customer} confirmed, they&apos;re ready</h1>
        <p className="sub">
          Waiting for their pin and landmark note. The rider link appears here
          as soon as they share them.
        </p>
        <div className="card">
          <div className="row-flex">
            <span className="badge badge-success">Ready</span>
            <span className="badge badge-warning">Pin not shared yet</span>
          </div>
          <BackToDashboard />
        </div>
      </>
    );
  }

  // Design: "Vendor: Rider Link Generated"
  if (order.status === "confirmed") {
    return (
      <>
        {eyebrow}
        <h1 className="h1">{customer} confirmed, they&apos;re ready</h1>
        <p className="sub">
          Send this link to {rider} with the pin and landmark note already
          attached.
        </p>
        <RiderLinkCard order={order} sender={sender} onChange={onChange} />
      </>
    );
  }

  // Design: "Vendor: On Its Way (override)"
  if (order.status === "dispatched") {
    return (
      <>
        {eyebrow}
        <h1 className="h1">On its way to {customer}</h1>
        <p className="sub">
          {order.pickedUpAt
            ? `${rider} picked up the order and has the pin and landmark note. ${customer} confirms when the items are in their hands, then ${rider} completes the delivery.`
            : `Waiting for ${rider} to confirm pickup. Their pin and landmark note unlock automatically once they do.`}
        </p>
        <OnItsWayCard order={order} onChange={onChange} />
      </>
    );
  }

  // Design: "Vendor: Failed (Redeliver)"
  if (order.status === "failed") {
    return (
      <>
        <p className="eyebrow">
          Order #{order.orderNumber} · Attempt {order.attempt}
        </p>
        <h1 className="h1">The delivery to {customer} failed</h1>
        <p className="sub">
          {rider} couldn&apos;t deliver:{" "}
          {failureText(order.failureReason, order.failureNote)}
          . You can try again with a fresh confirmation from {customer}.
        </p>
        <div className="card">
          <Progress order={order} />
          <NextAttemptPanel kind="redeliver" order={order} onChange={onChange} />
          <AttemptHistory order={order} />
          <BackToDashboard />
        </div>
      </>
    );
  }

  const delivered = order.status === "delivered";
  return (
    <>
      {eyebrow}
      <h1 className="h1">
        {delivered ? `Delivered to ${customer}` : `Delivery to ${customer} failed`}
      </h1>
      <p className="sub">
        {delivered
          ? order.deliveryConfirmedBy === "vendor"
            ? `You marked this delivered for ${customer}.`
            : `${customer} confirmed they received it, and ${rider} completed the delivery.`
          : `${rider} couldn't deliver: ${failureText(order.failureReason, order.failureNote)}.`}
      </p>
      <div className="card">
        <Progress order={order} />
        <span className={`badge ${delivered ? "badge-success" : "badge-danger"}`}>
          {delivered
            ? order.deliveryConfirmedBy === "vendor"
              ? "Delivered – confirmed by you"
              : "Delivered"
            : "Failed"}
        </span>
        <BackToDashboard />
      </div>
    </>
  );
}

function LinkBox({ link, label }: { link: string; label: ReactNode }) {
  return (
    <>
      <p className="field-label" id="order-link-label">
        {label}
      </p>
      <div
        className="linkbox"
        aria-labelledby="order-link-label"
        data-testid="order-link"
      >
        <LinkIcon className="shrink-0 opacity-70" />
        {link}
      </div>
    </>
  );
}

function MessagePreview({ to, message }: { to: string; message: string }) {
  return (
    <>
      <p className="field-label">
        <MessageIcon />
        Message {to} will get
      </p>
      <div className="msg-preview" data-testid="message-preview">
        {message}
      </div>
    </>
  );
}

function CustomerLinkCard({
  order,
  sender,
}: {
  order: VendorOrder;
  sender: string | null;
}) {
  const link = customerLink(order.customerToken);
  const message = customerMessage(link, order, order.vendor, sender);
  const boxRef = useRef<HTMLDivElement>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">(
    "idle",
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopyState("copied");
    } catch {
      // Clipboard blocked: select the link so the vendor can copy it by hand.
      const box = boxRef.current?.querySelector("[data-testid=order-link]");
      if (box) {
        const range = document.createRange();
        range.selectNodeContents(box);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
      setCopyState("manual");
    }
  }

  return (
    <div className="card" ref={boxRef}>
      <LinkBox
        link={link}
        label={
          <>
            <LinkIcon />
            Customer confirmation link
          </>
        }
      />
      <MessagePreview to={firstName(order.customerName)} message={message} />
      <div className="row-flex" style={{ marginBottom: 4 }}>
        <button type="button" onClick={copy} className="btn btn-secondary">
          {copyState === "copied" ? "Copied" : "Copy Link"}
        </button>
        <a
          href={whatsappLink(order.customerPhone, message)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          <WhatsAppIcon />
          Send via WhatsApp
        </a>
      </div>
      {copyState === "manual" && (
        <p className="mt-2 text-sm text-ink-soft" role="status">
          Link selected. Press Ctrl+C (or ⌘C) to copy it.
        </p>
      )}
      <BackToDashboard />
    </div>
  );
}

function RiderLinkCard({
  order,
  sender,
  onChange,
}: {
  order: VendorOrder;
  sender: string | null;
  onChange: (order: VendorOrder) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const link = riderLink(order.riderToken!);
  const message = riderMessage(link, order, order.vendor, sender);

  // Decided 28 Sep: sending the rider link marks the order Dispatched. The
  // link opens WhatsApp in a new tab while this records the dispatch.
  function send() {
    setError(null);
    dispatchOrder(order.id)
      .then(onChange)
      .catch((err) =>
        setError(
          err instanceof ConflictError
            ? err.message
            : "WhatsApp opened, but we couldn't mark this order Dispatched. Check your connection and send again.",
        ),
      );
  }

  return (
    <div className="card">
      <LinkBox
        link={link}
        label={
          <>
            <RiderIcon />
            Rider delivery link
          </>
        }
      />
      <div className="row-flex" style={{ marginBottom: 22 }}>
        <span className="badge badge-success">Pin dropped</span>
        <span className="badge badge-success">Note added</span>
      </div>
      <MessagePreview to={firstName(order.rider.name)} message={message} />
      <a
        href={whatsappLink(order.rider.phone, message)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={send}
        className="btn btn-primary btn-block"
      >
        <WhatsAppIcon />
        Send to Rider via WhatsApp
      </a>
      <p className="mt-3.5 text-[13px] leading-normal text-ink-soft">
        Sending the link marks this order{" "}
        <strong className="text-ink">Dispatched</strong> on your dashboard.
      </p>
      {error && (
        <p className="mt-3 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
      <BackToDashboard />
    </div>
  );
}

// Delivery progress steps (design: "Vendor: On Its Way").
function Progress({ order }: { order: VendorOrder }) {
  const customer = firstName(order.customerName);
  const rider = firstName(order.rider.name);
  const finished = order.status === "delivered" || order.status === "failed";
  const steps: { label: string; state: "done" | "current" | "todo" | "failed"; at?: string }[] = [
    {
      label: `${customer} confirmed they're ready and dropped a pin`,
      state: "done",
      at: formatTime(order.locationSavedAt),
    },
    { label: `Rider link sent to ${rider}`, state: "done", at: formatTime(order.dispatchedAt) },
    {
      label: order.pickedUpAt
        ? `${rider} picked up the order`
        : `${rider} confirms pickup`,
      // A finished order whose rider never tapped pickup (a failed attempt,
      // or a vendor override) shows this as skipped, not "in progress".
      state: order.pickedUpAt ? "done" : finished || order.receivedAt ? "todo" : "current",
      at: formatTime(order.pickedUpAt),
    },
    {
      label: order.arrivedAt
        ? `${rider} arrived at ${customer}'s location`
        : `${rider} arrives at ${customer}'s location`,
      state: order.arrivedAt
        ? "done"
        : finished || order.receivedAt
          ? "todo"
          : order.pickedUpAt
            ? "current"
            : "todo",
      at: formatTime(order.arrivedAt),
    },
  ];
  if (order.status === "failed") {
    steps.push({
      label: order.failureReason
        ? `Failed: ${failureText(order.failureReason, order.failureNote)}`
        : `${rider} marked it failed`,
      state: "failed",
      at: formatTime(order.completedAt),
    });
  } else if (order.deliveryConfirmedBy === "vendor") {
    steps.push({ label: `You marked it delivered for ${customer}`, state: "done", at: formatTime(order.completedAt) });
  } else {
    steps.push({
      label: order.receivedAt
        ? `${customer} confirmed they've received it`
        : `Waiting for ${customer} to confirm they've received it`,
      // Only the next actionable step is "current"; this one waits its turn
      // until the rider has picked up.
      state: order.receivedAt ? "done" : order.pickedUpAt ? "current" : "todo",
      at: formatTime(order.receivedAt),
    });
    steps.push({
      label: finished
        ? `${rider} completed the delivery`
        : `${rider} marks the delivery completed`,
      state: finished ? "done" : order.receivedAt ? "current" : "todo",
      at: finished ? formatTime(order.completedAt) : undefined,
    });
  }

  return (
    <>
      <p className="field-label">Delivery progress</p>
      <ul className="steps">
        {steps.map((s) => (
          <li key={s.label} className={`step ${s.state}`}>
            <span className="step-dot" aria-hidden="true">
              {s.state === "done" && <CheckIcon size={12} />}
              {s.state === "failed" && <CrossIcon size={12} />}
              {s.state === "current" && (
                <svg width="12" height="12" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="4" fill="currentColor" />
                </svg>
              )}
            </span>
            {s.label}
            {s.at && <span className="step-time">{s.at}</span>}
          </li>
        ))}
      </ul>
    </>
  );
}

function OnItsWayCard({
  order,
  onChange,
}: {
  order: VendorOrder;
  onChange: (order: VendorOrder) => void;
}) {
  const customer = firstName(order.customerName);
  const rider = firstName(order.rider.name);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markDelivered() {
    setBusy(true);
    setError(null);
    try {
      onChange(await markDeliveredByVendor(order.id));
    } catch (err) {
      setError(
        err instanceof ConflictError
          ? err.message
          : "That didn't go through. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <Progress order={order} />
      <div className="override">
        <p>
          <strong className="text-ink">{customer} can&apos;t confirm?</strong>{" "}
          If {rider} has handed the items over and {customer} can&apos;t tap the
          button (no data, phone off, received by someone else), you can mark it
          delivered. It&apos;ll show as &ldquo;Delivered, confirmed by you&rdquo;.
        </p>
        {confirming ? (
          <div className="row-flex">
            <button type="button" onClick={markDelivered} disabled={busy} className="btn btn-primary">
              {busy ? "Saving…" : `Yes, ${customer} has the items`}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={busy} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="btn btn-secondary">
            Mark as Delivered for {customer}
          </button>
        )}
        {error && (
          <p className="mt-3 text-sm font-semibold text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
      <BackToDashboard />
    </div>
  );
}

// Earlier failed attempts of this order (kept when it was redelivered).
function AttemptHistory({ order }: { order: VendorOrder }) {
  if (order.attempts.length === 0) return null;
  return (
    <div className="mt-6">
      <p className="field-label">Attempt history</p>
      {order.attempts.map((a) => (
        <div key={a.attemptNumber} className="attempt">
          <span className="badge badge-danger">Failed</span>
          <span>
            <strong>Attempt {a.attemptNumber}</strong> · {firstName(a.riderName)}
            {a.failureReason
              ? ` · ${failureText(a.failureReason, a.failureNote)}`
              : ""}
          </span>
          <span className="attempt-when">{formatTime(a.failedAt)}</span>
        </div>
      ))}
    </div>
  );
}

// Starting again with a fresh customer link: after the customer declined
// ("retrigger") or after the rider failed ("redeliver"). Asks first, since
// it closes the old links, and lets the vendor pick a different rider.
function NextAttemptPanel({
  kind,
  order,
  onChange,
}: {
  kind: "retrigger" | "redeliver";
  order: VendorOrder;
  onChange: (order: VendorOrder) => void;
}) {
  const customer = firstName(order.customerName);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [riderId, setRiderId] = useState(order.rider.id);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRiders({ activeOnly: true })
      .then((list) => {
        if (!cancelled) setRiders(list);
      })
      .catch(() => {
        // Keep the current rider as the only choice.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The current rider stays selectable even if they've since been deactivated.
  const options = riders.some((r) => r.id === order.rider.id)
    ? riders
    : [order.rider, ...riders];

  async function go() {
    setBusy(true);
    setError(null);
    const pick = riderId === order.rider.id ? undefined : riderId;
    try {
      onChange(
        await (kind === "retrigger" ? retriggerOrder : redeliverOrder)(order.id, pick),
      );
    } catch (err) {
      setError(
        err instanceof ConflictError
          ? err.message
          : "That didn't go through. Check your connection and try again.",
      );
      setBusy(false);
    }
  }

  const label = kind === "retrigger" ? "Retrigger Delivery" : "Redeliver";
  return (
    <div className="override">
      <label className="field-label" htmlFor="next-rider">
        <RiderIcon />
        {kind === "retrigger" ? "Rider" : "Rider for the next attempt"}
      </label>
      <select
        id="next-rider"
        className="field"
        style={{ marginBottom: 14 }}
        value={riderId}
        onChange={(e) => setRiderId(e.target.value)}
        disabled={busy}
      >
        {options.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
            {r.vehicle ? ` · ${r.vehicle[0].toUpperCase()}${r.vehicle.slice(1)}` : ""}
            {r.id === order.rider.id ? " (same rider)" : ""}
          </option>
        ))}
      </select>
      <p>
        <strong className="text-ink">Ready to try again?</strong>{" "}
        {kind === "retrigger"
          ? `Retriggering gives ${customer} a brand-new link and puts the order back to "Awaiting confirmation". The old link stays closed.`
          : `Redeliver sends ${customer} a new link to confirm they're ready. Their saved pin and address load automatically, so it takes two taps.`}{" "}
        Only do this if the delivery is going out today.
      </p>
      {confirming ? (
        <div className="row-flex">
          <button type="button" onClick={go} disabled={busy} className="btn btn-primary">
            {busy ? "Sending…" : `Yes, send ${customer} a new link`}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="btn btn-primary">
          {label}
        </button>
      )}
      {error && (
        <p className="mt-3 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function BackToDashboard() {
  return (
    <Link href="/vendor" className="tag-back mt-4">
      <BackIcon />
      Back to Dashboard
    </Link>
  );
}
