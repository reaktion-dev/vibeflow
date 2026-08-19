"use client";

import { useState } from "react";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingPromptArea } from "@/components/landing/landing-prompt-area";

export default function LandingPage() {
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

      if (!res.ok) throw new Error("Failed to create project");
    } catch (error) {
      console.error("Error creating project:", error);
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
