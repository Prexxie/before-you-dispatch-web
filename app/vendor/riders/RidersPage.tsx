"use client";

import LogoLoader from "@/components/LogoLoader";
import { FormEvent, useRef, useState } from "react";
import {
  Rider,
  ValidationError,
  Vehicle,
  categoryLabel,
  createRider,
  getMe,
  getRiders,
  setRiderActive,
  updateRider,
} from "@/lib/api";
import FieldError from "@/components/FieldError";
import { useLiveValidation } from "@/lib/useLiveValidation";
import LogoPicker from "@/components/LogoPicker";
import { PHONE_ERROR, isValidPhone } from "@/lib/validate";
import { useLiveData } from "@/lib/useLiveData";
import { initials } from "@/lib/format";
import AppShell from "@/components/AppShell";

const VEHICLE_LABELS: Record<Vehicle, string> = {
  bike: "Bike",
  car: "Car",
  van: "Van",
};

type Field = keyof RiderForm;

type RiderForm = { name: string; phone: string; vehicle: Vehicle };

const EMPTY_FORM: RiderForm = { name: "", phone: "", vehicle: "bike" };

// Design: "Vendor: Manage Riders" / "Add Rider" / "Edit Rider". The table
// alone by default; "+ Add Rider" or a row's "Edit" opens the form beside it.
// Riders are sorted by name, both active and deactivated ones shown (a deactivated rider stays
// visible here — just gone from the create-order dropdown — since their
// past orders still reference them).
export default function RidersPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  // The form panel beside the table: closed (null) by default, "add" for a new
  // rider, or the rider being edited. The table only gives up width while it's
  // open.
  const [panel, setPanel] = useState<"add" | Rider | null>(null);
  // `open` drives the slide; `panel` keeps the form mounted while it slides out.
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openPanel(next: "add" | Rider) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setPanel(next);
    // One frame later, so the collapsed state paints first and the change animates.
    requestAnimationFrame(() => setOpen(true));
  }

  function closePanel() {
    setOpen(false);
    closeTimer.current = setTimeout(() => setPanel(null), 400);
  }
  // Bumped after each save so the form starts fresh (no leftover "touched"
  // errors on the emptied fields).
  const [formVersion, setFormVersion] = useState(0);
  const [state] = useLiveData(() => getRiders(), `riders-${refreshKey}`);
  const [meState] = useLiveData(() => getMe(), "riders-me");
  const riders = state.kind === "ready" ? state.data : null;
  const businessName =
    meState.kind === "ready" ? (meState.data?.businessName ?? null) : null;
  const vendor = meState.kind === "ready" ? meState.data : null;
  const themeColor =
    meState.kind === "ready" ? meState.data?.themeColor : undefined;

  function reload() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <AppShell
      active="riders"
      title="Riders"
      businessName={businessName}
      businessCategory={vendor ? categoryLabel(vendor) : null}
      themeColor={themeColor}
    >
      {state.kind === "loading" ? (
        <LogoLoader label="Loading riders…" page />
      ) : (
        <>
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="eyebrow">Your team</p>
              <h1 className="h1">Riders</h1>
              <p className="sub">
                Add the riders you already work with. Once added, they&apos;ll
                show up in the &quot;Assign a rider&quot; list when you create
                a delivery.
              </p>
            </div>
            {!open && (
              <button
                type="button"
                onClick={() => openPanel("add")}
                className="btn btn-primary whitespace-nowrap"
              >
                + Add Rider
              </button>
            )}
          </div>

          <div className="split-riders" data-open={open}>
            <div className="card" style={{ padding: "8px 24px" }}>
              {state.kind === "error" && (
                <p className="sub" role="alert">
                  We couldn&apos;t load your riders. Check your connection.
                </p>
              )}
              {riders && riders.length === 0 && (
                <p className="sub" style={{ padding: "18px 0" }}>
                  No riders yet — add your first one.
                </p>
              )}
              {riders && riders.length > 0 && (
                <div className="table-scroll">
                  <table className="wire">
                    <thead>
                      <tr>
                        <th scope="col">Rider</th>
                        <th scope="col">Phone</th>
                        <th scope="col">Vehicle</th>
                        <th scope="col">Status</th>
                        <th scope="col">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {riders.map((r) => (
                        <RiderRow key={r.id} rider={r} onChanged={reload} onEdit={() => openPanel(r)} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="riders-panel" aria-hidden={!open}>
              {panel && (
                <RiderFormCard
                  // A fresh form for each rider picked (or for "add").
                  key={`${panel === "add" ? "new" : panel.id}-${formVersion}`}
                  rider={panel === "add" ? null : panel}
                  onDone={() => {
                    closePanel();
                    setFormVersion((v) => v + 1);
                    reload();
                  }}
                  onCancel={closePanel}
                />
              )}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

function RiderRow({
  rider,
  onChanged,
  onEdit,
}: {
  rider: Rider;
  onChanged: () => void;
  onEdit: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await setRiderActive(rider.id, !rider.active);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr>
      <td>
        <span className="avatar">
          {rider.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- a saved
            // data URL, not a served asset.
            <img src={rider.photoUrl} alt="" />
          ) : (
            initials(rider.name)
          )}
        </span>
        {rider.name}
      </td>
      <td>{rider.phone}</td>
      <td>{rider.vehicle ? VEHICLE_LABELS[rider.vehicle] : "—"}</td>
      <td>
        <span
          className={`badge ${rider.active ? "badge-success" : "badge-neutral"}`}
        >
          {rider.active ? "Active" : "Inactive"}
        </span>
      </td>
      <td style={{ whiteSpace: "nowrap" }}>
        <button type="button" onClick={onEdit} className="underline text-[13px] mr-4">
          Edit
        </button>
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className="underline text-[13px]"
        >
          {busy ? "…" : rider.active ? "Deactivate" : "Reactivate"}
        </button>
      </td>
    </tr>
  );
}

// "Add a rider" when `rider` is null, otherwise "Edit rider" for that one.
function RiderFormCard({
  rider,
  onDone,
  onCancel,
}: {
  rider: Rider | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<RiderForm>(
    rider
      ? { name: rider.name, phone: rider.phone, vehicle: rider.vehicle ?? "bike" }
      : EMPTY_FORM,
  );
  const [photo, setPhoto] = useState<string | null>(rider?.photoUrl ?? null);
  // Fields the API rejected that the form's own checks passed.
  const [serverFields, setServerFields] = useState<(Field | "photoDataUrl")[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: Field, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setServerFields((errs) => errs.filter((e) => e !== field));
  }

  // Errors show as each field is left, then update as the person types.
  const errors: Partial<Record<Field, string>> = {};
  if (!form.name.trim()) errors.name = "Enter the rider's name.";
  if (!form.phone.trim()) errors.phone = "Enter the rider's phone number.";
  else if (!isValidPhone(form.phone)) errors.phone = PHONE_ERROR;
  const live = useLiveValidation<Field>(errors, form);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!live.validateAll()) return;

    setSubmitting(true);
    try {
      const details = { ...form, name: form.name.trim(), phone: form.phone.trim() };
      if (rider) {
        // The photo is only sent when it changed ("" removes it).
        await updateRider(rider.id, {
          ...details,
          ...(photo !== (rider.photoUrl ?? null) ? { photoDataUrl: photo ?? "" } : {}),
        });
      } else {
        await createRider({ ...details, photoDataUrl: photo ?? undefined });
        setForm(EMPTY_FORM);
        setPhoto(null);
      }
      onDone();
    } catch (err) {
      if (err instanceof ValidationError) {
        setServerFields(err.fields as (Field | "photoDataUrl")[]);
        setError(err.message);
      } else {
        setError(
          rider
            ? "Couldn't save that rider. Check your connection and try again."
            : "Couldn't add that rider. Check your connection and try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  const invalid = (field: Field) => !!live.error(field) || serverFields.includes(field);

  return (
    <form onSubmit={submit} noValidate className="card">
      <div className="flex items-start justify-between">
        <p className="h2" style={{ fontSize: 16 }}>
          {rider ? "Edit rider" : "Add a rider"}
        </p>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="panel-close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <p className="sub" style={{ marginBottom: 18 }}>
        {rider
          ? "Changes show on this rider's future links and the Assign a rider list."
          : "You can add your own staff riders, or third-party dispatch riders you use often."}
      </p>

      <LogoPicker
        value={photo}
        onChange={setPhoto}
        label="Add the rider's photo"
        changeLabel="Change the rider's photo"
      />

      <label className="field-label" htmlFor="riderName">
        Rider name
      </label>
      <input
        id="riderName"
        className="field"
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
        onBlur={live.onBlur("name")}
        placeholder="e.g. Lawan"
        aria-invalid={invalid("name")}
        aria-describedby={live.error("name") ? "riderName-error" : undefined}
        required
      />
      <FieldError id="riderName" message={live.error("name")} />

      <label className="field-label" htmlFor="riderPhone">
        Phone number
      </label>
      <input
        id="riderPhone"
        className="field"
        type="tel"
        value={form.phone}
        onChange={(e) => update("phone", e.target.value)}
        onBlur={live.onBlur("phone")}
        placeholder="e.g. 0803 555 1234"
        aria-invalid={invalid("phone")}
        aria-describedby={invalid("phone") ? "riderPhone-error" : undefined}
        required
      />
      <FieldError
        id="riderPhone"
        message={live.error("phone") ?? (serverFields.includes("phone") ? PHONE_ERROR : undefined)}
      />

      <label className="field-label" htmlFor="riderVehicle">
        Vehicle type
      </label>
      <select
        id="riderVehicle"
        className="field"
        value={form.vehicle}
        onChange={(e) => update("vehicle", e.target.value)}
      >
        {Object.entries(VEHICLE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <div className="row-flex">
        {rider && (
          <button type="button" onClick={onCancel} disabled={submitting} className="btn btn-secondary">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className={`btn btn-primary ${rider ? "" : "btn-block"}`}
        >
          {submitting
            ? rider
              ? "Saving…"
              : "Adding…"
            : rider
              ? "Save Changes"
              : "+ Add Rider"}
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
