"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import {
  SignUpInput,
  VENDOR_CATEGORY_LABELS,
  ValidationError,
  VendorCategory,
  googleSignIn,
  googleSignUp,
  signUp,
} from "@/lib/api";
import GoogleButton from "@/components/GoogleButton";
import LogoPicker from "@/components/LogoPicker";

// A Google user who has no account yet: what the API verified about them,
// carried to the business-details step.
type GoogleSetup = { ticket: string; email: string; name: string };

type AccountFields = Omit<SignUpInput, "businessAddress" | "businessPhone" | "logoDataUrl">;
type Field = keyof AccountFields;

const EMPTY_ACCOUNT: AccountFields = {
  businessName: "",
  ownerName: "",
  category: "",
  email: "",
  password: "",
};

// Design: "Vendor: Sign Up" then "Vendor: Set Up Workspace" — two screens,
// account details first, then a recap plus the business address and logo.
// The account isn't created until the second step's "Continue to
// Dashboard", so nothing is sent to the API until both are filled in. The
// mockup's "Continue with Google" is shown when a Google client ID is
// configured; a brand-new Google user skips the password form and goes
// straight to their business details (GoogleSetupStep).
export default function SignupForm() {
  const [step, setStep] = useState<"account" | "workspace">("account");
  const [account, setAccount] = useState(EMPTY_ACCOUNT);
  // Set when the final submit (on the workspace step) fails on something
  // the account step owns, e.g. a duplicate email — carried across the step
  // change so it isn't lost when WorkspaceStep unmounts.
  const [returnError, setReturnError] = useState<string | null>(null);
  const [google, setGoogle] = useState<GoogleSetup | null>(null);
  const [dismissedSaved, setDismissedSaved] = useState(false);

  // Arriving from the login page's Google button with no account yet: the
  // setup was parked in sessionStorage. Read it without setting state in an
  // effect; null on the server and while storage is unavailable.
  const saved = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return sessionStorage.getItem("bydGoogleSetup");
      } catch {
        return null;
      }
    },
    () => null,
  );
  const fromLogin = useMemo<GoogleSetup | null>(() => {
    if (!saved || dismissedSaved) return null;
    try {
      return JSON.parse(saved) as GoogleSetup;
    } catch {
      return null;
    }
  }, [saved, dismissedSaved]);
  const activeGoogle = google ?? fromLogin;

  function leaveGoogle() {
    try {
      sessionStorage.removeItem("bydGoogleSetup");
    } catch {
      // nothing to clear
    }
    setGoogle(null);
    setDismissedSaved(true);
  }

  if (activeGoogle) {
    return <GoogleSetupStep setup={activeGoogle} onBack={leaveGoogle} />;
  }
  if (step === "workspace") {
    return (
      <WorkspaceStep
        account={account}
        onBack={(error) => {
          setReturnError(error ?? null);
          setStep("account");
        }}
      />
    );
  }
  return (
    <AccountStep
      initial={account}
      initialError={returnError}
      onGoogle={setGoogle}
      onNext={(next) => {
        setAccount(next);
        setReturnError(null);
        setStep("workspace");
      }}
    />
  );
}

