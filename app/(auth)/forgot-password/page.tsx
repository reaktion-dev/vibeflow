import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password — Vibeflow",
  description: "Reset your Vibeflow account password",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
