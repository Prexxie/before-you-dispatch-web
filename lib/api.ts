// Client for before-you-dispatch-api. Shapes mirror the API repo's API.md.

// Same-origin path; next.config.ts forwards /api/* to the API (API_URL).
const API_URL = "/api";

export type OrderStatus =
  | "pending_confirmation"
  | "confirmed"
  | "not_ready"
  | "dispatched"
  | "delivered"
  | "failed";

export type ConfirmationDetails = {
  // For the greeting ("Hi Amaka"); the API never sends the full name.
  customerFirstName: string;
  // Business the delivery is from; null until vendor accounts exist.
  vendorName: string | null;
  itemDescription: string;
  status: OrderStatus;
  awaitingResponse: boolean;
  // The pin saved for this order, if any.
  location: LocationInput | null;
  // The pin this customer saved on an earlier order, to prefill the map.
  previousLocation: LocationInput | null;
  // They said "Not now" today and can still change to ready.
  canChangeToReady: boolean;
  // Business the delivery is from (name, address, phone), or null.
  vendor: VendorInfo | null;
  // Who's bringing it, once the rider has been sent.
  rider: { name: string; phone: string } | null;
  // When the rider collected the order from the vendor.
  pickedUpAt: string | null;
  // When they tapped "I've received my delivery".
  receivedAt: string | null;
};

// The business a delivery comes from. Until vendor accounts exist it comes
// from the API's DEMO_VENDOR_* settings; address and phone may be missing.
export type VendorInfo = {
  name: string;
  address: string | null;
  phone: string | null;
};

// Who confirmed the customer got their items (CLAUDE.md flow step 6).
export type DeliveryConfirmer = "customer" | "vendor";

// Preset reasons a rider can give for a failed delivery.
export type FailureReason =
  | "customer_not_ready"
  | "address_not_found"
  | "customer_unreachable"
  | "other";

// Wording from the "Rider: Mark Outcome" design.
export const FAILURE_REASON_LABELS: Record<FailureReason, string> = {
  customer_not_ready: "Customer wasn't ready",
  address_not_found: "Couldn't find the address",
  customer_unreachable: "Customer not reachable",
  other: "Other",
};

export type LocationInput = {
  lat: number;
  lng: number;
  landmarkNote: string;
};

export type Vehicle = "bike" | "car" | "van";

export type Rider = {
  id: string;
  name: string;
  phone: string;
  vehicle: Vehicle | null;
};

export type CreateOrderInput = {
  customerName: string;
  customerPhone: string;
  itemDescription: string;
  riderId: string;
};

export type Order = CreateOrderInput & {
  id: string;
  // Shown to the vendor as "Order #12".
  orderNumber: number;
  status: OrderStatus;
  createdAt: string;
  customerToken: string;
};

// One order as the vendor sees it (GET /orders/:id).
export type VendorOrder = {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  itemDescription: string;
  status: OrderStatus;
  createdAt: string;
  // Bumped by the database on every write; drives the dashboard's sort.
  updatedAt: string;
  customerToken: string;
  rider: Rider;
  location: LocationInput | null;
  // Only set once the customer's pin is saved.
  riderToken: string | null;
  confirmedAt: string | null;
  notReadyAt: string | null;
  locationSavedAt: string | null;
  dispatchedAt: string | null;
  pickedUpAt: string | null;
  receivedAt: string | null;
  completedAt: string | null;
  failureReason: FailureReason | null;
  deliveryConfirmedBy: DeliveryConfirmer | null;
  vendor: VendorInfo | null;
};

// What the rider's link shows (GET /rider/:token). `location` is withheld by
// the API (not just hidden in the UI) until the rider confirms pickup.
export type RiderJob = {
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  itemDescription: string;
  location: LocationInput | null;
  status: OrderStatus;
  failureReason: FailureReason | null;
  riderName: string;
  vendorName: string | null;
  // The pickup point.
  vendor: VendorInfo | null;
  // Set once the rider confirms they collected the order.
  pickedUpAt: string | null;
  // Set once the customer confirms receipt; completing needs it.
  receivedAt: string | null;
  deliveryConfirmedBy: DeliveryConfirmer | null;
};

