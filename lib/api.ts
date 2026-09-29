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
  // Set when the vendor redelivered after the rider failed the last attempt:
  // which attempt this is and why the previous one failed.
  redelivery: { attempt: number; failureReason: FailureReason | null } | null;
  // Business the delivery is from (name, address, phone), or null.
  vendor: VendorInfo | null;
  // Who's bringing it, once the rider has been sent.
  rider: { name: string; phone: string } | null;
  // When the rider collected the order from the vendor.
  pickedUpAt: string | null;
  // When the rider tapped "I've arrived" at the customer's location.
  arrivedAt: string | null;
  // When they tapped "I've received my delivery".
  receivedAt: string | null;
};

// The business a delivery comes from, from the logged-in vendor's account.
// name and address are always set (both required at sign up); phone and
// logoUrl may be missing.
export type VendorInfo = {
  name: string;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
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
  // The street address the customer confirmed with the pin; null if they
  // didn't give one (older orders, or left blank).
  address: string | null;
};

export type Vehicle = "bike" | "car" | "van";

export type Rider = {
  id: string;
  name: string;
  phone: string;
  vehicle: Vehicle | null;
  active: boolean;
};

export type CreateRiderInput = {
  name: string;
  phone: string;
  vehicle: Vehicle;
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
  arrivedAt: string | null;
  receivedAt: string | null;
  completedAt: string | null;
  failureReason: FailureReason | null;
  deliveryConfirmedBy: DeliveryConfirmer | null;
  vendor: VendorInfo | null;
  // 1 for the first delivery attempt; goes up on each redelivery.
  attempt: number;
  // When the vendor retriggered an order the customer declined; null if never.
  retriggeredAt: string | null;
  // Earlier failed attempts, oldest first (kept when a failed order is
  // redelivered).
  attempts: OrderAttempt[];
};

export type OrderAttempt = {
  attemptNumber: number;
  riderName: string;
  failureReason: FailureReason | null;
  dispatchedAt: string | null;
  pickedUpAt: string | null;
  arrivedAt: string | null;
  failedAt: string | null;
  location: LocationInput | null;
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
  // Set once the rider taps "I've arrived" at the customer's location.
  arrivedAt: string | null;
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

// No valid vendor session. Thrown by vendorFetch below, which also sends the
// browser to the login page — a caller only needs this class to recognize
// that a redirect is already underway and stop what it was doing.
export class UnauthorizedError extends Error {}

// Wraps fetch for the vendor-only endpoints (dashboard, create order,
// dispatch, riders). On a 401 (no session, or it expired) it sends the
// browser to the login page and throws, so callers don't need their own
// 401 handling — they only see the successful or already-handled cases.
async function vendorFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/vendor/login";
    }
    throw new UnauthorizedError();
  }
  return res;
}

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

// activeOnly: true is what the create-order dropdown wants; false (the
// riders management page) gets every rider, deactivated ones included.
export async function getRiders(opts: { activeOnly?: boolean } = {}): Promise<Rider[]> {
  const qs = opts.activeOnly ? "?active=true" : "";
  const res = await vendorFetch(`/riders${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET riders failed: ${res.status}`);
  return res.json();
}

export async function createRider(input: CreateRiderInput): Promise<Rider> {
  const res = await vendorFetch("/riders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 400) {
    const body: { error: string; fields?: string[] } = await res.json();
    throw new ValidationError(body.error, body.fields ?? []);
  }
  if (!res.ok) throw new Error(`POST riders failed: ${res.status}`);
  return res.json();
}

