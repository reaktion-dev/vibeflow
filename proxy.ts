import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/** Routes that do NOT require authentication */
const PUBLIC_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/api/auth",  // all better-auth API routes
  "/api/assets", // direct asset image resolver
];

/** Exact-match public routes (prefix matching would expose everything under them) */
const PUBLIC_EXACT = ["/"]; // landing page must be reachable by guests

/** Routes that authenticated users should be bounced away from */
const AUTH_ONLY_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
];

function isPublic(pathname: string) {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAuthOnlyRoute(pathname: string) {
  return AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for Better Auth session cookie before making database calls
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token") ||
    request.cookies.get("better_auth.session_token") ||
    request.cookies.get("__Secure-better_auth.session_token");

  let isAuthenticated = false;

  if (sessionCookie?.value) {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });
      isAuthenticated = !!session;
    } catch (err) {
      console.warn("[proxy] Session validation error (recovering as unauthenticated):", err);
      isAuthenticated = false;
    }
  }

  // Authenticated users visiting auth pages → redirect to app
  if (isAuthenticated && isAuthOnlyRoute(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Unauthenticated users visiting protected pages → redirect to sign-in
  if (!isAuthenticated && !isPublic(pathname)) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
