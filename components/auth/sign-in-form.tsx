"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { AuthCard } from "./auth-card";
import { OAuthButtons, AuthDivider } from "./oauth-buttons";

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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8125rem",
  fontWeight: 500,
  color: "var(--foreground)",
  fontFamily: "var(--font-sans)",
  marginBottom: "0.375rem",
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

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: callbackUrl,
      });
      if (result.error) {
        setError(result.error.message ?? "Invalid credentials.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your account to continue"
      footer={
        <span>
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}
          >
            Sign up
          </Link>
        </span>
      }
    >
      <OAuthButtons callbackURL={callbackUrl} />
      <AuthDivider />

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label htmlFor="signin-email" style={labelStyle}>Email</label>
          <input
            id="signin-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--primary)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor =
                "oklch(0.4100 0.0316 268.3338 / 0.6)")
            }
          />
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
            <label htmlFor="signin-password" style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
            <Link
              href="/forgot-password"
              style={{ fontSize: "0.75rem", color: "var(--primary)", textDecoration: "none" }}
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="signin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--primary)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor =
                "oklch(0.4100 0.0316 268.3338 / 0.6)")
            }
          />
        </div>

        {error && (
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--destructive)",
              fontFamily: "var(--font-sans)",
              margin: 0,
              padding: "0.5rem 0.75rem",
              background: "oklch(0.6750 0.1793 23.1830 / 0.1)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid oklch(0.6750 0.1793 23.1830 / 0.3)",
            }}
          >
            {error}
          </p>
        )}

        <button
          id="signin-submit-btn"
          type="submit"
          disabled={loading}
          style={{ ...primaryBtnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthCard>
  );
}
