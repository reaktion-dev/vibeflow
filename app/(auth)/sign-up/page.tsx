import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create Account — Vibeflow",
  description: "Create your free Vibeflow account",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
