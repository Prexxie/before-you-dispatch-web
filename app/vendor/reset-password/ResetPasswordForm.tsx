"use client";

import Link from "next/link";
import { FormEvent, useState, useSyncExternalStore } from "react";
import { ValidationError, resetPassword } from "@/lib/api";

// No screen for this exists in the design; built in the style of Log In.
export default function ResetPasswordForm() {
  // The page is prerendered, so there's no query string on the server:
  // null there ("not read yet"), then the real value ("" if absent) on the
  // client.
  const token = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("token") ?? "",
    () => null,
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkDead, setLinkDead] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The two passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token ?? "", newPassword);
      setDone(true);
    } catch (err) {
      if (err instanceof ValidationError && err.fields.includes("token")) {
        setLinkDead(true);
      } else {
        setError(
          err instanceof ValidationError
            ? err.message
            : "Couldn't change your password. Check your connection and try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (token === null) return null;

  if (!token || linkDead) {
    return (
      <>
        <p className="eyebrow" style={{ textAlign: "center" }}>
          Reset password
        </p>
        <p className="h1" style={{ textAlign: "center", fontSize: 24 }}>
          This link isn&apos;t valid
        </p>
        <div className="card" style={{ marginTop: 20 }}>
          <p className="sub" style={{ marginBottom: 18 }}>
            Reset links work once and expire after an hour. Request a new one
            and use the latest email.
          </p>
          <Link href="/vendor/forgot-password" className="btn btn-primary btn-block">
            Request a new link
          </Link>
        </div>
      </>
    );
  }

  if (done) {
    return (
      <>
        <p className="eyebrow" style={{ textAlign: "center" }}>
          All set
        </p>
        <p className="h1" style={{ textAlign: "center", fontSize: 24 }}>
          Password updated
        </p>
        <div className="card" style={{ marginTop: 20 }}>
          <p className="sub" style={{ marginBottom: 18 }}>
            You can log in with your new password now.
          </p>
          <Link href="/vendor/login" className="btn btn-primary btn-block">
            Log In
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="eyebrow" style={{ textAlign: "center" }}>
        Reset password
      </p>
      <p className="h1" style={{ textAlign: "center", fontSize: 24 }}>
        Choose a new password
      </p>

      <form onSubmit={submit} noValidate className="card" style={{ marginTop: 20 }}>
        <label className="field-label" htmlFor="newPassword">
          New password
        </label>
        <input
          id="newPassword"
          className="field"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
        />
        <label className="field-label" htmlFor="confirmPassword">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          className="field"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={submitting} className="btn btn-primary btn-block">
          {submitting ? "Saving…" : "Save New Password"}
        </button>
        {error && (
          <p className="mt-3 text-sm font-semibold text-danger" role="alert">
            {error}
          </p>
        )}
      </form>
    </>
  );
}
