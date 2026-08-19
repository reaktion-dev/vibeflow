import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auth — Vibeflow",
  description: "Sign in or create your Vibeflow account",
};

/**
 * Full-page centred layout for all auth pages (/sign-in, /sign-up, /forgot-password).
 * Animated dual-blob radial gradient, brand logo, no sidebar.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        position: "relative",
        overflow: "hidden",
        background: "var(--background)",
      }}
    >
      {/* Animated radial glow blobs */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "55%",
            aspectRatio: "1",
            borderRadius: "50%",
            background: "radial-gradient(circle, oklch(0.5699 0.1271 238.3563 / 0.18) 0%, transparent 70%)",
            animation: "auth-blob-1 12s ease-in-out infinite alternate",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-15%",
            right: "-10%",
            width: "45%",
            aspectRatio: "1",
            borderRadius: "50%",
            background: "radial-gradient(circle, oklch(0.6770 0.1511 36.8636 / 0.12) 0%, transparent 70%)",
            animation: "auth-blob-2 14s ease-in-out infinite alternate",
          }}
        />
      </div>

      <style>{`
        @keyframes auth-blob-1 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(6%, 8%) scale(1.08); }
        }
        @keyframes auth-blob-2 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(-5%, -6%) scale(1.06); }
        }
      `}</style>

      {/* Brand mark */}
      <div style={{ position: "relative", zIndex: 1, marginBottom: "2rem", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: "2rem",
              height: "2rem",
              borderRadius: "0.5rem",
              background: "linear-gradient(135deg, var(--primary) 0%, oklch(0.6770 0.1511 36.8636) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px oklch(0.5699 0.1271 238.3563 / 0.4)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 700,
              fontSize: "1.25rem",
              color: "var(--foreground)",
              letterSpacing: "-0.02em",
            }}
          >
            Vibeflow
          </span>
        </div>
        <p style={{ marginTop: "0.25rem", fontSize: "0.8125rem", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
          Agentic Development & Content Creation Platform
        </p>
      </div>

      {/* Page card */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}
