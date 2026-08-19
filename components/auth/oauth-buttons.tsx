"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

interface OAuthButtonsProps {
  callbackURL?: string;
}

/**
 * Social OAuth buttons for auth pages.
 * Currently supports GitHub. Extend easily by adding more providers.
 */
export function OAuthButtons({ callbackURL = "/" }: OAuthButtonsProps) {
  const [loadingGithub, setLoadingGithub] = useState(false);

  const handleGitHub = async () => {
    setLoadingGithub(true);
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL,
      });
    } catch {
      setLoadingGithub(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
      <button
        id="oauth-github-btn"
        type="button"
        onClick={handleGitHub}
        disabled={loadingGithub}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.625rem",
          width: "100%",
          padding: "0.625rem 1rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid oklch(0.4100 0.0316 268.3338 / 0.6)",
          background: "oklch(0.3298 0.0317 267.2395 / 0.5)",
          color: "var(--foreground)",
          fontSize: "0.875rem",
          fontFamily: "var(--font-sans)",
          fontWeight: 500,
          cursor: loadingGithub ? "not-allowed" : "pointer",
          opacity: loadingGithub ? 0.7 : 1,
          transition: "background 0.2s, border-color 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!loadingGithub) {
            (e.currentTarget as HTMLButtonElement).style.background =
              "oklch(0.4100 0.0316 268.3338 / 0.5)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "oklch(0.3298 0.0317 267.2395 / 0.5)";
        }}
      >
        {/* GitHub SVG icon */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.873.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
        {loadingGithub ? "Connecting…" : "Continue with GitHub"}
      </button>
    </div>
  );
}

/** Divider between social and email forms */
export function AuthDivider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        margin: "1.25rem 0",
      }}
    >
      <div
        style={{
          flex: 1,
          height: "1px",
          background: "oklch(0.4100 0.0316 268.3338 / 0.4)",
        }}
      />
      <span
        style={{
          fontSize: "0.75rem",
          color: "var(--muted-foreground)",
          fontFamily: "var(--font-sans)",
          whiteSpace: "nowrap",
        }}
      >
        or continue with email
      </span>
      <div
        style={{
          flex: 1,
          height: "1px",
          background: "oklch(0.4100 0.0316 268.3338 / 0.4)",
        }}
      />
    </div>
  );
}
