"use client";

import React, { useEffect } from "react";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App boundary error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F4FAFF]">
      <Surface
        tone="white"
        radius="xl"
        className="p-8 bg-white border-[3px] border-[#0B0B14] shadow-[0_8px_0_#0B0B14] max-w-md w-full text-center flex flex-col items-center gap-4"
      >
        <div className="w-16 h-16 rounded-full bg-[#E5484D] border-[3px] border-[#0B0B14] text-white flex items-center justify-center text-3xl font-black">
          !
        </div>

        <h2 className="font-display font-black text-2xl text-[#0B0B14]">
          Something tripped up!
        </h2>
        <p className="font-body text-xs text-[#0B0B14]/80">
          An unexpected error occurred. You can retry safely.
        </p>

        <Button
          variant="pink"
          size="md"
          onClick={() => reset()}
          className="font-black px-6"
        >
          Try Again
        </Button>
      </Surface>
    </div>
  );
}
