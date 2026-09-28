"use client";

import { FormEvent, useState } from "react";
import {
  UpdateVendorInput,
  VENDOR_CATEGORY_LABELS,
  ValidationError,
  Vendor,
  VendorCategory,
  changePassword,
  getMe,
  updateVendorProfile,
} from "@/lib/api";
import { useLiveData } from "@/lib/useLiveData";
import LogoPicker from "@/components/LogoPicker";
import AppShell from "@/components/AppShell";

// Design: "Vendor: Settings". The mockup shows both cards read-only with an
// "Edit Profile" / "Change Password" button but no edit form itself — those
// are built here following the same field set and styling as sign up.
export default function SettingsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [state] = useLiveData(() => getMe(), `settings-${refreshKey}`);
  const vendor = state.kind === "ready" ? state.data : null;

  function reload() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <AppShell active="settings" title="Settings" businessName={vendor?.businessName ?? null}>
      <p className="eyebrow">Workspace</p>
      <h1 className="h1">Settings</h1>
      <p className="sub">Manage your business profile and your account.</p>

      {state.kind === "loading" && <p className="sub">Loading…</p>}
      {state.kind === "error" && (
        <p className="sub" role="alert">
          We couldn&apos;t load your settings. Check your connection.
        </p>
      )}

      {vendor && (
        <div className="settings-grid">
          <ProfileCard vendor={vendor} onSaved={reload} />
          <AccountCard vendor={vendor} />
        </div>
      )}
    </AppShell>
  );
}

function ProfileCard({ vendor, onSaved }: { vendor: Vendor; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <ProfileEditForm
        vendor={vendor}
        onCancel={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          onSaved();
        }}
      />
    );
  }

  return (
    <div className="card">
      <p className="h2" style={{ fontSize: 16 }}>
        Business profile
      </p>
      <div className="readonly-row">
        <span className="readonly-label">BUSINESS NAME</span>
        <span className="readonly-val">{vendor.businessName}</span>
      </div>
      <div className="readonly-row">
        <span className="readonly-label">OWNER</span>
        <span className="readonly-val">{vendor.ownerName}</span>
      </div>
      <div className="readonly-row">
        <span className="readonly-label">WHAT YOU SELL</span>
        <span className="readonly-val">{VENDOR_CATEGORY_LABELS[vendor.category]}</span>
      </div>
      <div className="readonly-row">
        <span className="readonly-label">ADDRESS</span>
        <span className="readonly-val">{vendor.businessAddress}</span>
      </div>
      <div className="readonly-row">
        <span className="readonly-label">PHONE</span>
        <span className="readonly-val">{vendor.businessPhone ?? "Not set"}</span>
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="btn btn-secondary"
        style={{ marginTop: 14 }}
      >
        Edit Profile
      </button>
    </div>
  );
}

type ProfileFormFields = "businessName" | "ownerName" | "businessAddress";