function AccountStep({
  initial,
  initialError,
  onGoogle,
  onNext,
}: {
  initial: AccountFields;
  initialError: string | null;
  onGoogle: (setup: GoogleSetup) => void;
  onNext: (account: AccountFields) => void;
}) {
  const [form, setForm] = useState(initial);
  const [fieldErrors, setFieldErrors] = useState<Field[]>([]);
  const [error, setError] = useState<string | null>(initialError);

  function update(field: Field, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((errs) => errs.filter((e) => e !== field));
  }

  // Client-side only — the same checks the API makes, so a typo doesn't
  // cost a trip to the second step and back. The API still validates for
  // real when the account is actually created.
  function checkForm(): Field[] {
    const bad: Field[] = [];
    if (!form.businessName.trim()) bad.push("businessName");
    if (!form.ownerName.trim()) bad.push("ownerName");
    if (!form.category) bad.push("category");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) bad.push("email");
    if (form.password.length < 8) bad.push("password");
    return bad;
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const bad = checkForm();
    setFieldErrors(bad);
    if (bad.length > 0) {
      setError("Check the fields marked below.");
      return;
    }
    onNext(form);
  }

  const invalid = (field: Field) => fieldErrors.includes(field);

  async function handleGoogle(credential: string) {
    setError(null);
    try {
      const result = await googleSignIn(credential);
      if (result.status === "signed_in") {
        // They already had an account: just sign them in.
        window.location.href = "/vendor";
        return;
      }
      onGoogle({ ticket: result.ticket, email: result.email, name: result.name });
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
        Create your business account
      </p>
      <p className="h1" style={{ textAlign: "center", fontSize: 24 }}>
        Create your account
      </p>

      <form onSubmit={submit} noValidate className="card" style={{ marginTop: 20 }}>
        <GoogleButton onCredential={handleGoogle} dividerText="OR SIGN UP WITH EMAIL" text="signup_with" />
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

        <label className="field-label" htmlFor="ownerName">
          Your full name
        </label>
        <input
          id="ownerName"
          className="field"
          value={form.ownerName}
          onChange={(e) => update("ownerName", e.target.value)}
          placeholder="e.g. Chuka Eze"
          aria-invalid={invalid("ownerName")}
          required
        />

        <label className="field-label" htmlFor="email">
          Email address
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

        <label className="field-label" htmlFor="category">
          What do you sell?
        </label>
        <select
          id="category"
          className="field"
          value={form.category}
          onChange={(e) => update("category", e.target.value)}
          aria-invalid={invalid("category")}
          required
        >
          <option value="" disabled>
            Choose a category
          </option>
          {Object.entries(VENDOR_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <button type="submit" className="btn btn-primary btn-block">
          Create Account
        </button>
        {error && (
          <p className="mt-3 text-sm font-semibold text-danger" role="alert">
            {error}
          </p>
        )}
      </form>

      <p className="auth-foot">
        Already have an account? <Link href="/vendor/login">Log in</Link>
      </p>
    </>
  );
}

function WorkspaceStep({
  account,
  onBack,
}: {
  account: AccountFields;
  onBack: (error?: string) => void;
}) {
  const [businessAddress, setBusinessAddress] = useState("");
  const [addressError, setAddressError] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const address = businessAddress.trim();
    setAddressError(!address);
    if (!address) {
      setError("Enter your business address.");
      return;
    }
    setSubmitting(true);
    try {
      await signUp({
        ...account,
        businessAddress: address,
        logoDataUrl: logoDataUrl ?? undefined,
      });
      window.location.href = "/vendor";
    } catch (err) {
      if (err instanceof ValidationError) {
        // A field the account step already checked (e.g. a duplicate
        // email) needs fixing back on that step, not this one.
        onBack(err.message);
      } else {
        setError("Couldn't create your account. Check your connection and try again.");
        setSubmitting(false);
      }
    }
  }

  return (
    <>
      <p className="eyebrow" style={{ textAlign: "center" }}>
        Step 2 of 2
      </p>
      <p className="h1" style={{ textAlign: "center", fontSize: 24 }}>
        Set up your workspace
      </p>
      <p className="sub" style={{ textAlign: "center" }}>
        This is what your customers and riders will see on their confirmation
        messages.
      </p>

      <form onSubmit={submit} noValidate className="card" style={{ marginTop: 8 }}>
        <LogoPicker value={logoDataUrl} onChange={setLogoDataUrl} />

        <div className="readonly-row">
          <span className="readonly-label">BUSINESS NAME</span>
          <span className="readonly-val">{account.businessName}</span>
        </div>
        <div className="readonly-row">
          <span className="readonly-label">WHAT YOU SELL</span>
          <span className="readonly-val">
            {VENDOR_CATEGORY_LABELS[account.category as VendorCategory]}
          </span>
        </div>
        <div className="readonly-row">
          <span className="readonly-label">OWNER</span>
          <span className="readonly-val">{account.ownerName}</span>
        </div>

        <label className="field-label" htmlFor="businessAddress">
          Business address
        </label>
        <input
          id="businessAddress"
          className="field"
          value={businessAddress}
          onChange={(e) => {
            setBusinessAddress(e.target.value);
            setAddressError(false);
          }}
          placeholder="e.g. 12 Allen Avenue, Ikeja"
          aria-invalid={addressError}
          required
        />

        <button type="submit" disabled={submitting} className="btn btn-primary btn-block">
          {submitting ? "Creating account…" : "Continue to Dashboard"}
        </button>
        {error && (
          <p className="mt-3 text-sm font-semibold text-danger" role="alert">
            {error}
          </p>
        )}
      </form>

      <p className="auth-foot">
        <button type="button" onClick={() => onBack()} className="underline">
          Back
        </button>
      </p>
    </>
  );
}

// A new Google user: Google already gave us the email and (usually) a name,
// so this is one screen of business details instead of the two-step form.
// No mockup exists for it; it reuses the Set Up Workspace styling.
function GoogleSetupStep({ setup, onBack }: { setup: GoogleSetup; onBack: () => void }) {
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState(setup.name);
  const [category, setCategory] = useState<VendorCategory | "">("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const bad: string[] = [];
    if (!businessName.trim()) bad.push("businessName");
    if (!ownerName.trim()) bad.push("ownerName");
    if (!category) bad.push("category");
    if (!businessAddress.trim()) bad.push("businessAddress");
    setFieldErrors(bad);
    if (bad.length > 0) {
      setError("Check the fields marked below.");
      return;
    }
    setSubmitting(true);
    try {
      await googleSignUp({
        ticket: setup.ticket,
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        category,
        businessAddress: businessAddress.trim(),
        logoDataUrl: logoDataUrl ?? undefined,
      });
      window.location.href = "/vendor";
    } catch (err) {
      if (err instanceof ValidationError && err.fields.includes("ticket")) {
        setExpired(true);
      } else {
        setError(
          err instanceof ValidationError
            ? err.message
            : "Couldn't create your account. Check your connection and try again.",
        );
      }
      setSubmitting(false);
    }
  }

  const invalid = (f: string) => fieldErrors.includes(f);

  if (expired) {
    return (
      <>
        <p className="eyebrow" style={{ textAlign: "center" }}>
          Google sign-in
        </p>
        <p className="h1" style={{ textAlign: "center", fontSize: 24 }}>
          That took too long
        </p>
        <div className="card" style={{ marginTop: 20 }}>
          <p className="sub" style={{ marginBottom: 18 }}>
            For your security the Google sign-in expired before you finished.
            Start again.
          </p>
          <button type="button" onClick={onBack} className="btn btn-primary btn-block">
            Start again
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="eyebrow" style={{ textAlign: "center" }}>
        Almost there
      </p>
      <p className="h1" style={{ textAlign: "center", fontSize: 24 }}>
        Set up your workspace
      </p>
      <p className="sub" style={{ textAlign: "center" }}>
        You&apos;re signing up with Google as <strong>{setup.email}</strong>. Tell
        us about your business.
      </p>

      <form onSubmit={submit} noValidate className="card" style={{ marginTop: 8 }}>
        <LogoPicker value={logoDataUrl} onChange={setLogoDataUrl} />

        <label className="field-label" htmlFor="gBusinessName">
          Business name
        </label>
        <input
          id="gBusinessName"
          className="field"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="e.g. Precious Food Business"
          aria-invalid={invalid("businessName")}
          required
        />

        <label className="field-label" htmlFor="gOwnerName">
          Your full name
        </label>
        <input
          id="gOwnerName"
          className="field"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          aria-invalid={invalid("ownerName")}
          required
        />

        <label className="field-label" htmlFor="gCategory">
          What do you sell?
        </label>
        <select
          id="gCategory"
          className="field"
          value={category}
          onChange={(e) => setCategory(e.target.value as VendorCategory)}
          aria-invalid={invalid("category")}
          required
        >
          <option value="" disabled>
            Choose a category
          </option>
          {Object.entries(VENDOR_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <label className="field-label" htmlFor="gBusinessAddress">
          Business address
        </label>
        <input
          id="gBusinessAddress"
          className="field"
          value={businessAddress}
          onChange={(e) => setBusinessAddress(e.target.value)}
          placeholder="e.g. 12 Allen Avenue, Ikeja"
          aria-invalid={invalid("businessAddress")}
          required
        />

        <button type="submit" disabled={submitting} className="btn btn-primary btn-block">
          {submitting ? "Creating account…" : "Continue to Dashboard"}
        </button>
        {error && (
          <p className="mt-3 text-sm font-semibold text-danger" role="alert">
            {error}
          </p>
        )}
      </form>

      <p className="auth-foot">
        <button type="button" onClick={onBack} className="underline">
          Use a different account
        </button>
      </p>
    </>
  );
}
