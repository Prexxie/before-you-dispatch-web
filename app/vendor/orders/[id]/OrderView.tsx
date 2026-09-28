"use client";

import Link from "next/link";
import { ReactNode, useRef, useState } from "react";
import {
  ConflictError,
  FAILURE_REASON_LABELS,
  VendorOrder,
  dispatchOrder,
  getVendorOrder,
  markDeliveredByVendor,
} from "@/lib/api";
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
  LinkIcon,
  MessageIcon,
  RiderIcon,
  WhatsAppIcon,
} from "@/components/icons";

export default function OrderView({ id }: { id: string }) {
  // Refresh until the order is finished.
  const [view, setOrder] = useLiveData(
    () => getVendorOrder(id),
    id,
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

  return <OrderScreen order={view.data} onChange={setOrder} />;
}

function OrderScreen({
  order,
  onChange,
}: {
  order: VendorOrder;
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
        <h1 className="h1">Order created</h1>
        <p className="sub">
          Share this link with {customer}. They&apos;ll confirm they&apos;re
          ready before any rider is sent.
        </p>
        <CustomerLinkCard order={order} />
        <p className="mt-4 text-[13px] text-ink-soft" role="status">
          Waiting for {customer} to answer. This page updates by itself.
        </p>
      </>
    );
  }

  if (order.status === "not_ready") {
    return (
      <>
        {eyebrow}
        <h1 className="h1">{customer} isn&apos;t ready today</h1>
        <p className="sub">
          They tapped &ldquo;Not now&rdquo;, so don&apos;t send {rider} out. If
          they change their mind today, this page updates and the rider link
          appears.
        </p>
        <CustomerLinkCard order={order} />
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
        <RiderLinkCard order={order} onChange={onChange} />
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
          : `${rider} couldn't deliver: ${
              order.failureReason
                ? FAILURE_REASON_LABELS[order.failureReason].toLowerCase()
                : "no reason given"
            }.`}
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

function CustomerLinkCard({ order }: { order: VendorOrder }) {
  const link = customerLink(order.customerToken);
  const message = customerMessage(link, order, order.vendor);
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
  onChange,
}: {
  order: VendorOrder;
  onChange: (order: VendorOrder) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const link = riderLink(order.riderToken!);
  const message = riderMessage(link, order, order.vendor);

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
  const steps: { label: string; state: "done" | "current" | "todo"; at?: string }[] = [
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
  ];
  if (order.status === "failed") {
    steps.push({
      label: `${rider} marked it failed`,
      state: "done",
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

function BackToDashboard() {
  return (
    <Link href="/vendor" className="tag-back mt-4">
      <BackIcon />
      Back to Dashboard
    </Link>
  );
}
