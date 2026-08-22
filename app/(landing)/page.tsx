"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingPromptArea } from "@/components/landing/landing-prompt-area";

export default function LandingPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handlePromptSubmit = async (message: { text: string; files: any[] }) => {
    if (!message.text.trim()) return;
    setIsCreating(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: message.text.slice(0, 100),
          description: message.text,
          template: "blank",
        }),
      });

      const json = await res.json().catch(() => null);

      if (res.status === 401 || json?.error?.includes('Unauthorized')) {
        // Store prompt in sessionStorage and redirect to sign-in
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('pendingPrompt', message.text.trim());
        }
        toast('Please sign in to generate your project', { icon: '✨' });
        router.push('/sign-in?callbackUrl=/dashboard');
        return;
      }

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to create project");
      }

      router.push(`/projects/${json.data.id}?initialPrompt=${encodeURIComponent(message.text.trim())}`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create project"
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <LandingHero />

      <div className="flex w-full justify-center pt-4">
        <LandingPromptArea
          onSubmit={handlePromptSubmit}
          isCreating={isCreating}
        />
      </div>
    </>
  );
}
