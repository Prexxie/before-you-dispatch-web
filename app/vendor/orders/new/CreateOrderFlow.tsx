"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import {
  CreateOrderInput,
  Order,
  Rider,
  ValidationError,
  Vehicle,
  createOrder,
  getRiders,
} from "@/lib/api";
import {
  customerLink,
  customerMessage,
  toWhatsAppNumber,
  whatsappLink,
} from "@/lib/links";
import {
  BackIcon,
  LinkIcon,
  PackageIcon,
  PersonIcon,
  PhoneIcon,
  RiderIcon,
  WhatsAppIcon,
} from "@/components/icons";

type Field = keyof CreateOrderInput;

const EMPTY_FORM: CreateOrderInput = {
  customerName: "",
  customerPhone: "",
  itemDescription: "",
  riderId: "",
};

const FIELD_MESSAGES: Record<Field, string> = {
  customerName: "Enter the customer's name.",
  customerPhone: "Enter a phone number, e.g. 0803 123 4567.",
  itemDescription: "Say what's being delivered.",
  riderId: "Choose a rider.",
};

const VEHICLE_LABELS: Record<Vehicle, string> = {
  bike: "Bike",
  car: "Car",
  van: "Van",
};

// Mirrors the API's isValidPhone, so most mistakes are caught before sending.
function checkForm(form: CreateOrderInput): Field[] {
  const bad = (Object.keys(form) as Field[]).filter(
    (field) => form[field].trim() === "",
  );
  const digits = toWhatsAppNumber(form.customerPhone).length;
  if (!bad.includes("customerPhone") && (digits < 10 || digits > 15)) {
    bad.push("customerPhone");
  }
  return bad;
}

type RidersState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; riders: Rider[] };

