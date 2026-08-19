import React from "react";

interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Shared glassmorphism card shell for all auth pages.
 * Keeps a consistent visual language across sign-in / sign-up / forgot-password.
 */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div
      style={{
        background: "oklch(0.3298 0.0317 267.2395 / 0.7)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid oklch(0.4100 0.0316 268.3338 / 0.5)",
        borderRadius: "var(--radius-xl)",
        boxShadow:
          "0 8px 32px oklch(0 0 0 / 0.4), inset 0 1px 0 oklch(1 0 0 / 0.06)",
        padding: "2.5rem",
        width: "100%",
        maxWidth: "26rem",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "1.75rem", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            fontFamily: "var(--font-serif)",
            color: "var(--foreground)",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              marginTop: "0.4rem",
              fontSize: "0.875rem",
              color: "var(--muted-foreground)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {description}
          </p>
        )}
      </div>

      {/* Content */}
      <div>{children}</div>

      {/* Footer */}
      {footer && (
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid oklch(0.4100 0.0316 268.3338 / 0.4)",
            textAlign: "center",
            fontSize: "0.8125rem",
            color: "var(--muted-foreground)",
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