export async function setRiderActive(id: string, active: boolean): Promise<Rider> {
  const res = await vendorFetch(
    `/riders/${encodeURIComponent(id)}/${active ? "activate" : "deactivate"}`,
    { method: "POST" },
  );
  if (!res.ok) throw new Error(`POST rider ${active ? "activate" : "deactivate"} failed: ${res.status}`);
  return res.json();
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const res = await vendorFetch("/orders", {
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
  const res = await vendorFetch(`/orders/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (!res.ok) return conflictOrThrow(res, "GET order");
  return res.json();
}

// The vendor sent the rider their link: marks the order dispatched.
export async function dispatchOrder(id: string): Promise<VendorOrder> {
  const res = await vendorFetch(
    `/orders/${encodeURIComponent(id)}/dispatch`,
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

// The rider tapped "picked up" by mistake: locks the customer's pin again.
export async function undoPickup(token: string): Promise<void> {
  const res = await fetch(
    `${API_URL}/rider/${encodeURIComponent(token)}/undo-pickup`,
    { method: "POST" },
  );
  if (!res.ok) return conflictOrThrow(res, "POST undo-pickup");
}

// The rider tapped "I've arrived" by mistake.
export async function undoArrived(token: string): Promise<void> {
  const res = await fetch(
    `${API_URL}/rider/${encodeURIComponent(token)}/undo-arrived`,
    { method: "POST" },
  );
  if (!res.ok) return conflictOrThrow(res, "POST undo-arrived");
}

// The rider confirms they've reached the customer's location. Purely a
// status update: doesn't unlock anything, harmless to tap again.
export async function confirmArrived(
  token: string,
): Promise<{ arrivedAt: string }> {
  const res = await fetch(
    `${API_URL}/rider/${encodeURIComponent(token)}/arrived`,
    { method: "POST" },
  );
  if (!res.ok) return conflictOrThrow(res, "POST arrived");
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
  arrivedAt: string | null;
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
  const res = await vendorFetch(`/orders${qs ? `?${qs}` : ""}`, {
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
  const res = await vendorFetch(
    `/orders/${encodeURIComponent(id)}/delivered`,
    { method: "POST" },
  );
  if (!res.ok) return conflictOrThrow(res, "POST delivered");
  return res.json();
}

// Starting again with a fresh customer link. `riderId` picks a different rider
// (one of the vendor's active ones); leave it out to keep the same rider.
async function newAttempt(
  id: string,
  action: "retrigger" | "redeliver",
  riderId?: string,
): Promise<VendorOrder> {
  const res = await vendorFetch(`/orders/${encodeURIComponent(id)}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(riderId ? { riderId } : {}),
  });
  if (!res.ok) return conflictOrThrow(res, `POST ${action}`);
  return res.json();
}

// The customer declined ("Not now" + the warning): the vendor issues a new
// link and the customer starts fresh.
export function retriggerOrder(id: string, riderId?: string): Promise<VendorOrder> {
  return newAttempt(id, "retrigger", riderId);
}

// The rider marked it failed: keep that attempt in the history and send the
// customer a new link to confirm they're ready again.
export function redeliverOrder(id: string, riderId?: string): Promise<VendorOrder> {
  return newAttempt(id, "redeliver", riderId);
}

// Vendor accounts (real sign-in, ahead of first deploy — replaces the
// earlier plan for a shared passcode).

// A rough sense of what the vendor sells (design: "What do you sell?").
// Account context only — not shown to customers or riders, and no feature
// logic depends on it yet.
export type VendorCategory =
  | "retail_ecommerce"
  | "food_restaurant"
  | "pharmacy"
  | "delivery_logistics"
  | "other";

export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  retail_ecommerce: "Retail / e-commerce",
  food_restaurant: "Food or restaurant",
  pharmacy: "Pharmacy",
  delivery_logistics: "Delivery / logistics / dispatch company",
  other: "Other",
};

// A cosmetic accent for the vendor's own dashboard (design: "Vendor:
// Settings", Workspace theme). Never seen by customers or riders.
export type ThemeColor = "green" | "crimson" | "navy" | "amber" | "purple";

export const THEME_COLOR_SWATCHES: Record<ThemeColor, string> = {
  green: "#065F46",
  crimson: "#9F1239",
  navy: "#1E3A5F",
  amber: "#7C4A03",
  purple: "#4A2E6B",
};

export type Vendor = {
  id: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string | null;
  logoUrl: string | null;
  ownerName: string;
  category: VendorCategory;
  themeColor: ThemeColor;
  email: string;
  // false for an account made with Google that never set a password.
  hasPassword: boolean;
};

export type SignUpInput = {
  businessName: string;
  // The rider's pickup point — required, not just context.
  businessAddress: string;
  businessPhone?: string;
  // A small "data:image/..." string from the logo picker, if one was set.
  logoDataUrl?: string;
  ownerName: string;
  category: VendorCategory | "";
  email: string;
  password: string;
};