// Design: "Vendor: Create Order", then "Vendor: Link Generated".
export default function CreateOrderFlow() {
  const [riders, setRiders] = useState<RidersState>({ kind: "loading" });
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Field[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<Order | null>(null);

  function loadRiders() {
    getRiders()
      .then((list) => setRiders({ kind: "ready", riders: list }))
      .catch(() => setRiders({ kind: "error" }));
  }

  useEffect(loadRiders, []);

  function update(field: Field, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((errs) => errs.filter((e) => e !== field));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const bad = checkForm(form);
    setFieldErrors(bad);
    if (bad.length > 0) return;

    setSubmitting(true);
    try {
      setCreated(await createOrder(form));
    } catch (err) {
      if (err instanceof ValidationError) {
        setFieldErrors(err.fields as Field[]);
        setSubmitError(err.message);
      } else {
        setSubmitError(
          "The order wasn't created. Check your connection and try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (created) return <LinkScreen order={created} />;

  const invalid = (field: Field) => fieldErrors.includes(field);
  const errorFor = (field: Field) =>
    invalid(field) ? (
      <p id={`${field}-error`} className="field-error">
        {FIELD_MESSAGES[field]}
      </p>
    ) : null;
  const a11y = (field: Field) => ({
    "aria-invalid": invalid(field),
    "aria-describedby": invalid(field) ? `${field}-error` : undefined,
  });

  const noRiders = riders.kind === "ready" && riders.riders.length === 0;

  return (
    <>
      <p className="eyebrow">New Order</p>
      <h1 className="h1">Create a delivery</h1>
      <p className="sub">
        Enter the customer&apos;s details below. We&apos;ll generate a link for
        them to confirm they&apos;re ready before any rider is sent out.
      </p>

      <form onSubmit={submit} noValidate className="card">
        <div className="row-2 field-group">
          <div>
            <Label htmlFor="customerName" icon={<PersonIcon />}>
              Customer name
            </Label>
            <input
              id="customerName"
              className="field"
              value={form.customerName}
              onChange={(e) => update("customerName", e.target.value)}
              placeholder="e.g. Amaka Obi"
              autoComplete="off"
              {...a11y("customerName")}
            />
            {errorFor("customerName")}
          </div>
          <div>
            <Label htmlFor="customerPhone" icon={<PhoneIcon />}>
              Phone number
            </Label>
            <input
              id="customerPhone"
              className="field"
              type="tel"
              inputMode="tel"
              value={form.customerPhone}
              onChange={(e) => update("customerPhone", e.target.value)}
              placeholder="e.g. 0803 214 7765"
              autoComplete="off"
              {...a11y("customerPhone")}
            />
            {errorFor("customerPhone")}
          </div>
        </div>

        <Label htmlFor="itemDescription" icon={<PackageIcon />}>
          What&apos;s being delivered
        </Label>
        <textarea
          id="itemDescription"
          className="field"
          rows={3}
          value={form.itemDescription}
          onChange={(e) => update("itemDescription", e.target.value)}
          placeholder="e.g. 2 bags of rice, 1 carton of drinks"
          {...a11y("itemDescription")}
        />
        {errorFor("itemDescription")}

        <Label htmlFor="riderId" icon={<RiderIcon />}>
          Assign a rider
        </Label>
        {riders.kind === "error" ? (
          <p className="field-error" style={{ margin: "0 0 22px" }}>
            We couldn&apos;t load your riders.{" "}
            <button
              type="button"
              onClick={() => {
                setRiders({ kind: "loading" });
                loadRiders();
              }}
              className="underline"
            >
              Try again
            </button>
          </p>
        ) : noRiders ? (
          <p className="sub" style={{ marginBottom: 22 }}>
            You don&apos;t have any riders yet. Add a rider before creating a
            delivery.
          </p>
        ) : (
          <select
            id="riderId"
            className="field"
            value={form.riderId}
            onChange={(e) => update("riderId", e.target.value)}
            disabled={riders.kind === "loading"}
            {...a11y("riderId")}
          >
            <option value="">
              {riders.kind === "loading" ? "Loading riders…" : "Choose a rider"}
            </option>
            {riders.kind === "ready" &&
              riders.riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.vehicle ? `${r.name} · ${VEHICLE_LABELS[r.vehicle]}` : r.name}
                </option>
              ))}
          </select>
        )}
        {errorFor("riderId")}

        <button
          type="submit"
          disabled={submitting || riders.kind !== "ready" || noRiders}
          className="btn btn-primary btn-block"
        >
          {submitting ? "Creating…" : "Create Order & Generate Link"}
        </button>
        {submitError && (
          <p className="mt-3 text-sm font-semibold text-danger" role="alert">
            {submitError}
          </p>
        )}
      </form>
    </>
  );
}

function Label({
  htmlFor,
  icon,
  children,
}: {
  htmlFor: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="field-label" htmlFor={htmlFor}>
      {icon}
      {children}
    </label>
  );
}

function LinkScreen({ order }: { order: Order }) {
  const link = customerLink(order.customerToken);
  const linkRef = useRef<HTMLDivElement>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">(
    "idle",
  );
  const firstName = order.customerName.split(/\s+/)[0];

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopyState("copied");
    } catch {
      // Clipboard blocked: select the link so the vendor can copy it by hand.
      const range = document.createRange();
      if (linkRef.current) range.selectNodeContents(linkRef.current);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      setCopyState("manual");
    }
  }

  return (
    <>
      <p className="eyebrow">Order #{order.orderNumber}</p>
      <h1 className="h1">Order created</h1>
      <p className="sub">
        Share this link with {firstName}. They&apos;ll confirm they&apos;re
        ready before any rider is sent.
      </p>

      <div className="card">
        <p className="field-label" id="customer-link-label">
          <LinkIcon />
          Customer confirmation link
        </p>
        <div
          className="linkbox"
          ref={linkRef}
          aria-labelledby="customer-link-label"
          data-testid="customer-link"
        >
          <LinkIcon className="shrink-0 opacity-70" />
          {link}
        </div>
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
        <Link href="/vendor" className="tag-back mt-4">
          <BackIcon />
          Back to Dashboard
        </Link>
      </div>
    </>
  );
}
