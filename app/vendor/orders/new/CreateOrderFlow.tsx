"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import {
  CreateOrderInput,
  Rider,
  ValidationError,
  Vehicle,
  createOrder,
  getRiders,
} from "@/lib/api";
import { useLiveValidation } from "@/lib/useLiveValidation";
import { PHONE_ERROR, isValidPhone } from "@/lib/validate";
import {
  PackageIcon,
  PersonIcon,
  PhoneIcon,
  RiderIcon,
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
  customerPhone: PHONE_ERROR,
  itemDescription: "Say what's being delivered.",
  riderId: "Choose a rider.",
};

const VEHICLE_LABELS: Record<Vehicle, string> = {
  bike: "Bike",
  car: "Car",
  van: "Van",
};

// Mirrors the API's checks, so most mistakes are caught before sending.
function checkForm(form: CreateOrderInput): Field[] {
  const bad = (Object.keys(form) as Field[]).filter(
    (field) => form[field].trim() === "",
  );
  if (!bad.includes("customerPhone") && !isValidPhone(form.customerPhone)) {
    bad.push("customerPhone");
  }
  return bad;
}

type RidersState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; riders: Rider[] };

// Design: "Vendor: Create Order". Creating the order opens its page, which
// shows "Vendor: Link Generated".
export default function CreateOrderFlow() {
  const router = useRouter();
  const [riders, setRiders] = useState<RidersState>({ kind: "loading" });
  const [form, setForm] = useState(EMPTY_FORM);
  // Fields the API rejected that the form's own checks passed; cleared when
  // that field is edited.
  const [serverFields, setServerFields] = useState<Field[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function loadRiders() {
    getRiders({ activeOnly: true })
      .then((list) => setRiders({ kind: "ready", riders: list }))
      .catch(() => setRiders({ kind: "error" }));
  }

  useEffect(loadRiders, []);

  function update(field: Field, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setServerFields((errs) => errs.filter((e) => e !== field));
  }

  // Errors show as each field is left, then update as the person types.
  const live = useLiveValidation<Field>(
    Object.fromEntries(checkForm(form).map((f) => [f, FIELD_MESSAGES[f]])),
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!live.validateAll()) return;

    setSubmitting(true);
    try {
      const order = await createOrder(form);
      // Stays "Creating…" while the order page loads, so it can't be sent twice.
      router.push(`/vendor/orders/${order.id}`);
    } catch (err) {
      if (err instanceof ValidationError) {
        setServerFields(err.fields as Field[]);
        setSubmitError(err.message);
      } else {
        setSubmitError(
          "The order wasn't created. Check your connection and try again.",
        );
      }
      setSubmitting(false);
    }
  }

  const invalid = (field: Field) => !!live.error(field) || serverFields.includes(field);
  const errorFor = (field: Field) =>
    invalid(field) ? (
      <p id={`${field}-error`} className="field-error">
        {FIELD_MESSAGES[field]}
      </p>
    ) : null;
  const a11y = (field: Field) => ({
    "aria-invalid": invalid(field),
    "aria-describedby": invalid(field) ? `${field}-error` : undefined,
    onBlur: live.onBlur(field),
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
            You don&apos;t have any riders yet.{" "}
            <Link href="/vendor/riders">Add a rider</Link> before creating a
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
