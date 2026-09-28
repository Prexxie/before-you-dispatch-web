"use client";

import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  ConflictError,
  FAILURE_REASON_LABELS,
  NotFoundError,
  VendorOrder,
  dispatchOrder,
  getVendorOrder,
} from "@/lib/api";
import {
  customerLink,
  customerMessage,
  riderLink,
  riderMessage,
  whatsappLink,
} from "@/lib/links";
import { BackIcon, LinkIcon, RiderIcon, WhatsAppIcon } from "@/components/icons";

// Decided 28 Sep: vendor pages check for changes every 15 seconds.
const REFRESH_MS = 15_000;

type View =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "error" }
  | { kind: "ready"; order: VendorOrder };

const firstName = (name: string) => name.trim().split(/\s+/)[0];

export default function OrderView({ id }: { id: string }) {
  const [view, setView] = useState<View>({ kind: "loading" });

  // Load now, then refresh while the tab is visible until the order is done.
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      try {
        const order = await getVendorOrder(id);
        if (stopped) return;
        setView({ kind: "ready", order });
        if (order.status === "delivered" || order.status === "failed") return;
      } catch (err) {
        if (stopped) return;
        if (err instanceof NotFoundError) {
          setView({ kind: "missing" });
          return;
        }
        // Keep showing the last good state; only error if we never had one.
        setView((v) => (v.kind === "ready" ? v : { kind: "error" }));
      }
      timer = setTimeout(tick, REFRESH_MS);
    }

    function tick() {
      if (document.visibilityState === "visible") load();
      else timer = setTimeout(tick, REFRESH_MS);
    }

    function onVisible() {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        load();
      }
    }

    load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [id]);

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
    <OrderScreen
      order={view.order}
      onChange={(order) => setView({ kind: "ready", order })}
    />
  );
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

  // Design: "Vendor: Rider Link Generated" (confirmed), then the same card
  // once the rider is on the way.
  if (order.status === "confirmed" || order.status === "dispatched") {
    const dispatched = order.status === "dispatched";
    return (
      <>
        {eyebrow}
        <h1 className="h1">
          {dispatched
            ? `On its way to ${customer}`
            : `${customer} confirmed, they're ready`}
        </h1>
        <p className="sub">
          {dispatched
            ? `${rider} has the pin and landmark note.`
            : `Send this link to ${rider} with the pin and landmark note already attached.`}
        </p>
        <RiderLinkCard order={order} onChange={onChange} />
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
          ? `${rider} marked this delivery as delivered.`
          : `${rider} couldn't deliver: ${
              order.failureReason
                ? FAILURE_REASON_LABELS[order.failureReason].toLowerCase()
                : "no reason given"
            }.`}
      </p>
      <div className="card">
        <span className={`badge ${delivered ? "badge-success" : "badge-danger"}`}>
          {delivered ? "Delivered" : "Failed"}
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

function CustomerLinkCard({ order }: { order: VendorOrder }) {
  const link = customerLink(order.customerToken);
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
      <div className="row-flex" style={{ marginBottom: 4 }}>
        <button type="button" onClick={copy} className="btn btn-secondary">
          {copyState === "copied" ? "Copied" : "Copy Link"}
        </button>
        <a
          href={whatsappLink(order.customerPhone, customerMessage(link))}
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
  const dispatched = order.status === "dispatched";
  const rider = firstName(order.rider.name);

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
        {dispatched ? (
          <span className="badge badge-filled">Dispatched</span>
        ) : (
          <>
            <span className="badge badge-success">Pin dropped</span>
            <span className="badge badge-success">Note added</span>
          </>
        )}
      </div>
      <a
        href={whatsappLink(order.rider.phone, riderMessage(link, firstName(order.customerName)))}
        target="_blank"
        rel="noopener noreferrer"
        onClick={send}
        className={`btn btn-block ${dispatched ? "btn-secondary" : "btn-primary"}`}
      >
        <WhatsAppIcon />
        {dispatched ? `Send to ${rider} again` : "Send to Rider via WhatsApp"}
      </a>
      {!dispatched && (
        <p className="mt-3.5 text-[13px] leading-normal text-ink-soft">
          Sending the link marks this order{" "}
          <strong className="text-ink">Dispatched</strong> on your dashboard.
        </p>
      )}
      {error && (
        <p className="mt-3 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
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
