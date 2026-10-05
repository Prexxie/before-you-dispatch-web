"use client";

import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { FormEvent, useState } from "react";
import { ValidationError, googleSignIn, logIn } from "@/lib/api";
import PasswordField from "@/components/PasswordField";
import GoogleButton from "@/components/GoogleButton";
import { WELCOME_LOADING, WELCOME_TITLE } from "@/lib/brand";
import LogoLoader from "@/components/LogoLoader";
import { EMAIL_ERROR, isValidEmail } from "@/lib/validate";
import FieldError from "@/components/FieldError";
import { useLiveValidation } from "@/lib/useLiveValidation";

// Design: "Vendor: Log In". The Google button only appears when a Google
// client ID is configured.
// Adds ?welcome=1 so the page they land on keeps the same welcome loader up
// until its data has loaded.
function withWelcome(path: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}welcome=1`;
}

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The API's own "bad email" answer, if it gets that far.
  const [emailInvalid, setEmailInvalid] = useState(false);
  // Checked live: the email on blur then as they type; the password only
  // needs to be non-empty (log-in never applies the strong-password rule).
  const errors: Partial<Record<"email" | "password", string>> = {};
  if (!email.trim()) errors.email = "Enter your email address.";
  else if (!isValidEmail(email)) errors.email = EMAIL_ERROR;
  if (!password) errors.password = "Enter your password.";
  const live = useLiveValidation<"email" | "password">(errors);
  // The email belongs to an account made with Google, which has no password
  // yet: shown with the two ways forward (Google, or set a password).
  const [googleAccount, setGoogleAccount] = useState(false);
  // Google handed back a credential and we're signing them in; stays true
  // through the page navigation so the form never reappears.
  const [googleBusy, setGoogleBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setGoogleAccount(false);
    if (!live.validateAll()) return;
    setSubmitting(true);
    try {
      await logIn(email.trim(), password);
      // window.location, not router.push: a full navigation so the
      // just-set session cookie is there for the proxy's next check and
      // every page below reloads with a fresh, authenticated fetch.
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = withWelcome(next && next.startsWith("/vendor") ? next : "/vendor");
    } catch (err) {
      if (err instanceof ValidationError) {
        setGoogleAccount(err.code === "google_account");
        setEmailInvalid(err.fields.includes("email"));
        setError(err.message);
      } else {
        setError("Couldn't log in. Check your connection and try again.");
      }
      setSubmitting(false);
    }
  }

  async function onGoogle(credential: string) {
    setError(null);
    setGoogleBusy(true);
    try {
      const result = await googleSignIn(credential);
      if (result.status === "signed_in") {
          const next = new URLSearchParams(window.location.search).get("next");
        window.location.href = withWelcome(next && next.startsWith("/vendor") ? next : "/vendor");
        return;
      }
      // No account for this Google user yet: carry on to business details.
      sessionStorage.setItem(
        "bydGoogleSetup",
        JSON.stringify({ ticket: result.ticket, email: result.email, name: result.name }),
      );
      window.location.href = "/vendor/signup?google=1";
    } catch (err) {
      setError(
        err instanceof ValidationError
          ? err.message
          : "Couldn't sign in with Google. Check your connection and try again.",
      );
      setGoogleBusy(false);
    }
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Log in" }]} />
      <p className="eyebrow" style={{ textAlign: "center" }}>
        Welcome back
      </p>
      <p className="h1" style={{ textAlign: "center", fontSize: 24 }}>
        Log in to your workspace
      </p>

      {/* One loader from the moment they log in (or the Google popup closes)
          until the dashboard has loaded: the dashboard shows the same one
          while ?welcome=1 is on its address. */}
      {(submitting || googleBusy) && <LogoLoader page cover title={WELCOME_TITLE} label={WELCOME_LOADING} />}
      <form
        onSubmit={submit}
        noValidate
        className="card"
        style={{ marginTop: 20, display: googleBusy ? "none" : undefined }}
      >
        <GoogleButton onCredential={onGoogle} dividerText="OR LOG IN WITH EMAIL" text="continue_with" />
        <label className="field-label" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          className="field"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailInvalid(false);
          }}
          placeholder="you@business.com"
          onBlur={live.onBlur("email")}
          aria-invalid={emailInvalid || !!live.error("email")}
          aria-describedby={emailInvalid || live.error("email") ? "email-error" : undefined}
          required
        />
        <FieldError id="email" message={live.error("email") ?? (emailInvalid ? EMAIL_ERROR : undefined)} />

        <label className="field-label" htmlFor="password">
          Password
        </label>
        <PasswordField
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={live.onBlur("password")}
          aria-invalid={!!live.error("password")}
          aria-describedby={live.error("password") ? "password-error" : undefined}
          placeholder="••••••••"
          required
        />
        <FieldError id="password" message={live.error("password")} />
        <Link href="/vendor/forgot-password" className="forgot">
          Forgot password?
        </Link>

        <button type="submit" disabled={submitting} className="btn btn-primary btn-block">
          {submitting ? "Logging in…" : "Log In"}
        </button>
        {error && !emailInvalid && (
          <p className="mt-3 text-sm font-semibold text-danger" role="alert">
            {error}
            {googleAccount && (
              <span className="block font-medium text-ink-soft">
                Use the Google button above, or{" "}
                <Link href="/vendor/forgot-password" className="underline">
                  set a password
                </Link>{" "}
                to log in with your email too.
              </span>
            )}
          </p>
        )}
      </form>

      <p className="auth-foot">
        New here? <Link href="/vendor/signup">Create an account</Link>
      </p>
    </>
  );
}
