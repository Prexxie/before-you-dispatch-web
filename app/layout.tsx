import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { BRAND_NAME, TAGLINE } from "@/lib/brand";

// The design's typefaces (canvas wire.css): Fraunces for display, Manrope for
// everything else.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Customers confirm they're ready and share where to find them, before a rider is sent out.";

// The title and preview a shared link shows (WhatsApp, social apps).
export const metadata: Metadata = {
  title: `${BRAND_NAME}: ${TAGLINE}`,
  description: DESCRIPTION,
  openGraph: {
    title: `${BRAND_NAME}: ${TAGLINE}`,
    description: DESCRIPTION,
    siteName: BRAND_NAME,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#064E3B",
  // Light-only design: keeps browsers' automatic dark modes off the page.
  colorScheme: "only light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
