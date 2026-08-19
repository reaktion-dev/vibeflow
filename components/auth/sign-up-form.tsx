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

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: callbackUrl,
      });
      if (result.error) {
        setError(result.error.message ?? "Could not create account.");
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

  const focusBorder = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "var(--primary)";
  };
  const blurBorder = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "oklch(0.4100 0.0316 268.3338 / 0.6)";
  };

  return (
    <AuthCard
      title="Create an account"
      description="Get started with Vibeflow today"
      footer={
        <span>
          Already have an account?{" "}
          <Link
            href="/sign-in"
            style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}
          >
            Sign in
          </Link>
        </span>
      }
    >
      <OAuthButtons callbackURL={callbackUrl} />
      <AuthDivider />

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label htmlFor="signup-name" style={labelStyle}>Full name</label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            style={inputStyle}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />
        </div>

        <div>
          <label htmlFor="signup-email" style={labelStyle}>Email</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />
        </div>

        <div>
          <label htmlFor="signup-password" style={labelStyle}>Password</label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            style={inputStyle}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />
        </div>

        <div>
          <label htmlFor="signup-confirm" style={labelStyle}>Confirm password</label>
          <input
            id="signup-confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            style={inputStyle}
            onFocus={focusBorder}
            onBlur={blurBorder}
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
          id="signup-submit-btn"
          type="submit"
          disabled={loading}
          style={{ ...primaryBtnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}
