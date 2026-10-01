// Free place search for the pin step (CLAUDE.md: no paid map account).
// Two OpenStreetMap-based services, since neither finds everything:
//  - Photon (photon.komoot.io): fuzzy and partial-name friendly, and can
//    favour results near a point, which suits "Lekki Phase 1" typed by
//    someone standing in Lekki. Light enough to call while typing (debounced).
//  - Nominatim: better at exact street/estate names. Its usage policy forbids
//    search-as-you-type, so it only runs when the customer submits.

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
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, { signal });
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

async function nominatim(q: string, near: Near | undefined, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ q, format: "json", limit: "5", countrycodes: "ng" });
  if (near) {
    // A bias, not a limit (no `bounded`): about 0.5 degrees, ~50 km, around them.
    const d = 0.5;
    params.set("viewbox", `${near.lng - d},${near.lat + d},${near.lng + d},${near.lat - d}`);
  }
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal });
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

// While typing: Photon only.
export async function suggestPlaces(q: string, near?: Near, signal?: AbortSignal): Promise<Place[]> {
  try {
    return await photon(q, near, signal);
  } catch {
    return [];
  }
}

// On submit: both, Photon's results first. One failing doesn't hide the other.
export async function searchPlaces(q: string, near?: Near, signal?: AbortSignal): Promise<Place[]> {
  const [a, b] = await Promise.allSettled([photon(q, near, signal), nominatim(q, near, signal)]);
  return merge([a.status === "fulfilled" ? a.value : [], b.status === "fulfilled" ? b.value : []]);
}
