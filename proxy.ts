import { NextRequest, NextResponse } from "next/server";

// UX-layer gate for the vendor pages: just checks the session cookie is
// present, so a signed-out visitor is bounced to the login page before a
// protected page even starts loading, instead of flashing it and then
// erroring on the first API call. Not the security boundary — the cookie
// isn't verified here (that needs the JWT secret, which this doesn't have
// and shouldn't), so every vendor API route still checks it for real via
// requireVendor. This is httpOnly, which only blocks page JavaScript from
// reading it; this proxy reads the request's Cookie header directly, same
// as any server.
const SESSION_COOKIE = "bad_session";
const PUBLIC_VENDOR_PATHS = ["/vendor/login", "/vendor/signup"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const signedIn = req.cookies.has(SESSION_COOKIE);
  const isPublicPath = PUBLIC_VENDOR_PATHS.includes(pathname);

  if (!signedIn && !isPublicPath) {
    const url = req.nextUrl.clone();
    url.pathname = "/vendor/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (signedIn && isPublicPath) {
    const url = req.nextUrl.clone();
    url.pathname = "/vendor";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/vendor/:path*",
};
