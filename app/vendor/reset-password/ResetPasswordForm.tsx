"use client";

import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { FormEvent, useState, useSyncExternalStore } from "react";
import { ValidationError, resetPassword } from "@/lib/api";
import FieldError from "@/components/FieldError";
import { useLiveValidation } from "@/lib/useLiveValidation";
import PasswordField from "@/components/PasswordField";
import PasswordRules from "@/components/PasswordRules";
import { PASSWORD_ERROR, isStrongPassword } from "@/lib/validate";

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
  const errors: Partial<Record<"newPassword" | "confirmPassword", string>> = {};
  if (!isStrongPassword(newPassword)) errors.newPassword = PASSWORD_ERROR;
  if (!confirmPassword) errors.confirmPassword = "Type the new password again.";
  else if (newPassword !== confirmPassword) errors.confirmPassword = "The two passwords don't match.";
  const live = useLiveValidation<"newPassword" | "confirmPassword">(errors);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!live.validateAll()) return;
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
        <Breadcrumbs items={[{ label: "Log in", href: "/vendor/login" }, { label: "Reset password" }]} />
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
        <Breadcrumbs items={[{ label: "Log in", href: "/vendor/login" }, { label: "Reset password" }]} />
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
      <Breadcrumbs items={[{ label: "Log in", href: "/vendor/login" }, { label: "Reset password" }]} />
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
        <PasswordField
          id="newPassword"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          onBlur={live.onBlur("newPassword")}
          aria-invalid={!!live.error("newPassword")}
          placeholder="Create a strong password"
          required
        />
        <PasswordRules password={newPassword} />
        <label className="field-label" htmlFor="confirmPassword">
          Confirm new password
        </label>
        <PasswordField
          id="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={live.onBlur("confirmPassword")}
          aria-invalid={!!live.error("confirmPassword")}
          aria-describedby={live.error("confirmPassword") ? "confirmPassword-error" : undefined}
          required
        />
        <FieldError id="confirmPassword" message={live.error("confirmPassword")} />
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