// A 409 from the API: the order is in a state that doesn't allow this.
// `message` is the API's explanation, `status` the order's current status.
export class ConflictError extends Error {
  constructor(
    message: string,
    public status: OrderStatus,
  ) {
    super(message);
  }
}

// Distinguishes "this link is bad" (show a dead-end message) from network or
// server trouble (worth offering a retry).
export class NotFoundError extends Error {}

// A 400 from the API: `message` is its explanation, `fields` the inputs at
// fault, so forms can mark them.
export class ValidationError extends Error {
  constructor(
    message: string,
    public fields: string[],
  ) {
    super(message);
  }
}

// The order moved on (e.g. the rider was sent), so the pin can't change.
// `message` is the API's customer-facing explanation.
export class LocationLockedError extends Error {
  constructor(
    message: string,
    public status: OrderStatus,
  ) {
    super(message);
  }
}

export async function getRiders(): Promise<Rider[]> {
  const res = await fetch(`${API_URL}/riders`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET riders failed: ${res.status}`);
  return res.json();
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 400) {
    const body: { error: string; fields?: string[] } = await res.json();
    throw new ValidationError(body.error, body.fields ?? []);
  }
  if (!res.ok) throw new Error(`POST orders failed: ${res.status}`);
  return res.json();
}

export async function getConfirmation(
  token: string,
): Promise<ConfirmationDetails> {
  const res = await fetch(
    `${API_URL}/orders/${encodeURIComponent(token)}/confirm`,
    { cache: "no-store" },
  );
  if (res.status === 404) throw new NotFoundError();
  if (!res.ok) throw new Error(`GET confirm failed: ${res.status}`);
  return res.json();
}

// Returns the order's status after the call. A 409 (already answered) isn't
// an error for the UI: it just means we show that status.
export async function submitConfirmation(
  token: string,
  ready: boolean,
): Promise<OrderStatus> {
  const res = await fetch(
    `${API_URL}/orders/${encodeURIComponent(token)}/confirm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ready }),
    },
  );
  if (res.status === 404) throw new NotFoundError();
  if (res.ok || res.status === 409) {
    const body: { status: OrderStatus } = await res.json();
    return body.status;
  }
  throw new Error(`POST confirm failed: ${res.status}`);
}

// Saves (or corrects) the customer's pin. Resolves to the location as stored.
export async function submitLocation(
  token: string,
  location: LocationInput,
): Promise<LocationInput> {
  const res = await fetch(
    `${API_URL}/orders/${encodeURIComponent(token)}/location`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(location),
    },
  );
  if (res.status === 404) throw new NotFoundError();
  if (res.status === 409) {
    const body: { error: string; status: OrderStatus } = await res.json();
    throw new LocationLockedError(body.error, body.status);
  }
  if (!res.ok) throw new Error(`POST location failed: ${res.status}`);
  const body: { location: LocationInput } = await res.json();
  return body.location;
}

async function conflictOrThrow(res: Response, what: string): Promise<never> {
  if (res.status === 404) throw new NotFoundError();
  if (res.status === 409) {
    const body: { error: string; status: OrderStatus } = await res.json();
    throw new ConflictError(body.error, body.status);
  }
  throw new Error(`${what} failed: ${res.status}`);
}

