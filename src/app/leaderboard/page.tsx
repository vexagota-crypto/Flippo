"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Surface } from "@/components/ui/surface";
import { Trophy, Flame, Sparkles } from "lucide-react";

export default function LeaderboardPage() {
  const [tab, setTab] = useState<"rewards" | "streak">("rewards");
  const [timeFrame, setTimeFrame] = useState<"24h" | "7d" | "all">("all");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?by=${tab}&timeFrame=${timeFrame}&limit=50`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, timeFrame]);

  return (
    <main className="min-h-screen flex flex-col bg-[#F4FAFF] text-[#0B0B14]">
      <Navbar />

      <div className="pt-28 pb-16 px-4 sm:px-6 max-w-5xl mx-auto w-full flex flex-col gap-8">
        <div className="text-center max-w-xl mx-auto">
          <div className="inline-block transform rotate-1 mb-2">
            <span className="px-3.5 py-1 bg-[#FFE66B] text-[#0B0B14] font-mono text-xs font-black rounded-full border-2 border-[#0B0B14] shadow-[0_2px_0_#0B0B14]">
              top flippers
            </span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-[#0B0B14] tracking-tight">
            Hall of Flips Leaderboard
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#0B0B14]/80">
            Real on-chain flippers ranked by cumulative ETH earned and longest prediction streaks.
          </p>
        </div>

        <Surface
          tone="white"
          radius="xl"
          className="p-6 sm:p-8 bg-white border-[3px] border-[#0B0B14] shadow-[0_6px_0_#0B0B14] flex flex-col gap-6"
        >
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-[#0B0B14]/10 pb-4">
            <div className="flex p-1 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-full">
              <button
                type="button"
                onClick={() => setTab("rewards")}
                className={`px-4 py-1.5 text-xs font-display font-black rounded-full cursor-pointer transition-colors ${
                  tab === "rewards" ? "bg-[#0B0B14] text-white" : "text-[#0B0B14]"
                }`}
              >
                Top ETH Earned
              </button>
              <button
                type="button"
                onClick={() => setTab("streak")}
                className={`px-4 py-1.5 text-xs font-display font-black rounded-full cursor-pointer transition-colors ${
                  tab === "streak" ? "bg-[#0B0B14] text-white" : "text-[#0B0B14]"
                }`}
              >
                Longest Streak
              </button>
            </div>

            {tab === "rewards" && (
              <div className="flex p-1 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-full">
                {(["24h", "7d", "all"] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeFrame(tf)}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-full cursor-pointer transition-colors uppercase ${
                      timeFrame === tf ? "bg-[#FE2D88] text-white" : "text-[#0B0B14]"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-2.5">
            {loading ? (
              <div className="py-16 text-center font-mono text-xs text-[#0B0B14]/50">
                Loading protocol rankings...
              </div>
            ) : data.length === 0 ? (
              <div className="py-16 text-center font-mono text-xs text-[#0B0B14]/60 bg-[#F4FAFF] rounded-[20px] border-2 border-[#0B0B14]/10">
                No flips logged for this timeframe yet.
              </div>
            ) : (
              data.map((item, idx) => {
                const medals = ["🥇", "🥈", "🥉"];
                const rankDisplay = medals[idx] || `#${idx + 1}`;
                const formattedAddr = `${item.address.slice(0, 8)}...${item.address.slice(-6)}`;

                return (
                  <div
                    key={item.address + idx}
                    className="flex items-center justify-between p-4 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-[18px] hover:bg-white transition-all shadow-[0_2px_0_#0B0B14]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-center font-display font-black text-base sm:text-lg">
                        {rankDisplay}
                      </span>
                      <div>
                        <span className="font-mono text-xs sm:text-sm font-bold text-[#0B0B14] block">
                          {formattedAddr}
                        </span>
                        {item.totalFlips !== undefined && (
                          <span className="text-[10px] font-mono text-[#0B0B14]/60">
                            {item.totalFlips} flips recorded
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-base sm:text-lg font-black text-[#0B0B14]">
                        {tab === "rewards" ? `${item.score} ETH` : `${item.score} streak`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Surface>
      </div>

      <Footer />
    </main>
  );
}
