// Free place search for the pin step (CLAUDE.md: no paid map account).
// Two OpenStreetMap-based services, since neither finds everything:
//  - Photon (photon.komoot.io): fuzzy and partial-name friendly, and can
//    favour results near a point, which suits "Lekki Phase 1" typed by
//    someone standing in Lekki. Light enough to call while typing (debounced).
//  - Nominatim: better at exact street/estate names. Its usage policy forbids
//    search-as-you-type, so it only runs when the customer submits.

import { HERE_KEY } from "@/lib/mapConfig";

export type Place = { label: string; lat: number; lng: number };

type Near = { lat: number; lng: number };

// minLon, minLat, maxLon, maxLat: keeps results inside Nigeria.
const NIGERIA_BBOX = "2.6,4.2,14.7,13.9";

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    district?: string;
    locality?: string;
    city?: string;
    county?: string;
    state?: string;
  };
};

function photonLabel(p: PhotonFeature["properties"]): string {
  const street = p.street ? [p.housenumber, p.street].filter(Boolean).join(" ") : undefined;
  const parts = [p.name, street, p.district ?? p.locality, p.city ?? p.county, p.state];
  const seen = new Set<string>();
  return parts
    .filter((x): x is string => Boolean(x) && !seen.has(x as string) && !!seen.add(x as string))
    .join(", ");
}

async function photon(q: string, near: Near | undefined, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ q, limit: "6", bbox: NIGERIA_BBOX });
  if (near) {
    params.set("lat", String(near.lat));
    params.set("lon", String(near.lng));
  }
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, { signal: withTimeout(signal) });
  if (!res.ok) return [];
  const body: { features: PhotonFeature[] } = await res.json();
  return body.features
    .map((f) => ({
      label: photonLabel(f.properties),
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    }))
    .filter((p) => p.label);
}

// HERE's place search (needs NEXT_PUBLIC_HERE_API_KEY): quick, handles partial
// names, and allows search-as-you-type.
async function here(q: string, near: Near | undefined, signal?: AbortSignal): Promise<Place[]> {
  if (!HERE_KEY) return [];
  const params = new URLSearchParams({
    q,
    in: "countryCode:NGA",
    limit: "6",
    apiKey: HERE_KEY,
  });
  if (near) params.set("at", `${near.lat},${near.lng}`);
  const res = await fetch(`https://discover.search.hereapi.com/v1/discover?${params}`, {
    signal: withTimeout(signal),
  });
  if (!res.ok) return [];
  const body: {
    items: { title: string; address?: { label?: string }; position?: { lat: number; lng: number } }[];
  } = await res.json();
  return body.items
    .filter((i) => i.position)
    .map((i) => {
      const full = i.address?.label ?? i.title;
      // Places show "Name, full address"; addresses already start with the title.
      const label = full.startsWith(i.title) ? full : `${i.title}, ${full}`;
      return { label, lat: i.position!.lat, lng: i.position!.lng };
    });
}

async function nominatim(q: string, near: Near | undefined, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ q, format: "json", limit: "5", countrycodes: "ng" });
  if (near) {
    // A bias, not a limit (no `bounded`): about 0.5 degrees, ~50 km, around them.
    const d = 0.5;
    params.set("viewbox", `${near.lng - d},${near.lat + d},${near.lng + d},${near.lat - d}`);
  }
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal: withTimeout(signal) });
  if (!res.ok) return [];
  const rows: { display_name: string; lat: string; lon: string }[] = await res.json();
  return rows.map((r) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }));
}

// Same spot from both services shows once (within ~100 m and the same name
// start would be overkill; rounding to 3 decimals is enough to catch repeats).
function merge(lists: Place[][]): Place[] {
  const seen = new Set<string>();
  const out: Place[] = [];
  for (const p of lists.flat()) {
    const key = `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out.slice(0, 8);
}

// The public servers are sometimes very slow; give up on one after 8 seconds
// instead of leaving the customer waiting.
function withTimeout(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(8000);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

// Repeat searches (retyping, going back) answer instantly.
const cache = new Map<string, Place[]>();
function cacheKey(kind: string, q: string, near?: Near) {
  // Rounded to ~1 km so a small pin move still hits the cache.
  const where = near ? `${near.lat.toFixed(2)},${near.lng.toFixed(2)}` : "";
  return `${kind}|${q.toLowerCase()}|${where}`;
}

// While typing: Photon only.
export async function suggestPlaces(q: string, near?: Near, signal?: AbortSignal): Promise<Place[]> {
  const key = cacheKey("s", q, near);
  const hit = cache.get(key);
  if (hit) return hit;
  try {
    const found = await (HERE_KEY ? here : photon)(q, near, signal);
    cache.set(key, found);
    return found;
  } catch {
    return [];
  }
}

// On submit: both, Photon's results first. One failing doesn't hide the other,
// and `onResults` fires as soon as the first service answers (then again with
// the merged list), so a slow service doesn't hold up the faster one.
export async function searchPlaces(
  q: string,
  near: Near | undefined,
  signal: AbortSignal | undefined,
  onResults: (places: Place[]) => void,
): Promise<void> {
  const key = cacheKey("f", q, near);
  const hit = cache.get(key);
  if (hit) {
    onResults(hit);
    return;
  }
  let a: Place[] = [];
  let b: Place[] = [];
  const settle = (p: Promise<Place[]>, set: (v: Place[]) => void) =>
    p.then(set, () => {}).then(() => {
      if (!signal?.aborted) onResults(merge([a, b]));
    });
  await Promise.all([
    settle((HERE_KEY ? here : photon)(q, near, signal), (v) => (a = v)),
    settle(nominatim(q, near, signal), (v) => (b = v)),
  ]);
  if (!signal?.aborted) cache.set(key, merge([a, b]));
}
