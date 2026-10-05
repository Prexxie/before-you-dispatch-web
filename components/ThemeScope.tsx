import { cookies } from "next/headers";
import { ReactNode } from "react";
import { THEME_COOKIE } from "@/lib/api";
import { THEME_PRESETS, themeStyle } from "@/lib/theme";

const SESSION_COOKIE = "bad_session"; // same cookie proxy.ts checks

// Paints the vendor's accent colour on the first frame of the pages that use
// AppShell. The saved colour lives on the account and only arrives with
// /auth/me, so without this each page would show the default green until
// that call finished, then switch. The last-known colour is kept in a cookie
// (see rememberTheme in lib/api.ts); this puts it on a wrapper that
// AppShell's own theme, once the vendor has loaded, simply agrees with.
export default async function ThemeScope({ children }: { children: ReactNode }) {
  const jar = await cookies();
  const saved = jar.get(THEME_COOKIE)?.value;
  const color =
    jar.has(SESSION_COOKIE) && saved && saved in THEME_PRESETS
      ? (saved as keyof typeof THEME_PRESETS)
      : null;
  return (
    // display: contents so the wrapper adds no box of its own.
    <div className="contents" style={color ? themeStyle(color) : undefined}>
      {children}
    </div>
  );
}
