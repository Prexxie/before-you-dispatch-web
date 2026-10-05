"use client";

import { useEffect, useMemo, useState } from "react";
import { HERE_KEY, SATELLITE_TILES, STREET_TILES } from "@/lib/mapConfig";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_PIN_SVG } from "./icons";

export type LatLng = { lat: number; lng: number };

type Props = {
  pin: LatLng;
  // Bumped whenever the map should pan to the pin (geolocation, search);
  // dragging the pin doesn't bump it, so the map stays put while fine-tuning.
  recenterKey: number;
  onPinChange?: (pin: LatLng) => void;
  // "Drag to your exact spot" label above the pin (design: Pin + Landmark).
  showTip?: boolean;
  // Rider's view: the pin can't be moved.
  readOnly?: boolean;
};

// The design's crimson pin, drawn as HTML so it survives bundling (Leaflet's
// default marker images don't). Anchored at the pin's point.
function pinIcon(showTip: boolean) {
  // The tip floats above the pin and ignores touches, so only the pin itself
  // is the drag handle.
  const tip = showTip
    ? '<span class="map-pin-tip" style="position:absolute;left:50%;bottom:100%;transform:translateX(-50%);margin-bottom:6px;pointer-events:none">Drag to your exact spot</span>'
    : "";
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:48px;height:48px;display:flex;align-items:flex-end;justify-content:center;cursor:grab;touch-action:none">${tip}${MAP_PIN_SVG}</div>`,
    // A real 48px box (a comfortable finger-sized drag handle; a zero-size
    // icon was too hard to grab). The pin's point is 3px above the SVG's
    // bottom edge, so the anchor sits 3px above the box's bottom.
    iconSize: [48, 48],
    iconAnchor: [24, 45],
  });
}

function Recenter({ pin, recenterKey }: Pick<Props, "pin" | "recenterKey">) {
  const map = useMap();
  useEffect(() => {
    map.setView([pin.lat, pin.lng], Math.max(map.getZoom(), 16));
    // Only react to explicit recenter requests, not every pin move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterKey, map]);
  return null;
}

// The map stays mounted (hidden) while the customer goes back a step, so their
// pin and notes are still there when they come forward. Leaflet measures its
// container once, so re-measure whenever it changes size, such as when it is
// shown again.
function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(el);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function TapToMove({ onPinChange }: { onPinChange: (pin: LatLng) => void }) {
  useMapEvents({
    click: (e) => onPinChange({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

// The page draws the zoom-free chrome from the design (search, locate,
// chip, attribution) over this map; pinch, scroll and double-tap still zoom.
export default function PinMap({
  pin,
  recenterKey,
  onPinChange,
  showTip = false,
  readOnly = false,
}: Props) {
  const editable = !readOnly && onPinChange !== undefined;
  const icon = useMemo(() => pinIcon(showTip), [showTip]);
  const [satellite, setSatellite] = useState(false);
  return (
    <>
    <MapContainer
      center={[pin.lat, pin.lng]}
      zoom={16}
      scrollWheelZoom
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        key={satellite ? "sat" : "street"}
        url={satellite && SATELLITE_TILES ? SATELLITE_TILES : STREET_TILES}
        maxZoom={19}
        // HERE tiles are 512px drawn at 256 (sharp on phones).
        {...(HERE_KEY ? { tileSize: 512, zoomOffset: -1 } : {})}
      />
      <Marker
        position={[pin.lat, pin.lng]}
        icon={icon}
        draggable={editable}
        interactive={editable}
        keyboard={false}
        eventHandlers={{
          dragend: (e) => {
            const { lat, lng } = (e.target as L.Marker).getLatLng();
            onPinChange?.({ lat, lng });
          },
        }}
      />
      <Recenter pin={pin} recenterKey={recenterKey} />
      <InvalidateOnResize />
      {editable && <TapToMove onPinChange={onPinChange} />}
    </MapContainer>
    {SATELLITE_TILES && (
      <button
        type="button"
        onClick={() => setSatellite((s) => !s)}
        aria-pressed={satellite}
        style={{
          position: "absolute",
          right: 12,
          bottom: 66,
          zIndex: 1000,
          height: 32,
          padding: "0 12px",
          borderRadius: 999,
          border: "none",
          background: "#ffffff",
          color: "var(--brand-dark)",
          fontSize: 12,
          fontWeight: 700,
          boxShadow: "0 4px 12px -4px rgba(28, 25, 23, 0.3)",
          cursor: "pointer",
        }}
      >
        {satellite ? "Map" : "Satellite"}
      </button>
    )}
    </>
  );
}