function ProfileEditForm({
  vendor,
  onCancel,
  onSaved,
}: {
  vendor: Vendor;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [businessName, setBusinessName] = useState(vendor.businessName);
  const [ownerName, setOwnerName] = useState(vendor.ownerName);
  const [category, setCategory] = useState<VendorCategory>(vendor.category);
  const [businessAddress, setBusinessAddress] = useState(vendor.businessAddress);
  const [businessPhone, setBusinessPhone] = useState(vendor.businessPhone ?? "");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(vendor.logoUrl);
  const [fieldErrors, setFieldErrors] = useState<ProfileFormFields[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const bad: ProfileFormFields[] = [];
    if (!businessName.trim()) bad.push("businessName");
    if (!ownerName.trim()) bad.push("ownerName");
    if (!businessAddress.trim()) bad.push("businessAddress");
    setFieldErrors(bad);
    if (bad.length > 0) {
      setError("Check the fields marked below.");
      return;
    }

    setSubmitting(true);
    try {
      const input: UpdateVendorInput = {
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        category,
        businessAddress: businessAddress.trim(),
        businessPhone: businessPhone.trim(),
      };
      // Only sent when it actually changed — resending the same data URL
      // on every save is wasted bandwidth for something that rarely changes.
      if (logoDataUrl !== vendor.logoUrl) input.logoDataUrl = logoDataUrl ?? "";
      await updateVendorProfile(input);
      onSaved();
    } catch (err) {
      if (err instanceof ValidationError) {
        setFieldErrors(err.fields as ProfileFormFields[]);
        setError(err.message);
      } else {
        setError("Couldn't save. Check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const invalid = (field: ProfileFormFields) => fieldErrors.includes(field);

  return (
    <form onSubmit={submit} noValidate className="card">
      <p className="h2" style={{ fontSize: 16 }}>
        Business profile
      </p>

      <LogoPicker value={logoDataUrl} onChange={setLogoDataUrl} />

      <label className="field-label" htmlFor="businessName">
        Business name
      </label>
      <input
        id="businessName"
        className="field"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        aria-invalid={invalid("businessName")}
        required
      />

      <label className="field-label" htmlFor="ownerName">
        Owner name
      </label>
      <input
        id="ownerName"
        className="field"
        value={ownerName}
        onChange={(e) => setOwnerName(e.target.value)}
        aria-invalid={invalid("ownerName")}
        required
      />

      <label className="field-label" htmlFor="category">
        What do you sell?
      </label>
      <select
        id="category"
        className="field"
        value={category}
        onChange={(e) => setCategory(e.target.value as VendorCategory)}
      >
        {Object.entries(VENDOR_CATEGORY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <label className="field-label" htmlFor="businessAddress">
        Business address
      </label>
      <input
        id="businessAddress"
        className="field"
        value={businessAddress}
        onChange={(e) => setBusinessAddress(e.target.value)}
        aria-invalid={invalid("businessAddress")}
        required
      />

      <label className="field-label" htmlFor="businessPhone">
        Business phone (optional)
      </label>
      <input
        id="businessPhone"
        className="field"
        type="tel"
        value={businessPhone}
        onChange={(e) => setBusinessPhone(e.target.value)}
      />

      <div className="row-flex">
        <button type="button" onClick={onCancel} disabled={submitting} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn btn-primary">
          {submitting ? "Saving…" : "Save Changes"}
        </button>
      </div>
      {error && (
        <p className="mt-3 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

function AccountCard({ vendor }: { vendor: Vendor }) {
  const [changing, setChanging] = useState(false);

  if (changing) {
    return (
      <ChangePasswordForm
        hasPassword={vendor.hasPassword}
        onCancel={() => setChanging(false)}
        onSaved={() => setChanging(false)}
      />
    );
  }

  return (
    <div className="card">
      <p className="h2" style={{ fontSize: 16 }}>
        Account
      </p>
      <div className="readonly-row">
        <span className="readonly-label">EMAIL</span>
        <span className="readonly-val">{vendor.email}</span>
      </div>
      <div className="readonly-row">
        <span className="readonly-label">PASSWORD</span>
        <button
          type="button"
          onClick={() => setChanging(true)}
          className="btn btn-secondary"
          style={{ minHeight: 36, padding: "0 14px", fontSize: 13 }}
        >
          {vendor.hasPassword ? "Change Password" : "Set Password"}
        </button>
      </div>
    </div>
  );
}

function ChangePasswordForm({
  hasPassword,
  onCancel,
  onSaved,
}: {
  hasPassword: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const bad: string[] = [];
    // An account made with Google has no current password to check.
    if (hasPassword && !currentPassword) bad.push("currentPassword");
    if (newPassword.length < 8) bad.push("newPassword");
    if (newPassword !== confirmPassword) bad.push("confirmPassword");
    setFieldErrors(bad);
    if (bad.length > 0) {
      setError(
        bad.includes("confirmPassword") && newPassword.length >= 8
          ? "New password and confirmation don't match."
          : "Check the fields marked below.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setDone(true);
    } catch (err) {
      if (err instanceof ValidationError) {
        setFieldErrors(err.fields);
        setError(err.message);
      } else {
        setError("Couldn't change your password. Check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const invalid = (field: string) => fieldErrors.includes(field);

  if (done) {
    return (
      <div className="card">
        <p className="h2" style={{ fontSize: 16 }}>
          Password changed
        </p>
        <p className="sub" style={{ marginBottom: 18 }}>
          Use your new password next time you log in.
        </p>
        <button type="button" onClick={onSaved} className="btn btn-secondary">
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="card">
      <p className="h2" style={{ fontSize: 16 }}>
        {hasPassword ? "Change password" : "Set a password"}
      </p>

      {hasPassword ? (
        <>
          <label className="field-label" htmlFor="currentPassword">
            Current password
          </label>
          <input
            id="currentPassword"
            className="field"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            aria-invalid={invalid("currentPassword")}
            required
          />
        </>
      ) : (
        <p className="sub" style={{ marginBottom: 18 }}>
          You signed up with Google, so you don&apos;t have a password yet. Set
          one to also log in with your email.
        </p>
      )}

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
        aria-invalid={invalid("newPassword")}
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
        aria-invalid={invalid("confirmPassword")}
        required
      />

      <div className="row-flex">
        <button type="button" onClick={onCancel} disabled={submitting} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn btn-primary">
          {submitting ? "Saving…" : "Save Password"}
        </button>
      </div>
      {error && (
        <p className="mt-3 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
