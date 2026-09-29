// Icons from the screen designs (Before You Dispatch — Wireframes v2), so
// every screen draws them the same way.

type IconProps = { size?: number; className?: string };

const PIN_PATH =
  "M12 2C7.58 2 4 5.58 4 10c0 5.25 6.72 11.19 7.01 11.44a1.5 1.5 0 0 0 1.98 0C13.28 21.19 20 15.25 20 10c0-4.42-3.58-8-8-8z";

// Brand mark: crimson pin with a white tick.
export function LogoMark({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d={PIN_PATH} fill="#9F1239" />
      <path d="M8.3 10.3l2.3 2.3 4.6-4.6" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// The map pin: crimson pin with a white dot. Also used as a Leaflet marker.
export const MAP_PIN_SVG = `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${PIN_PATH}" fill="#9F1239"/><circle cx="12" cy="10" r="3" fill="#ffffff"/></svg>`;

// Stroked pin outline: the "rider has arrived" state icon.
export function PinIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={PIN_PATH} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// Pin with a checkmark inside: the "I've Arrived" button.
export function PinCheckIcon({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={PIN_PATH} stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8.3 10.3l2.3 2.3 4.6-4.6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PersonIcon({ size = 14 }: IconProps) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PhoneIcon({ size = 14 }: IconProps) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3h3l2 5-2.5 2a12 12 0 0 0 5.5 5.5l2-2.5 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function PackageIcon({ size = 14 }: IconProps) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 8l9-5 9 5-9 5-9-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M3 8v9l9 5 9-5V8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 13v9" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function RiderIcon({ size = 14 }: IconProps) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="6" cy="17" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="17" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M6 17l4-8h4l4 8M10 9h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LinkIcon({ size = 14, className }: IconProps) {
  return (
    <svg className={className ?? "icon"} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function NoteIcon({ size = 14 }: IconProps) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 21V5a2 2 0 0 1 2-2h7l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 12h8M8 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.07-1.33A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" opacity="0.15" />
      <path d="M17.3 14.15c-.28-.14-1.66-.82-1.92-.91-.26-.1-.44-.14-.63.14-.19.28-.72.91-.89 1.1-.16.19-.33.21-.6.07-.28-.14-1.18-.44-2.24-1.39-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.5.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.5-.07-.14-.63-1.52-.87-2.08-.23-.55-.46-.48-.63-.49h-.54c-.19 0-.5.07-.76.35-.26.28-1 .98-1 2.4 0 1.41 1.03 2.78 1.17 2.97.14.19 2.03 3.1 4.93 4.35.69.3 1.22.48 1.64.61.69.22 1.31.19 1.81.11.55-.08 1.66-.68 1.9-1.34.23-.65.23-1.21.16-1.33-.07-.11-.26-.19-.54-.32z" />
    </svg>
  );
}

export function BackIcon({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ForwardIcon({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SearchIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LocateIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HistoryIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MinusCircleIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AlertIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7.5v5.5M12 16.5v.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function DirectionsIcon({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 11l19-9-9 19-2-8-8-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function CrossIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function StoreIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 9l1.5-5h15L21 9M3 9h18M4 9v11h16V9M9 20v-6h6v6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function MessageIcon({ size = 14 }: IconProps) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5h16v11H8l-4 4V5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function ClockIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LockIcon({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// Small "next stop" marker for a muted, secondary destination line.
export function NextStopIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
