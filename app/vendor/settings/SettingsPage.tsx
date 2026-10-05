"use client";

import LogoLoader from "@/components/LogoLoader";
import { FormEvent, useState } from "react";
import {
  ThemeColor,
  UpdateVendorInput,
  ValidationError,
  Vendor,
  VendorCategory,
  categoryLabel,
  changePassword,
  getMe,
  updateVendorProfile,
} from "@/lib/api";
import { THEME_COLOR_ORDER, THEME_PRESETS } from "@/lib/theme";
import { useLiveData } from "@/lib/useLiveData";
import LogoPicker from "@/components/LogoPicker";
import CategoryField from "@/components/CategoryField";
import PasswordField from "@/components/PasswordField";
import FieldError from "@/components/FieldError";
import { useLiveValidation } from "@/lib/useLiveValidation";
import PasswordRules from "@/components/PasswordRules";
import { PASSWORD_ERROR, PHONE_ERROR, isStrongPassword, isValidPhone } from "@/lib/validate";
import AppShell from "@/components/AppShell";
import { CheckIcon } from "@/components/icons";

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
    <AppShell
      active="settings"
      title="Settings"
      businessName={vendor?.businessName ?? null}
      businessCategory={vendor ? categoryLabel(vendor) : null}
      themeColor={vendor?.themeColor}
    >
      {state.kind === "loading" ? (
        <LogoLoader page />
      ) : (
        <>
          <p className="eyebrow">Workspace</p>
          <h1 className="h1">Settings</h1>
          <p className="sub">Manage your business profile and your account.</p>
        </>
      )}
      {state.kind === "error" && (
        <p className="sub" role="alert">
          We couldn&apos;t load your settings. Check your connection.
        </p>
      )}

      {vendor && (
        <div className="settings-grid">
          <ProfileCard vendor={vendor} onSaved={reload} />
          <ThemeCard vendor={vendor} onSaved={reload} />
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
        <span className="readonly-label">BUSINESS TYPE</span>
        <span className="readonly-val">{categoryLabel(vendor)}</span>
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

type ProfileFormFields =
  | "businessName"
  | "ownerName"
  | "businessAddress"
  | "businessPhone"
  | "categoryOther";

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
  const [categoryOther, setCategoryOther] = useState(vendor.categoryOther ?? "");
  const [businessAddress, setBusinessAddress] = useState(vendor.businessAddress);
  const [businessPhone, setBusinessPhone] = useState(vendor.businessPhone ?? "");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(vendor.logoUrl);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Errors the API reported for fields the form's own checks can't know
  // about; cleared as soon as that field is edited.
  const [serverFields, setServerFields] = useState<ProfileFormFields[]>([]);

  const errors: Partial<Record<ProfileFormFields | "category", string>> = {};
  if (!businessName.trim()) errors.businessName = "Enter your business name.";
  if (!ownerName.trim()) errors.ownerName = "Enter the owner's name.";
  if (!businessAddress.trim()) errors.businessAddress = "Enter your business address.";
  if (businessPhone.trim() && !isValidPhone(businessPhone)) errors.businessPhone = PHONE_ERROR;
  if (category === "other" && !categoryOther.trim()) errors.categoryOther = "Tell us your business type.";
  const live = useLiveValidation<ProfileFormFields | "category">(errors);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!live.validateAll()) return;

    setSubmitting(true);
    try {
      const input: UpdateVendorInput = {
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        category,
        categoryOther: category === "other" ? categoryOther.trim() : "",
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
        setServerFields(err.fields as ProfileFormFields[]);
        setError(err.message);
      } else {
        setError("Couldn't save. Check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const invalid = (field: ProfileFormFields) =>
    !!live.error(field) || serverFields.includes(field);
  const edited = (field: ProfileFormFields) =>
    setServerFields((f) => f.filter((x) => x !== field));

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
        onChange={(e) => {
          setBusinessName(e.target.value);
          edited("businessName");
        }}
        onBlur={live.onBlur("businessName")}
        aria-invalid={invalid("businessName")}
        aria-describedby={live.error("businessName") ? "businessName-error" : undefined}
        required
      />
      <FieldError id="businessName" message={live.error("businessName")} />

      <label className="field-label" htmlFor="ownerName">
        Owner name
      </label>
      <input
        id="ownerName"
        className="field"
        value={ownerName}
        onChange={(e) => {
          setOwnerName(e.target.value);
          edited("ownerName");
        }}
        onBlur={live.onBlur("ownerName")}
        aria-invalid={invalid("ownerName")}
        aria-describedby={live.error("ownerName") ? "ownerName-error" : undefined}
        required
      />
      <FieldError id="ownerName" message={live.error("ownerName")} />

      <CategoryField
        category={category}
        categoryOther={categoryOther}
        onCategory={(c) => {
          setCategory(c as VendorCategory);
          edited("categoryOther");
        }}
        onCategoryOther={(t) => {
          setCategoryOther(t);
          edited("categoryOther");
        }}
        otherError={live.error("categoryOther")}
        onBlurOther={live.onBlur("categoryOther")}
      />

      <label className="field-label" htmlFor="businessAddress">
        Business address
      </label>
      <input
        id="businessAddress"
        className="field"
        value={businessAddress}
        onChange={(e) => {
          setBusinessAddress(e.target.value);
          edited("businessAddress");
        }}
        onBlur={live.onBlur("businessAddress")}
        aria-invalid={invalid("businessAddress")}
        aria-describedby={live.error("businessAddress") ? "businessAddress-error" : undefined}
        required
      />
      <FieldError id="businessAddress" message={live.error("businessAddress")} />

      <label className="field-label" htmlFor="businessPhone">
        Business phone (optional)
      </label>
      <input
        id="businessPhone"
        className="field"
        type="tel"
        value={businessPhone}
        onChange={(e) => {
          setBusinessPhone(e.target.value);
          edited("businessPhone");
        }}
        onBlur={live.onBlur("businessPhone")}
        placeholder="e.g. 0803 123 4567"
        aria-invalid={invalid("businessPhone")}
        aria-describedby={invalid("businessPhone") ? "businessPhone-error" : undefined}
      />
      <FieldError
        id="businessPhone"
        message={live.error("businessPhone") ?? (serverFields.includes("businessPhone") ? PHONE_ERROR : undefined)}
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

// Design: "Vendor: Settings", Workspace theme. Swatches apply immediately
// on click (the mockup shows no separate save button here) — only the
// vendor's own dashboard chrome re-tints; the "WakaRoute" brand
// mark and the customer/rider pages never change.
function ThemeCard({ vendor, onSaved }: { vendor: Vendor; onSaved: () => void }) {
  const [saving, setSaving] = useState<ThemeColor | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pick(color: ThemeColor) {
    if (color === vendor.themeColor || saving) return;
    setSaving(color);
    setError(null);
    try {
      await updateVendorProfile({ themeColor: color });
      onSaved();
    } catch {
      setError("Couldn't save. Check your connection and try again.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="card">
      <p className="h2" style={{ fontSize: 16 }}>
        Workspace theme
      </p>
      <p className="sub" style={{ marginBottom: 0 }}>
        Pick an accent color for your dashboard. The WakaRoute
        brand stays the same everywhere else.
      </p>
      <div className="swatch-row" role="radiogroup" aria-label="Workspace theme">
        {THEME_COLOR_ORDER.map((color) => {
          const selected = vendor.themeColor === color;
          return (
            <button
              key={color}
              type="button"
              className={`swatch ${selected ? "selected" : ""}`}
              style={{ background: THEME_PRESETS[color].swatch }}
              onClick={() => pick(color)}
              disabled={saving !== null}
              role="radio"
              aria-checked={selected}
              aria-label={THEME_PRESETS[color].label}
            >
              {selected && <CheckIcon size={14} />}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="mt-3 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // E.g. "Current password is incorrect" from the API; cleared on edit.
  const [serverFields, setServerFields] = useState<string[]>([]);

  type PField = "currentPassword" | "newPassword" | "confirmPassword";
  const errors: Partial<Record<PField, string>> = {};
  // An account made with Google has no current password to check.
  if (hasPassword && !currentPassword) errors.currentPassword = "Enter your current password.";
  if (!isStrongPassword(newPassword)) errors.newPassword = PASSWORD_ERROR;
  if (!confirmPassword) errors.confirmPassword = "Type the new password again.";
  else if (newPassword !== confirmPassword) errors.confirmPassword = "The two passwords don't match.";
  const live = useLiveValidation<PField>(errors);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!live.validateAll()) return;

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setDone(true);
    } catch (err) {
      if (err instanceof ValidationError) {
        setServerFields(err.fields);
        setError(err.message);
      } else {
        setError("Couldn't change your password. Check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const invalid = (field: PField) => !!live.error(field) || serverFields.includes(field);

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
          <PasswordField
            id="currentPassword"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setServerFields([]);
            }}
            onBlur={live.onBlur("currentPassword")}
            aria-invalid={invalid("currentPassword")}
            aria-describedby={live.error("currentPassword") ? "currentPassword-error" : undefined}
            required
          />
          <FieldError id="currentPassword" message={live.error("currentPassword")} />
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
      <PasswordField
        id="newPassword"
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        onBlur={live.onBlur("newPassword")}
        placeholder="Create a strong password"
        aria-invalid={invalid("newPassword")}
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
        aria-invalid={invalid("confirmPassword")}
        aria-describedby={live.error("confirmPassword") ? "confirmPassword-error" : undefined}
        required
      />
      <FieldError id="confirmPassword" message={live.error("confirmPassword")} />

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
