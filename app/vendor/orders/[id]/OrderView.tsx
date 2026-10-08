"use client";

import LogoLoader from "@/components/LogoLoader";
import Link from "next/link";
import { ReactNode, useEffect, useId, useState } from "react";
import {
  ConflictError,
  changeOrderRider,
  failureText,
  Rider,
  VendorOrder,
  dispatchOrder,
  getMe,
  getRiders,
  getVendorOrder,
  markDeliveredByVendor,
  OrderAttempt,
  redeliverOrder,
  retriggerOrder,
} from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useLiveData } from "@/lib/useLiveData";
import { formatDayTime, formatTime } from "@/lib/time";
import {
  customerLink,
  customerMessage,
  displayPhone,
  firstName,
  riderLink,
  riderMessage,
  smsLink,
  whatsappLink,
} from "@/lib/links";
import {
  AlertIcon,
  BackIcon,
  CheckIcon,
  CrossIcon,
  LinkIcon,
  MessageIcon,
  PersonIcon,
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
    return <LogoLoader label="Loading order…" page />;
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
        <CustomerLinkCard order={order} sender={sender} onChange={onChange} />
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
          <AttemptHistory order={order} />
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
          <AttemptHistory order={order} />
          <BackToDashboard />
        </div>
        <ResendLinks order={order} sender={sender} />
      </>
    );
  }

  // Design: "Vendor: Rider Link Generated", or "Vendor: Rider Declined (pick
  // another)" once the rider declined.
  if (order.status === "confirmed") {
    return (
      <>
        {eyebrow}
        {order.riderDeclinedAt ? (
          <>
            <h1 className="h1">
              {firstName(order.declinedRiderName ?? order.rider.name)} declined
              this delivery
            </h1>
            <p className="sub">
              Pick another rider and send them the new link. {customer}&apos;s
              pin, landmark note and link stay the same.
            </p>
          </>
        ) : (
          <>
            <h1 className="h1">{customer} confirmed, they&apos;re ready</h1>
            <p className="sub">
              Send this link to {rider} with the pin and landmark note already
              attached.
            </p>
          </>
        )}
        <RiderLinkCard order={order} sender={sender} onChange={onChange} />
        <AttemptHistory order={order} />
      </>
    );
  }

  // Design: "Vendor: On Its Way (override)", or "Vendor: Waiting for Rider
  // to Accept" until the rider answers.
  if (order.status === "dispatched") {
    const awaitingAccept = !order.acceptedAt && !order.pickedUpAt;
    return (
      <>
        {eyebrow}
        <h1 className="h1">
          {awaitingAccept ? `Waiting for ${rider} to accept` : `On its way to ${customer}`}
        </h1>
        <p className="sub">
          {awaitingAccept
            ? `The link is with ${rider}. Once they accept, they head to you for pickup; ${customer}'s pin unlocks for them after they pick up.`
            : order.pickedUpAt
              ? `${rider} picked up the order and has the pin and landmark note. ${customer} confirms when the items are in their hands, then ${rider} completes the delivery.`
              : `${rider} accepted and is coming to pick up. Their pin and landmark note unlock automatically once they confirm pickup.`}
        </p>
        <OnItsWayCard order={order} onChange={onChange} />
        <ResendLinks order={order} sender={sender} />
        <AttemptHistory order={order} />
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
        <AttemptHistory order={order} />
        <BackToDashboard />
      </div>
    </>
  );
}

