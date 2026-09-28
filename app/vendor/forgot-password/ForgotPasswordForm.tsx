"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ValidationError, requestPasswordReset } from "@/lib/api";

// No screen for this exists in the design; built in the style of Log In.
export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      setError(
        err instanceof ValidationError
          ? err.message
          : "Couldn't send the link. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sentTo) {
    return (
      <>
        <p className="eyebrow" style={{ textAlign: "center" }}>
          Check your email
        </p>
        <p className="h1" style={{ textAlign: "center", fontSize: 24 }}>
          Reset link sent
        </p>
        <div className="card" style={{ marginTop: 20 }}>
          <p className="sub" style={{ marginBottom: 18 }}>
            If <strong>{sentTo}</strong> has an account, a link to choose a new
            password is on its way. It works once and expires in an hour.
          </p>
          <p className="sub" style={{ marginBottom: 0 }}>
            Nothing there? Check your spam folder, or{" "}
            <button type="button" onClick={() => setSentTo(null)} className="underline">
              try a different email
            </button>
            .
          </p>
        </div>
        <p className="auth-foot">
          <Link href="/vendor/login">Back to log in</Link>
        </p>
      </>
    );
  }

  return (
    <>
      <p className="eyebrow" style={{ textAlign: "center" }}>
        Reset password
      </p>
      <p className="h1" style={{ textAlign: "center", fontSize: 24 }}>
        Forgot your password?
      </p>

      <form onSubmit={submit} noValidate className="card" style={{ marginTop: 20 }}>
        <p className="sub" style={{ marginBottom: 18 }}>
          Enter the email you signed up with and we&apos;ll send you a link to
          choose a new one.
        </p>
        <label className="field-label" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          className="field"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@business.com"
          required
        />
        <button type="submit" disabled={submitting} className="btn btn-primary btn-block">
          {submitting ? "Sending…" : "Send Reset Link"}
        </button>
        {error && (
          <p className="mt-3 text-sm font-semibold text-danger" role="alert">
            {error}
          </p>
        )}
      </form>

      <p className="auth-foot">
        <Link href="/vendor/login">Back to log in</Link>
      </p>
    </>
  );
}
