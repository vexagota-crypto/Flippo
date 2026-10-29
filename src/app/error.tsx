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

    // If ChunkLoadError or stale deployment chunk, automatically reload page once
    const isChunkError =
      error?.name === "ChunkLoadError" ||
      error?.message?.includes("Loading chunk") ||
      error?.message?.includes("Failed to fetch dynamically imported module");

    if (isChunkError && typeof window !== "undefined") {
      const storageKey = "flippo_chunk_reload";
      const lastReload = sessionStorage.getItem(storageKey);
      if (!lastReload) {
        sessionStorage.setItem(storageKey, "1");
        window.location.reload();
      }
    }
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
          onClick={() => {
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("flippo_chunk_reload");
            }
            reset();
          }}
          className="font-black px-6"
        >
          Try Again
        </Button>
      </Surface>
    </div>
  );
}
