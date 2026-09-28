"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ValidationError, logIn } from "@/lib/api";

export default function LoginForm() {
  const router = useRouter();
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
      // just-set session cookie is there for middleware's next check and
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

  return (
    <>
      <p className="eyebrow">Vendor</p>
      <h1 className="h1">Log in</h1>
      <p className="sub">See and manage your deliveries.</p>

      <form onSubmit={submit} noValidate className="card">
        <label className="field-label" htmlFor="email">
          Email
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

        <button type="submit" disabled={submitting} className="btn btn-primary btn-block">
          {submitting ? "Logging in…" : "Log in"}
        </button>
        {error && (
          <p className="mt-3 text-sm font-semibold text-danger" role="alert">
            {error}
          </p>
        )}
      </form>

      <p className="sub">
        New here? <Link href="/vendor/signup">Create an account</Link>
      </p>
    </>
  );
}