function LinkBox({ link, label }: { link: string; label: ReactNode }) {
  const labelId = useId();
  return (
    <>
      <p className="field-label" id={labelId}>
        {label}
      </p>
      <div
        className="linkbox"
        aria-labelledby={labelId}
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

// Ways to get a link to someone: copy it, WhatsApp, or plain SMS for people
// who aren't on WhatsApp. The vendor can come back to these any time while
// the delivery is active.
function LinkActions({
  link,
  phone,
  message,
  onSend,
  whatsappLabel,
  compact = false,
}: {
  link: string;
  phone: string;
  message: string;
  onSend?: () => void;
  whatsappLabel: string;
  // Smaller buttons that wrap, for the collapsed "Resend link" rows.
  compact?: boolean;
}) {
  const size = compact ? " !min-h-10 !px-3.5 !text-[13.5px]" : "";
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  // Copying counts as sending: the vendor is about to paste it to them.
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied("copied");
      onSend?.();
    } catch {
      setCopied("failed");
    }
  }
  return (
    <>
      <div
        className={compact ? "flex flex-wrap gap-2.5" : "row-flex"}
        style={compact ? undefined : { marginBottom: 4 }}
      >
        <button type="button" onClick={copy} className={`btn btn-secondary${size}`}>
          {copied === "copied" ? "Copied" : "Copy Link"}
        </button>
        <a href={smsLink(phone, message)} onClick={onSend} className={`btn btn-secondary${size}`}>
          <MessageIcon />
          {compact ? "SMS" : "Send via SMS"}
        </a>
        <a
          href={whatsappLink(phone, message)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onSend}
          className={`btn btn-primary${size}`}
        >
          <WhatsAppIcon />
          {whatsappLabel}
        </a>
      </div>
      {copied === "failed" && (
        <p className="mt-2 text-sm text-ink-soft" role="status">
          Couldn&apos;t copy automatically. Select the link above and copy it by hand.
        </p>
      )}
    </>
  );
}

// Collapsed "Resend link" rows so a link is never lost: if WhatsApp bounced
// ("not on WhatsApp"), the page was closed, or the first send went to the
// wrong place, the vendor can send it again another way. Only people who
// still need a link get a row: the customer until they've confirmed receipt,
// the rider once dispatched.
function ResendLinks({
  order,
  sender,
}: {
  order: VendorOrder;
  sender: string | null;
}) {
  const rows: {
    key: string;
    name: string;
    role: string;
    link: string;
    phone: string;
    message: string;
  }[] = [];
  if (order.status === "confirmed" || !order.receivedAt) {
    const link = customerLink(order.customerToken);
    rows.push({
      key: "customer",
      name: firstName(order.customerName),
      role: "customer",
      link,
      phone: order.customerPhone,
      message: customerMessage(link, order, order.vendor, sender),
    });
  }
  if (order.riderToken && order.status === "dispatched") {
    const link = riderLink(order.riderToken);
    rows.push({
      key: "rider",
      name: firstName(order.rider.name),
      role: "rider",
      link,
      phone: order.rider.phone,
      message: riderMessage(link, order, order.vendor, sender),
    });
  }
  if (rows.length === 0) return null;
  return (
    <div className="card mt-4 !py-2">
      {rows.map((r) => (
        <details
          key={r.key}
          className="group border-b border-[#F1EFEA] last:border-b-0"
          open={rows.length === 1}
        >
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-2 text-sm [&::-webkit-details-marker]:hidden">
            <span className="avatar">{r.name.charAt(0).toUpperCase()}</span>
            <span className="flex-1">
              <strong>{r.name}</strong>{" "}
              <span className="ml-1 font-medium text-ink-faint">{r.role}</span>
            </span>
            <span className="text-[13px] font-bold text-brand">Resend link</span>
          </summary>
          <div className="pb-4 pl-9">
            <LinkActions
              link={r.link}
              phone={r.phone}
              message={r.message}
              whatsappLabel="WhatsApp"
              compact
            />
          </div>
        </details>
      ))}
    </div>
  );
}

