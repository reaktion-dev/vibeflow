"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

// Convenience hooks & actions
export const useSession = () => authClient.useSession();
export const useAuth = () => authClient;
export const signOut = () => authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/sign-in"; } } });
