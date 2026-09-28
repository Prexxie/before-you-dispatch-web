"use client";

import { FormEvent, useState } from "react";
import {
  CreateRiderInput,
  Rider,
  ValidationError,
  Vehicle,
  createRider,
  getMe,
  getRiders,
  setRiderActive,
} from "@/lib/api";
import { useLiveData } from "@/lib/useLiveData";
import { initials } from "@/lib/format";
import AppShell from "@/components/AppShell";

const VEHICLE_LABELS: Record<Vehicle, string> = {
  bike: "Bike",
  car: "Car",
  van: "Van",
};

type Field = keyof CreateRiderInput;

const EMPTY_FORM: CreateRiderInput = { name: "", phone: "", vehicle: "bike" };

// Design: "Vendor: Manage Riders". The table + form split, riders sorted by
// name, both active and deactivated ones shown (a deactivated rider stays
// visible here — just gone from the create-order dropdown — since their
// past orders still reference them).
export default function RidersPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [state] = useLiveData(() => getRiders(), `riders-${refreshKey}`);
  const [meState] = useLiveData(() => getMe(), "riders-me");
  const riders = state.kind === "ready" ? state.data : null;
  const businessName = meState.kind === "ready" ? (meState.data?.businessName ?? null) : null;

  function reload() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <AppShell active="riders" title="Riders" businessName={businessName}>
      <p className="eyebrow">Your team</p>
      <h1 className="h1">Riders</h1>
      <p className="sub">
        Add the riders you already work with. Once added, they&apos;ll show up
        in the &quot;Assign a rider&quot; list when you create a delivery.
      </p>

      <div className="split-riders">
        <div className="card" style={{ padding: "8px 24px" }}>
          {state.kind === "loading" && <p className="sub">Loading riders…</p>}
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
                    <RiderRow key={r.id} rider={r} onChanged={reload} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <AddRiderCard onAdded={reload} />
      </div>
    </AppShell>
  );
}

function RiderRow({ rider, onChanged }: { rider: Rider; onChanged: () => void }) {
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
        <span className="avatar">{initials(rider.name)}</span>
        {rider.name}
      </td>
      <td>{rider.phone}</td>
      <td>{rider.vehicle ? VEHICLE_LABELS[rider.vehicle] : "—"}</td>
      <td>
        <span className={`badge ${rider.active ? "badge-success" : "badge-neutral"}`}>
          {rider.active ? "Active" : "Inactive"}
        </span>
      </td>
      <td>
        <button type="button" onClick={toggle} disabled={busy} className="underline text-[13px]">
          {busy ? "…" : rider.active ? "Deactivate" : "Reactivate"}
        </button>
      </td>
    </tr>
  );
}

function AddRiderCard({ onAdded }: { onAdded: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Field[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: Field, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((errs) => errs.filter((e) => e !== field));
  }

  function checkForm(): Field[] {
    const bad: Field[] = [];
    if (!form.name.trim()) bad.push("name");
    const digits = form.phone.replace(/\D/g, "").length;
    if (digits < 10 || digits > 15) bad.push("phone");
    return bad;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const bad = checkForm();
    setFieldErrors(bad);
    if (bad.length > 0) return;

    setSubmitting(true);
    try {
      await createRider({ ...form, name: form.name.trim(), phone: form.phone.trim() });
      onAdded();
      setForm(EMPTY_FORM);
    } catch (err) {
      if (err instanceof ValidationError) {
        setFieldErrors(err.fields as Field[]);
        setError(err.message);
      } else {
        setError("Couldn't add that rider. Check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const invalid = (field: Field) => fieldErrors.includes(field);

  return (
    <form onSubmit={submit} noValidate className="card">
      <p className="h2" style={{ fontSize: 16 }}>
        Add a rider
      </p>
      <p className="sub" style={{ marginBottom: 18 }}>
        You can add your own staff riders, or third-party dispatch riders you
        use often.
      </p>

      <label className="field-label" htmlFor="riderName">
        Rider name
      </label>
      <input
        id="riderName"
        className="field"
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
        placeholder="e.g. Lawan"
        aria-invalid={invalid("name")}
        required
      />

      <label className="field-label" htmlFor="riderPhone">
        Phone number
      </label>
      <input
        id="riderPhone"
        className="field"
        type="tel"
        value={form.phone}
        onChange={(e) => update("phone", e.target.value)}
        placeholder="e.g. 0803 555 1234"
        aria-invalid={invalid("phone")}
        required
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

      <button type="submit" disabled={submitting} className="btn btn-primary btn-block">
        {submitting ? "Adding…" : "+ Add Rider"}
      </button>
      {error && (
        <p className="mt-3 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
