// Client for before-you-dispatch-api. Shapes mirror the API repo's API.md.

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

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