// The assigned rider, with a way to swap them before anything is sent. Lets
// the vendor go back after picking a rider (or after redeliver / retrigger
// chose one) without starting over.
function RiderRow({
  order,
  note,
  onChange,
  label = "Rider",
  startOpen = false,
  bare = false,
}: {
  order: VendorOrder;
  note: string;
  onChange: (order: VendorOrder) => void;
  label?: string;
  // Opens with the rider list showing (the rider declined).
  startOpen?: boolean;
  // Without the rule above it, for the top of a card.
  bare?: boolean;
}) {
  const [editing, setEditing] = useState(startOpen);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [riderId, setRiderId] = useState(order.rider.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
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
  }, [editing]);

  const options = riders.some((r) => r.id === order.rider.id)
    ? riders
    : [order.rider, ...riders];
  const vehicle = (v: Rider["vehicle"]) =>
    v ? ` · ${v[0].toUpperCase()}${v.slice(1)}` : "";

  async function save() {
    if (riderId === order.rider.id) {
      setEditing(false);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onChange(await changeOrderRider(order.id, riderId));
      setEditing(false);
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

  // The rider who declined stays in the list (they might be
  // able to after all), marked so.
  const declined = (r: Rider) =>
    order.riderDeclinedAt && r.id === order.rider.id ? " (declined)" : "";

  return (
    <div
      className={
        bare ? "mb-[26px]" : "mb-[18px] mt-1 border-t border-[#F1EFEA] pt-[18px]"
      }
    >
      <label className="field-label" htmlFor="change-rider">
        <RiderIcon />
        {label}
      </label>
      {editing ? (
        <>
          <select
            id="change-rider"
            className="field"
            style={{ marginBottom: 12 }}
            value={riderId}
            onChange={(e) => setRiderId(e.target.value)}
            disabled={busy}
          >
            {options.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
                {vehicle(r.vehicle)}
                {declined(r)}
              </option>
            ))}
          </select>
          <div className="row-flex">
            <button type="button" onClick={save} disabled={busy} className="btn btn-primary">
              {busy ? "Saving…" : "Save rider"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setRiderId(order.rider.id);
                setError(null);
              }}
              disabled={busy}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-1">
          <span className="avatar">{order.rider.name.charAt(0).toUpperCase()}</span>
          <span className="flex-1 text-sm">
            <strong>{order.rider.name}</strong>
            <span className="ml-1 font-medium text-ink-faint">
              {vehicle(order.rider.vehicle).replace(" · ", "")}
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              setRiderId(order.rider.id);
              setEditing(true);
            }}
            className="btn btn-secondary !min-h-10 !px-3.5 !text-[13.5px]"
          >
            Change rider
          </button>
        </div>
      )}
      <p className="mt-2.5 text-[13px] leading-normal text-ink-soft">{note}</p>
      {error && (
        <p className="mt-2 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function CustomerLinkCard({
  order,
  sender,
  onChange,
}: {
  order: VendorOrder;
  sender: string | null;
  onChange: (order: VendorOrder) => void;
}) {
  const link = customerLink(order.customerToken);
  const message = customerMessage(link, order, order.vendor, sender);

  return (
    <div className="card">
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
      <LinkActions
        link={link}
        phone={order.customerPhone}
        message={message}
        whatsappLabel="Send via WhatsApp"
      />
      <div className="mb-1 mt-1 border-t border-[#F1EFEA] pt-[18px]">
        <p className="field-label">
          <PersonIcon />
          Customer
        </p>
        <div className="flex items-center gap-1">
          <span className="avatar">{order.customerName.charAt(0).toUpperCase()}</span>
          <span className="flex-1 text-sm">
            <strong>{order.customerName}</strong>
            <span className="ml-1 font-medium text-ink-faint">
              {displayPhone(order.customerPhone)}
            </span>
            <br />
            <span className="text-[13px] text-ink-soft">{order.itemDescription}</span>
          </span>
          <Link
            href={`/vendor/orders/${order.id}/edit`}
            className="btn btn-secondary !min-h-10 !px-3.5 !text-[13.5px]"
          >
            Edit details
          </Link>
        </div>
        <p className="mt-2.5 text-[13px] leading-normal text-ink-soft">
          Typed something wrong? Fix it before {firstName(order.customerName)}{" "}
          answers. Changing the phone number creates a new link and the old one
          stops working.
        </p>
      </div>
      <RiderRow
        order={order}
        note={`Picked the wrong rider? Change them before you send. ${firstName(order.customerName)}'s link stays the same.`}
        onChange={onChange}
      />
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
  // Copying it (the button, or selecting it by hand) counts as sending too,
  // so a rider who gets a pasted link doesn't see "Not sent out yet".
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

  // Design: "Vendor: Rider Declined (pick another)".
  const declinedBy = order.riderDeclinedAt
    ? firstName(order.declinedRiderName ?? order.rider.name)
    : null;

  return (
    <div className="card">
      {declinedBy && (
        <>
          <div className="decline-alert" role="alert">
            <AlertIcon size={18} />
            <span>
              <strong>{declinedBy} declined</strong> at{" "}
              {formatTime(order.riderDeclinedAt)}. Their link has stopped
              working.
            </span>
          </div>
          <RiderRow
            order={order}
            label="Pick another rider"
            startOpen
            bare
            note={`The new rider gets their own link. ${declinedBy} can go after all? Keep ${declinedBy} and send them the link below again.`}
            onChange={onChange}
          />
        </>
      )}
      {/* Copying the link by hand counts as sending it, like the buttons. */}
      <div onCopy={send}>
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
      </div>
      <LinkActions
        link={link}
        phone={order.rider.phone}
        message={message}
        onSend={send}
        whatsappLabel="Send to Rider via WhatsApp"
      />
      <p className="mt-3.5 text-[13px] leading-normal text-ink-soft">
        Sending or copying the link marks this order{" "}
        <strong className="text-ink">Dispatched</strong> on your dashboard.{" "}
        {firstName(order.rider.name)} then accepts or declines it.
      </p>
      {!declinedBy && (
        <RiderRow
          order={order}
          note="Rider can't go? Change them before you send. This creates a new link for the new rider and the old one stops working."
          onChange={onChange}
        />
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
      label: order.acceptedAt ? `${rider} accepted` : `Waiting for ${rider} to accept`,
      state: order.acceptedAt
        ? "done"
        : finished || order.pickedUpAt || order.receivedAt
          ? "todo"
          : "current",
      at: formatTime(order.acceptedAt),
    },
    {
      label: order.pickedUpAt
        ? `${rider} picked up the order`
        : `${rider} confirms pickup`,
      // A finished order whose rider never tapped pickup (a failed attempt,
      // or a vendor override) shows this as skipped, not "in progress".
      state: order.pickedUpAt
        ? "done"
        : finished || order.receivedAt || !order.acceptedAt
          ? "todo"
          : "current",
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
      {/* No "Change rider" once the link is sent: a rider who can't go taps
          "Decline Delivery", which hands the order back for another rider. */}
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

// Earlier rounds of this order, oldest first, shown on every status screen
// so the history stays visible through the next attempt: failed deliveries
// (saved when the vendor redelivers) and the customer's "Not now" (saved
// when the vendor retriggers). The round that just ended is still on the
// order itself, so it's added at the end while the order is failed or
// declined. Design: "Vendor: Failed (Redeliver)" / "Vendor: Declined".
function AttemptHistory({ order }: { order: VendorOrder }) {
  const rows: Pick<
    OrderAttempt,
    "outcome" | "attemptNumber" | "riderName" | "failureReason" | "failureNote" | "failedAt"
  >[] = [...order.attempts];
  if (order.status === "failed") {
    rows.push({
      outcome: "failed",
      attemptNumber: order.attempt,
      riderName: order.rider.name,
      failureReason: order.failureReason,
      failureNote: order.failureNote,
      failedAt: order.completedAt,
    });
  }
  if (order.status === "not_ready") {
    rows.push({
      outcome: "declined",
      attemptNumber: order.attempt,
      riderName: order.rider.name,
      failureReason: null,
      failureNote: null,
      failedAt: order.notReadyAt,
    });
  }
  if (rows.length === 0) return null;
  const customer = firstName(order.customerName);
  return (
    <div className="mt-6">
      <p className="field-label">Attempt history</p>
      {rows.map((a, i) => (
        <div key={i} className="attempt">
          {a.outcome === "declined" ? (
            <>
              <span className="badge badge-neutral">Declined</span>
              <span>
                <strong>{customer} said Not now</strong> · link closed
              </span>
            </>
          ) : (
            <>
              <span className="badge badge-danger">Failed</span>
              <span>
                <strong>Attempt {a.attemptNumber}</strong> · {firstName(a.riderName)}
                {a.failureReason
                  ? ` · ${failureText(a.failureReason, a.failureNote)}`
                  : ""}
              </span>
            </>
          )}
          {/* Attempts can span days (a redelivery tomorrow), so the day is
              shown too: "Today, …", "Yesterday, …", then the date. */}
          <span className="attempt-when">{a.failedAt && formatDayTime(a.failedAt)}</span>
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