export async function getVendorOrder(id: string): Promise<VendorOrder> {
  const res = await fetch(`${API_URL}/orders/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (!res.ok) return conflictOrThrow(res, "GET order");
  return res.json();
}

// The vendor sent the rider their link: marks the order dispatched.
export async function dispatchOrder(id: string): Promise<VendorOrder> {
  const res = await fetch(
    `${API_URL}/orders/${encodeURIComponent(id)}/dispatch`,
    // keepalive: the vendor is usually leaving for WhatsApp as this sends.
    { method: "POST", keepalive: true },
  );
  if (!res.ok) return conflictOrThrow(res, "POST dispatch");
  return res.json();
}

export async function getRiderJob(token: string): Promise<RiderJob> {
  const res = await fetch(`${API_URL}/rider/${encodeURIComponent(token)}`, {
    cache: "no-store",
  });
  if (!res.ok) return conflictOrThrow(res, "GET rider");
  return res.json();
}

// The rider confirms they've collected the order from the vendor. Resolves
// to the now-unlocked pin.
export async function confirmPickup(
  token: string,
): Promise<{ pickedUpAt: string; location: LocationInput }> {
  const res = await fetch(
    `${API_URL}/rider/${encodeURIComponent(token)}/pickup`,
    { method: "POST" },
  );
  if (!res.ok) return conflictOrThrow(res, "POST pickup");
  return res.json();
}

export type Outcome =
  | { outcome: "delivered" }
  | { outcome: "failed"; reason: FailureReason };

export async function submitOutcome(
  token: string,
  outcome: Outcome,
): Promise<{ status: OrderStatus; failureReason: FailureReason | null }> {
  const res = await fetch(
    `${API_URL}/rider/${encodeURIComponent(token)}/outcome`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(outcome),
    },
  );
  if (!res.ok) return conflictOrThrow(res, "POST outcome");
  return res.json();
}

// One row on the vendor dashboard (GET /orders).
export type OrderSummary = {
  id: string;
  orderNumber: number;
  customerName: string;
  itemDescription: string;
  riderName: string;
  status: OrderStatus;
  hasLocation: boolean;
  pickedUpAt: string | null;
  receivedAt: string | null;
  failureReason: FailureReason | null;
  deliveryConfirmedBy: DeliveryConfirmer | null;
  createdAt: string;
  // What the dashboard sorts by: most recently active first.
  updatedAt: string;
};

// GET /orders response. Renamed in spirit from "TodayOrders": the list is
// now every order, not just today's — only `today` stays today-scoped, for
// the stat tiles.
export type OrderList = {
  vendorName: string | null;
  vendor: VendorInfo | null;
  // Today only (Nigeria time), for the four "today" stat tiles.
  today: {
    total: number;
    awaitingConfirmation: number;
    outForDelivery: number;
    delivered: number;
  };
  // All-time per-status totals, for the filter chips. Unaffected by the
  // current page or filter, so every chip always shows its true count.
  counts: {
    total: number;
    awaitingConfirmation: number;
    confirmed: number;
    notReady: number;
    outForDelivery: number;
    delivered: number;
    failed: number;
  };
  page: number;
  pageSize: number;
  totalPages: number;
  orders: OrderSummary[];
};

export async function getOrders(
  opts: { status?: OrderStatus; page?: number } = {},
): Promise<OrderList> {
  const params = new URLSearchParams();
  if (opts.status) params.set("status", opts.status);
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  const qs = params.toString();
  const res = await fetch(`${API_URL}/orders${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
  });
  if (res.status === 400) {
    const body: { error: string; fields?: string[] } = await res.json();
    throw new ValidationError(body.error, body.fields ?? []);
  }
  if (!res.ok) throw new Error(`GET orders failed: ${res.status}`);
  return res.json();
}

// The customer taps "I've received my delivery".
export async function confirmReceived(token: string): Promise<void> {
  const res = await fetch(
    `${API_URL}/orders/${encodeURIComponent(token)}/received`,
    { method: "POST" },
  );
  if (!res.ok) return conflictOrThrow(res, "POST received");
}

// The vendor marks a dispatched order delivered for a customer who can't
// confirm it themselves.
export async function markDeliveredByVendor(id: string): Promise<VendorOrder> {
  const res = await fetch(
    `${API_URL}/orders/${encodeURIComponent(id)}/delivered`,
    { method: "POST" },
  );
  if (!res.ok) return conflictOrThrow(res, "POST delivered");
  return res.json();
}
