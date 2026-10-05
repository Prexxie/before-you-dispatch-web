"use client";

import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import {
  SignUpInput,
  ValidationError,
  VendorCategory,
  categoryLabel,
  googleSignIn,
  googleSignUp,
  signUp,
} from "@/lib/api";
import GoogleButton, { GoogleProgress } from "@/components/GoogleButton";
import LogoPicker from "@/components/LogoPicker";
import CategoryField from "@/components/CategoryField";
import { EMAIL_ERROR, PASSWORD_ERROR, isStrongPassword, isValidEmail } from "@/lib/validate";
import FieldError from "@/components/FieldError";
import { useLiveValidation } from "@/lib/useLiveValidation";
import PasswordField from "@/components/PasswordField";
import PasswordRules from "@/components/PasswordRules";
import LogoLoader from "@/components/LogoLoader";

// A Google user who has no account yet: what the API verified about them,
// carried to the business-details step.
type GoogleSetup = { ticket: string; email: string; name: string };

type AccountFields = Omit<SignUpInput, "businessAddress" | "businessPhone" | "logoDataUrl"> & {
  categoryOther: string;
};
type Field = keyof AccountFields;

const EMPTY_ACCOUNT: AccountFields = {
  businessName: "",
  ownerName: "",
  category: "",
  categoryOther: "",
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
export default function SignupForm({ fromGoogle = false }: { fromGoogle?: boolean }) {
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
  // false in the server-rendered HTML and until the browser takes over, when
  // the parked Google details can first be read.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
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

  // Sent here by Google sign-in: don't paint the first screen for a moment
  // before switching to the business-details step.
  if (fromGoogle && !hydrated) {
    return <GoogleProgress />;
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
  const [error, setError] = useState<string | null>(initialError);
  const [googleBusy, setGoogleBusy] = useState(false);

  function update(field: Field, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Client-side only — the same checks the API makes, so a typo doesn't
  // cost a trip to the second step and back. The API still validates for
  // real when the account is actually created. Errors show as the person
  // leaves each field and then update as they type (useLiveValidation).
  const errors: Partial<Record<Field, string>> = {};
  if (!form.businessName.trim()) errors.businessName = "Enter your business name.";
  if (!form.ownerName.trim()) errors.ownerName = "Enter your full name.";
  if (!form.category) errors.category = "Choose what kind of business you run.";
  if (form.category === "other" && !form.categoryOther.trim()) {
    errors.categoryOther = "Tell us your business type.";
  }
  if (!form.email.trim()) errors.email = "Enter your email address.";
  else if (!isValidEmail(form.email)) errors.email = EMAIL_ERROR;
  if (!isStrongPassword(form.password)) errors.password = PASSWORD_ERROR;
  const live = useLiveValidation<Field>(errors);

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!live.validateAll()) return;
    onNext(form);
  }

  async function handleGoogle(credential: string) {
    setError(null);
    setGoogleBusy(true);
    try {
      const result = await googleSignIn(credential);
      if (result.status === "signed_in") {
        // They already had an account: just sign them in.
        window.location.href = "/vendor?welcome=1";
        return;
      }
      onGoogle({ ticket: result.ticket, email: result.email, name: result.name });
    } catch (err) {
      setGoogleBusy(false);
      setError(
        err instanceof ValidationError
          ? err.message
          : "Couldn't sign in with Google. Check your connection and try again.",
      );
    }
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Sign up" }]} />
      <p className="eyebrow" style={{ textAlign: "center" }}>
        Create your business account
      </p>
      <p className="h1" style={{ textAlign: "center", fontSize: 24 }}>
        Create your account
      </p>

      {googleBusy && <GoogleProgress />}
      <form
        onSubmit={submit}
        noValidate
        className="card"
        style={{ marginTop: 20, display: googleBusy ? "none" : undefined }}
      >
        <GoogleButton onCredential={handleGoogle} dividerText="OR SIGN UP WITH EMAIL" text="signup_with" />
        <label className="field-label" htmlFor="businessName">
          Business name
        </label>
        <input
          id="businessName"
          className="field"
          value={form.businessName}
          onChange={(e) => update("businessName", e.target.value)}
          onBlur={live.onBlur("businessName")}
          placeholder="e.g. Precious Food Business"
          aria-invalid={!!live.error("businessName")}
          aria-describedby={live.error("businessName") ? "businessName-error" : undefined}
          required
        />
        <FieldError id="businessName" message={live.error("businessName")} />

        <label className="field-label" htmlFor="ownerName">
          Your full name
        </label>
        <input
          id="ownerName"
          className="field"
          value={form.ownerName}
          onChange={(e) => update("ownerName", e.target.value)}
          onBlur={live.onBlur("ownerName")}
          placeholder="e.g. Chuka Eze"
          aria-invalid={!!live.error("ownerName")}
          aria-describedby={live.error("ownerName") ? "ownerName-error" : undefined}
          required
        />
        <FieldError id="ownerName" message={live.error("ownerName")} />

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
          onBlur={live.onBlur("email")}
          placeholder="you@business.com"
          aria-invalid={!!live.error("email")}
          aria-describedby={live.error("email") ? "email-error" : undefined}
          required
        />
        <FieldError id="email" message={live.error("email")} />

        <label className="field-label" htmlFor="password">
          Password
        </label>
        <PasswordField
          id="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          onBlur={live.onBlur("password")}
          placeholder="Create a strong password"
          aria-invalid={!!live.error("password")}
          required
        />
        <PasswordRules password={form.password} />

        <CategoryField
          category={form.category}
          categoryOther={form.categoryOther}
          onCategory={(c) => {
            update("category", c);
            update("categoryOther", "");
          }}
          onCategoryOther={(t) => update("categoryOther", t)}
          categoryError={live.error("category")}
          otherError={live.error("categoryOther")}
          onBlurCategory={live.onBlur("category")}
          onBlurOther={live.onBlur("categoryOther")}
        />

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
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const live = useLiveValidation<"businessAddress">({
    businessAddress: businessAddress.trim() ? undefined : "Enter your business address.",
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!live.validateAll()) return;
    const address = businessAddress.trim();
    setSubmitting(true);
    try {
      await signUp({
        ...account,
        businessAddress: address,
        logoDataUrl: logoDataUrl ?? undefined,
      });
      window.location.href = "/vendor?welcome=1";
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
      <Breadcrumbs items={[{ label: "Sign up", onClick: () => onBack() }, { label: "Set up workspace" }]} />
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
          <span className="readonly-label">BUSINESS TYPE</span>
          <span className="readonly-val">
            {categoryLabel({
              category: account.category as VendorCategory,
              categoryOther: account.categoryOther,
            })}
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
          onChange={(e) => setBusinessAddress(e.target.value)}
          onBlur={live.onBlur("businessAddress")}
          placeholder="e.g. 12 Allen Avenue, Ikeja"
          aria-invalid={!!live.error("businessAddress")}
          aria-describedby={live.error("businessAddress") ? "businessAddress-error" : undefined}
          required
        />
        <FieldError id="businessAddress" message={live.error("businessAddress")} />

        {submitting && <LogoLoader page cover label="Creating your account…" />}
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
  const [categoryOther, setCategoryOther] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  type GField = "businessName" | "ownerName" | "category" | "categoryOther" | "businessAddress";
  const errors: Partial<Record<GField, string>> = {};
  if (!businessName.trim()) errors.businessName = "Enter your business name.";
  if (!ownerName.trim()) errors.ownerName = "Enter your full name.";
  if (!category) errors.category = "Choose what kind of business you run.";
  if (category === "other" && !categoryOther.trim()) errors.categoryOther = "Tell us your business type.";
  if (!businessAddress.trim()) errors.businessAddress = "Enter your business address.";
  const live = useLiveValidation<GField>(errors);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!live.validateAll()) return;
    setSubmitting(true);
    try {
      await googleSignUp({
        ticket: setup.ticket,
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        category,
        categoryOther: category === "other" ? categoryOther.trim() : undefined,
        businessAddress: businessAddress.trim(),
        logoDataUrl: logoDataUrl ?? undefined,
      });
      window.location.href = "/vendor?welcome=1";
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

  if (expired) {
    return (
      <>
        <Breadcrumbs items={[{ label: "Sign up", onClick: onBack }, { label: "Business details" }]} />
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
      <Breadcrumbs items={[{ label: "Sign up", onClick: onBack }, { label: "Business details" }]} />
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
          onBlur={live.onBlur("businessName")}
          placeholder="e.g. Precious Food Business"
          aria-invalid={!!live.error("businessName")}
          aria-describedby={live.error("businessName") ? "gBusinessName-error" : undefined}
          required
        />
        <FieldError id="gBusinessName" message={live.error("businessName")} />

        <label className="field-label" htmlFor="gOwnerName">
          Your full name
        </label>
        <input
          id="gOwnerName"
          className="field"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          onBlur={live.onBlur("ownerName")}
          aria-invalid={!!live.error("ownerName")}
          aria-describedby={live.error("ownerName") ? "gOwnerName-error" : undefined}
          required
        />
        <FieldError id="gOwnerName" message={live.error("ownerName")} />

        <CategoryField
          idPrefix="g"
          category={category}
          categoryOther={categoryOther}
          onCategory={(c) => {
            setCategory(c);
            setCategoryOther("");
          }}
          onCategoryOther={setCategoryOther}
          categoryError={live.error("category")}
          otherError={live.error("categoryOther")}
          onBlurCategory={live.onBlur("category")}
          onBlurOther={live.onBlur("categoryOther")}
        />

        <label className="field-label" htmlFor="gBusinessAddress">
          Business address
        </label>
        <input
          id="gBusinessAddress"
          className="field"
          value={businessAddress}
          onChange={(e) => setBusinessAddress(e.target.value)}
          onBlur={live.onBlur("businessAddress")}
          placeholder="e.g. 12 Allen Avenue, Ikeja"
          aria-invalid={!!live.error("businessAddress")}
          aria-describedby={live.error("businessAddress") ? "gBusinessAddress-error" : undefined}
          required
        />
        <FieldError id="gBusinessAddress" message={live.error("businessAddress")} />

        {submitting && <LogoLoader page cover label="Creating your account…" />}
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