// A 401 from /auth/login or /auth/signup itself is a wrong-credentials or
// bad-request case for the form to show, not a redirect — so these two
// functions use plain fetch, not vendorFetch.

export async function signUp(input: SignUpInput): Promise<Vendor> {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 400 || res.status === 409) {
    const body: { error: string; fields?: string[] } = await res.json();
    throw new ValidationError(body.error, body.fields ?? []);
  }
  if (!res.ok) throw new Error(`POST signup failed: ${res.status}`);
  return res.json();
}

export async function logIn(email: string, password: string): Promise<Vendor> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.status === 401) {
    const body: { error: string } = await res.json();
    throw new ValidationError(body.error, []);
  }
  if (!res.ok) throw new Error(`POST login failed: ${res.status}`);
  return res.json();
}

export async function logOut(): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, { method: "POST" });
}

// Restores the session on load. Resolves to null rather than throwing when
// signed out, so callers can show the login page without a console error.
export async function getMe(): Promise<Vendor | null> {
  const res = await fetch(`${API_URL}/auth/me`, { cache: "no-store" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`GET me failed: ${res.status}`);
  return res.json();
}

// The "Edit Profile" form (design: "Vendor: Settings"). Only the fields
// present are changed; businessPhone/logoDataUrl clear to null when sent
// as "".
export type UpdateVendorInput = Partial<{
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  logoDataUrl: string;
  ownerName: string;
  category: VendorCategory;
  themeColor: ThemeColor;
}>;

export async function updateVendorProfile(input: UpdateVendorInput): Promise<Vendor> {
  const res = await vendorFetch("/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 400) {
    const body: { error: string; fields?: string[] } = await res.json();
    throw new ValidationError(body.error, body.fields ?? []);
  }
  if (!res.ok) throw new Error(`PATCH auth/me failed: ${res.status}`);
  return res.json();
}

// Plain fetch, not vendorFetch: a 401 here means "wrong current password",
// a form error to show inline — not "no session", which would wrongly send
// the browser to the login page (the same reasoning as signUp/logIn above).
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (res.status === 400 || res.status === 401) {
    const body: { error: string; fields?: string[] } = await res.json();
    throw new ValidationError(body.error, body.fields ?? []);
  }
  if (!res.ok) throw new Error(`POST change-password failed: ${res.status}`);
}

// Forgot password. Both use plain fetch: they're called signed out, and a
// 400 is a form error to show, not a redirect.
export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (res.status === 400) {
    const body: { error: string; fields?: string[] } = await res.json();
    throw new ValidationError(body.error, body.fields ?? []);
  }
  if (!res.ok) throw new Error(`POST forgot-password failed: ${res.status}`);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  if (res.status === 400) {
    const body: { error: string; fields?: string[] } = await res.json();
    throw new ValidationError(body.error, body.fields ?? []);
  }
  if (!res.ok) throw new Error(`POST reset-password failed: ${res.status}`);
}

// Sign in with Google. Both use plain fetch (called signed out; a 401/400 is
// a message to show, not a redirect).
export type GoogleSignInResult =
  | { status: "signed_in"; vendor: Vendor }
  | { status: "needs_setup"; ticket: string; email: string; name: string };

export async function googleSignIn(credential: string): Promise<GoogleSignInResult> {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (res.status === 401) {
    const body: { error: string } = await res.json();
    throw new ValidationError(body.error, []);
  }
  if (!res.ok) throw new Error(`POST google failed: ${res.status}`);
  return res.json();
}

export type GoogleSignUpInput = {
  ticket: string;
  businessName: string;
  businessAddress: string;
  businessPhone?: string;
  logoDataUrl?: string;
  ownerName: string;
  category: VendorCategory | "";
};

export async function googleSignUp(input: GoogleSignUpInput): Promise<Vendor> {
  const res = await fetch(`${API_URL}/auth/google/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 400 || res.status === 409) {
    const body: { error: string; fields?: string[] } = await res.json();
    throw new ValidationError(body.error, body.fields ?? []);
  }
  if (!res.ok) throw new Error(`POST google/signup failed: ${res.status}`);
  return res.json();
}
