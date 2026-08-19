"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { AuthCard } from "./auth-card";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.875rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid oklch(0.4100 0.0316 268.3338 / 0.6)",
  background: "oklch(0.2759 0.0325 261.6825 / 0.5)",
  color: "var(--foreground)",
  fontSize: "0.875rem",
  fontFamily: "var(--font-sans)",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

const primaryBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem 1rem",
  borderRadius: "var(--radius-md)",
  border: "none",
  background: "var(--primary)",
  color: "var(--primary-foreground)",
  fontSize: "0.875rem",
  fontFamily: "var(--font-sans)",
  fontWeight: 600,
  cursor: "pointer",
  transition: "opacity 0.2s",
  marginTop: "0.25rem",
};

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthCard
        title="Check your inbox"
        description={`We sent a reset link to ${email}`}
        footer={
<Link
            href="/sign-in"
            style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}
          >
            ← Back to sign in
          </Link>
        }
      >
        <div
          style={{
            textAlign: "center",
            padding: "1rem 0",
            color: "var(--muted-foreground)",
            fontSize: "0.875rem",
            fontFamily: "var(--font-sans)",
          }}
        >
          <div
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "50%",
              background: "oklch(0.5699 0.1271 238.3563 / 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          Didn&apos;t receive it? Check your spam folder or{" "}
          <button
            type="button"
            onClick={() => setSent(false)}
            style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", padding: 0, font: "inherit" }}
          >
            try again
          </button>
          .
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot password?"
      description="Enter your email and we'll send you a reset link"
      footer={
        <Link
          href="/sign-in"
          style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}
        >
          ← Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label
            htmlFor="forgot-email"
            style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "var(--foreground)", fontFamily: "var(--font-sans)", marginBottom: "0.375rem" }}
          >
            Email address
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "oklch(0.4100 0.0316 268.3338 / 0.6)")}
          />
        </div>

        {error && (
          <p style={{ fontSize: "0.8125rem", color: "var(--destructive)", fontFamily: "var(--font-sans)", margin: 0, padding: "0.5rem 0.75rem", background: "oklch(0.6750 0.1793 23.1830 / 0.1)", borderRadius: "var(--radius-sm)", border: "1px solid oklch(0.6750 0.1793 23.1830 / 0.3)" }}>
            {error}
          </p>
        )}

        <button
          id="forgot-submit-btn"
          type="submit"
          disabled={loading}
          style={{ ...primaryBtnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthCard>
  );
}
