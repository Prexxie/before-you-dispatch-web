"use client";

import { useEffect, useMemo } from "react";
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
  onPinChange: (pin: LatLng) => void;
  // "Drag to your exact spot" label above the pin (design: Pin + Landmark).
  showTip?: boolean;
};

// The design's crimson pin, drawn as HTML so it survives bundling (Leaflet's
// default marker images don't). Anchored at the pin's point.
function pinIcon(showTip: boolean) {
  const tip = showTip
    ? '<span class="map-pin-tip" style="margin-bottom:6px">Drag to your exact spot</span>'
    : "";
  return L.divIcon({
    className: "",
    html: `<div style="position:absolute;left:0;bottom:0;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center">${tip}${MAP_PIN_SVG}</div>`,
    // Zero-size anchor element at the location; the pin hangs above it. The
    // pin's point is 3px above the SVG's bottom edge, hence the -3.
    iconSize: [0, 0],
    iconAnchor: [0, -3],
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

function TapToMove({ onPinChange }: Pick<Props, "onPinChange">) {
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
}: Props) {
  const icon = useMemo(() => pinIcon(showTip), [showTip]);
  return (
    <MapContainer
      center={[pin.lat, pin.lng]}
      zoom={16}
      scrollWheelZoom
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker
        position={[pin.lat, pin.lng]}
        icon={icon}
        draggable
        keyboard={false}
        eventHandlers={{
          dragend: (e) => {
            const { lat, lng } = (e.target as L.Marker).getLatLng();
            onPinChange({ lat, lng });
          },
        }}
      />
      <Recenter pin={pin} recenterKey={recenterKey} />
      <TapToMove onPinChange={onPinChange} />
    </MapContainer>
  );
}
