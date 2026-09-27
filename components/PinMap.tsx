"use client";

import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type LatLng = { lat: number; lng: number };

type Props = {
  pin: LatLng;
  // Bumped whenever the map should pan to the pin (geolocation, search);
  // dragging the pin doesn't bump it, so the map stays put while fine-tuning.
  recenterKey: number;
  onPinChange: (pin: LatLng) => void;
};

// Leaflet's default marker images don't survive bundling, so draw the pin
// with CSS instead.
const pinIcon = L.divIcon({
  className: "",
  html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#dc2626;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);transform:rotate(-45deg)"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

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

export default function PinMap({ pin, recenterKey, onPinChange }: Props) {
  return (
    <MapContainer
      center={[pin.lat, pin.lng]}
      zoom={16}
      scrollWheelZoom
      className="h-72 w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[pin.lat, pin.lng]}
        icon={pinIcon}
        draggable
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
