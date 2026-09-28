import type { NextConfig } from "next";

// Where before-you-dispatch-api runs. Read by the server only; browsers never
// see it. NEXT_PUBLIC_API_URL is the old name, still accepted.
const apiUrl = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Tunnels (ngrok) for testing on a real phone over https.
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.app",
    "*.ngrok.io",
  ],

  // The browser calls the API through this app at /api, so the app and the
  // API share one address: one ngrok tunnel covers both, no CORS in the
  // browser, and (week 2) the login cookie stays first-party.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/:path*` }];
  },
};

export default nextConfig;
