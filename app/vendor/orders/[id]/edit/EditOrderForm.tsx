"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import LogoLoader from "@/components/LogoLoader";
import { PackageIcon, PersonIcon, PhoneIcon } from "@/components/icons";
import {
  ConflictError,
  ValidationError,
  VendorOrder,
  getVendorOrder,
  updateOrderDetails,
} from "@/lib/api";
import { firstName } from "@/lib/links";
import { useLiveValidation } from "@/lib/useLiveValidation";
import { PHONE_ERROR, isValidPhone } from "@/lib/validate";

type Field = "customerName" | "customerPhone" | "itemDescription";
type Form = Record<Field, string>;

const FIELD_MESSAGES: Record<Field, string> = {
  customerName: "Enter the customer's name.",
  customerPhone: PHONE_ERROR,
  itemDescription: "Say what's being delivered.",
};

function checkForm(form: Form): Field[] {
  const bad = (Object.keys(form) as Field[]).filter((f) => form[f].trim() === "");
  if (!bad.includes("customerPhone") && !isValidPhone(form.customerPhone)) {
    bad.push("customerPhone");
  }
  return bad;
}

// Design: "Vendor: Edit Order Details". Only while the order is still awaiting
// the customer's answer; saving returns to the order page.
export default function EditOrderForm({ id }: { id: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<VendorOrder | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [form, setForm] = useState<Form>({
    customerName: "",
    customerPhone: "",
    itemDescription: "",
  });
  const [serverFields, setServerFields] = useState<Field[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getVendorOrder(id)
      .then((o) => {
        if (cancelled) return;
        setOrder(o);
        setForm({
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          itemDescription: o.itemDescription,
        });
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const live = useLiveValidation<Field>(
    Object.fromEntries(checkForm(form).map((f) => [f, FIELD_MESSAGES[f]])),
    form,
  );

  if (loadFailed) {
    return (
      <>
        <p className="eyebrow">Order</p>
        <h1 className="h1">We couldn&apos;t load this order</h1>
        <p className="sub">Check your connection, or go back to your dashboard.</p>
        <Link href="/vendor" className="tag-back">Back to Dashboard</Link>
      </>
    );
  }
  if (!order) return <LogoLoader label="Loading order…" page />;

  const customer = firstName(order.customerName);
  const locked = order.status !== "pending_confirmation";

  function update(field: Field, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setServerFields((errs) => errs.filter((e) => e !== field));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!live.validateAll()) return;
    setSubmitting(true);
    try {
      await updateOrderDetails(id, form);
      router.push(`/vendor/orders/${id}`);
    } catch (err) {
      if (err instanceof ValidationError) {
        setServerFields(err.fields as Field[]);
        setSubmitError(err.message);
      } else if (err instanceof ConflictError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Your changes weren't saved. Check your connection and try again.");
      }
      setSubmitting(false);
    }
  }

  const invalid = (f: Field) => !!live.error(f) || serverFields.includes(f);
  const errorFor = (f: Field) =>
    invalid(f) ? (
      <p id={`${f}-error`} className="field-error">
        {FIELD_MESSAGES[f]}
      </p>
    ) : null;
  const a11y = (f: Field) => ({
    "aria-invalid": invalid(f),
    "aria-describedby": invalid(f) ? `${f}-error` : undefined,
    onBlur: live.onBlur(f),
  });

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/vendor" },
          { label: `Order #${order.orderNumber}`, href: `/vendor/orders/${id}` },
          { label: "Edit details" },
        ]}
      />
      <p className="eyebrow">Order #{order.orderNumber}</p>
      <h1 className="h1">Edit order details</h1>
      {locked ? (
        <>
          <p className="sub">
            {customer} has already answered, so these details can&apos;t be
            changed now.
          </p>
          <Link href={`/vendor/orders/${id}`} className="tag-back">
            Back to order
          </Link>
        </>
      ) : (
        <>
          <p className="sub">
            Fix a mistake before {customer} answers. Changing the phone number
            creates a new link for the new number; the old link stops working.
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
              {...a11y("itemDescription")}
            />
            {errorFor("itemDescription")}
            {submitError && (
              <p className="field-error" role="alert" style={{ margin: "0 0 22px" }}>
                {submitError}
              </p>
            )}
            <div className="row-flex">
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? "Saving…" : "Save changes"}
              </button>
              <Link href={`/vendor/orders/${id}`} className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </>
      )}
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
