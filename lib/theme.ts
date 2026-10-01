import { CSSProperties } from "react";
import { ThemeColor } from "./api";

// The "Workspace theme" swatch picker (design: "Vendor: Settings") re-tints
// the vendor's own dashboard chrome to a single hue — both the --brand
// family (secondary buttons, the sidebar tint, borders, links) and --accent
// (primary buttons, the sidebar's active indicator, highlighted stats and
// badges), so the whole workspace reads as one color rather than two.
// "green" is special-cased to mean *no* override: it's today's actual
// shipped look (brand green + accent crimson, unchanged), so a vendor who
// never opens this picker sees no difference — see themeStyle() below.
// Either way, the "WakaRoute" brand mark (the logo pin) and the
// customer/rider pages never change, matching the design's own copy: "the
// WakaRoute brand stays the same everywhere else."
type ThemeTokens = {
  label: string;
  swatch: string;
  brand: string;
  brandDark: string;
  brandTint: string;
  brandLine: string;
};

export const THEME_PRESETS: Record<ThemeColor, ThemeTokens> = {
  // The app's own default green — identical to the tokens already in
  // globals.css, so a vendor who never touches this setting sees no change.
  green: {
    label: "Green",
    swatch: "#065F46",
    brand: "#065F46",
    brandDark: "#064E3B",
    brandTint: "#ECFDF5",
    brandLine: "#A7D8C4",
  },
  crimson: {
    label: "Crimson",
    swatch: "#9F1239",
    brand: "#9F1239",
    brandDark: "#7A0F2E",
    brandTint: "#FDF2F4",
    brandLine: "#DDACBA",
  },
  navy: {
    label: "Navy",
    swatch: "#1E3A5F",
    brand: "#1E3A5F",
    brandDark: "#182E4C",
    brandTint: "#EDEFF2",
    brandLine: "#B0BAC7",
  },
  amber: {
    label: "Amber",
    swatch: "#7C4A03",
    brand: "#7C4A03",
    brandDark: "#633B02",
    brandTint: "#F5F1EB",
    brandLine: "#D1C0A7",
  },
  purple: {
    label: "Purple",
    swatch: "#4A2E6B",
    brand: "#4A2E6B",
    brandDark: "#3B2556",
    brandTint: "#F1EEF3",
    brandLine: "#C0B6CB",
  },
};

export const THEME_COLOR_ORDER: ThemeColor[] = [
  "green",
  "crimson",
  "navy",
  "amber",
  "purple",
];

// CSS custom-property overrides for the given theme, to spread onto the
// vendor shell's root style — see AppShell.tsx. "green" returns {}: it's
// today's real default (brand green + accent crimson), not a re-tint.
export function themeStyle(color: ThemeColor): CSSProperties {
  if (color === "green") return {};
  const t = THEME_PRESETS[color];
  return {
    "--brand": t.brand,
    "--brand-dark": t.brandDark,
    "--brand-tint": t.brandTint,
    "--brand-line": t.brandLine,
    "--accent": t.brand,
    "--accent-dark": t.brandDark,
  } as CSSProperties;
}
