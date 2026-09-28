"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { SignUpInput, ValidationError, signUp } from "@/lib/api";

type Field = keyof SignUpInput;

const EMPTY_FORM: SignUpInput = {
  businessName: "",
  businessAddress: "",
  businessPhone: "",
  email: "",
  password: "",
};

// Design note: no riders page yet (week 2), so a new account starts with
// none to assign — the create-order form already explains that and points
// the vendor at needing a rider before their first delivery.
export default function SignupForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Field[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: Field, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((errs) => errs.filter((e) => e !== field));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signUp({
        ...form,
        businessAddress: form.businessAddress?.trim() || undefined,
        businessPhone: form.businessPhone?.trim() || undefined,
      });
      window.location.href = "/vendor";
    } catch (err) {
      if (err instanceof ValidationError) {
        setFieldErrors(err.fields as Field[]);
        setError(err.message);
      } else {
        setError("Couldn't create your account. Check your connection and try again.");
      }
      setSubmitting(false);
    }
  }

  const invalid = (field: Field) => fieldErrors.includes(field);

  return (
    <>
      <p className="eyebrow">Vendor</p>
      <h1 className="h1">Create your account</h1>
      <p className="sub">
        Your business details go on every link your customers and riders see.
      </p>

      <form onSubmit={submit} noValidate className="card">
        <label className="field-label" htmlFor="businessName">
          Business name
        </label>
        <input
          id="businessName"
          className="field"
          value={form.businessName}
          onChange={(e) => update("businessName", e.target.value)}
          placeholder="e.g. Precious Food Business"
          aria-invalid={invalid("businessName")}
          required
        />

        <label className="field-label" htmlFor="businessAddress">
          Business address (optional)
        </label>
        <input
          id="businessAddress"
          className="field"
          value={form.businessAddress}
          onChange={(e) => update("businessAddress", e.target.value)}
          placeholder="e.g. 12 Allen Avenue, Ikeja"
        />

        <label className="field-label" htmlFor="businessPhone">
          Business phone (optional)
        </label>
        <input
          id="businessPhone"
          className="field"
          type="tel"
          value={form.businessPhone}
          onChange={(e) => update("businessPhone", e.target.value)}
          placeholder="e.g. 0803 214 7765"
        />

        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="field"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="you@business.com"
          aria-invalid={invalid("email")}
          required
        />

        <label className="field-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="field"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          placeholder="At least 8 characters"
          aria-invalid={invalid("password")}
          required
        />

        <button type="submit" disabled={submitting} className="btn btn-primary btn-block">
          {submitting ? "Creating account…" : "Create account"}
        </button>
        {error && (
          <p className="mt-3 text-sm font-semibold text-danger" role="alert">
            {error}
          </p>
        )}
      </form>

      <p className="sub">
        Already have an account? <Link href="/vendor/login">Log in</Link>
      </p>
    </>
  );
}
