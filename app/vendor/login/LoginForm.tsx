"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ValidationError, googleSignIn, logIn } from "@/lib/api";
import GoogleButton from "@/components/GoogleButton";

// Design: "Vendor: Log In". The Google button only appears when a Google
// client ID is configured.
export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await logIn(email.trim(), password);
      // window.location, not router.push: a full navigation so the
      // just-set session cookie is there for the proxy's next check and
      // every page below reloads with a fresh, authenticated fetch.
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && next.startsWith("/vendor") ? next : "/vendor";
    } catch (err) {
      setError(
        err instanceof ValidationError
          ? err.message
          : "Couldn't log in. Check your connection and try again.",
      );
      setSubmitting(false);
    }
  }

  async function onGoogle(credential: string) {
    setError(null);
    try {
      const result = await googleSignIn(credential);
      if (result.status === "signed_in") {
        const next = new URLSearchParams(window.location.search).get("next");
        window.location.href = next && next.startsWith("/vendor") ? next : "/vendor";
        return;
      }
      // No account for this Google user yet: carry on to business details.
      sessionStorage.setItem(
        "bydGoogleSetup",
        JSON.stringify({ ticket: result.ticket, email: result.email, name: result.name }),
      );
      window.location.href = "/vendor/signup";
    } catch (err) {
      setError(
        err instanceof ValidationError
          ? err.message
          : "Couldn't sign in with Google. Check your connection and try again.",
      );
    }
  }

  return (
    <>
      <p className="eyebrow" style={{ textAlign: "center" }}>
        Welcome back
      </p>
      <p className="h1" style={{ textAlign: "center", fontSize: 24 }}>
        Log in to your workspace
      </p>

      <form onSubmit={submit} noValidate className="card" style={{ marginTop: 20 }}>
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
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@business.com"
          required
        />

        <label className="field-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="field"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        <Link href="/vendor/forgot-password" className="forgot">
          Forgot password?
        </Link>

        <button type="submit" disabled={submitting} className="btn btn-primary btn-block">
          {submitting ? "Logging in…" : "Log In"}
        </button>
        {error && (
          <p className="mt-3 text-sm font-semibold text-danger" role="alert">
            {error}
          </p>
        )}
      </form>

      <p className="auth-foot">
        New here? <Link href="/vendor/signup">Create an account</Link>
      </p>
    </>
  );
}
