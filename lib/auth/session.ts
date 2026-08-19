import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Returns the current session from the server.
 * Returns null if the user is not authenticated.
 */
export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

/**
 * Returns the current session or redirects to sign-in.
 * Use in Server Components / Route Handlers that require authentication.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}

/**
 * Returns just the user object, or null if unauthenticated.
 */
export async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}
