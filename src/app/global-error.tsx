"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global boundary error:", error);

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
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center p-4 bg-[#F4FAFF] font-sans">
        <div className="p-8 bg-white border-[3px] border-[#0B0B14] rounded-[28px] shadow-[0_8px_0_#0B0B14] max-w-md w-full text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#E5484D] border-[3px] border-[#0B0B14] text-white flex items-center justify-center text-3xl font-black">
            !
          </div>
          <h2 className="font-black text-2xl text-[#0B0B14]">
            Something tripped up!
          </h2>
          <p className="text-xs text-[#0B0B14]/80">
            A critical error occurred while loading this page.
          </p>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                sessionStorage.removeItem("flippo_chunk_reload");
              }
              reset();
            }}
            className="h-11 px-6 bg-[#FE2D88] text-white border-[3px] border-[#0B0B14] rounded-full font-black text-sm shadow-[0_4px_0_#0B0B14] active:translate-y-0.5 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}

