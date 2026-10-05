// Map tiles and place search come from HERE (developer.here.com) when
// NEXT_PUBLIC_HERE_API_KEY is set: their own map data, which is fuller than
// OpenStreetMap in Nigeria. Without a key everything falls back to plain
// OpenStreetMap, so the app still works.
export const HERE_KEY = process.env.NEXT_PUBLIC_HERE_API_KEY ?? "";

// 512px tiles, drawn at half size by PinMap so they're sharp on phones.
export const STREET_TILES = HERE_KEY
  ? `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/png8?style=explore.day&size=512&apiKey=${HERE_KEY}`
  : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

// Satellite with road and place labels on top: lets customers spot their own
// gate and roof. Only offered with a key.
export const SATELLITE_TILES = HERE_KEY
  ? `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/png8?style=explore.satellite.day&size=512&apiKey=${HERE_KEY}`
  : null;

export const MAP_ATTRIBUTION = HERE_KEY ? "© HERE" : "© OpenStreetMap";

export const MAP_ATTRIBUTION_URL = HERE_KEY
  ? "https://legal.here.com/en-gb/terms"
  : "https://www.openstreetmap.org/copyright";
