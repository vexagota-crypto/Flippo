"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Surface } from "@/components/ui/surface";
import { Trophy, Flame, ChevronRight, Medal } from "lucide-react";

export function HallOfFlips() {
  const [tab, setTab] = useState<"rewards" | "streak">("rewards");
  const [timeFrame, setTimeFrame] = useState<"24h" | "7d" | "all">("all");
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?by=${tab}&timeFrame=${timeFrame}&limit=10`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLeaders(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, timeFrame]);

  return (
    <section className="w-full py-12 px-4 sm:px-6 max-w-5xl mx-auto">
      <Surface
        tone="white"
        radius="xl"
        className="p-6 sm:p-10 bg-white border-[3px] border-[#0B0B14] shadow-[0_6px_0_#0B0B14] flex flex-col gap-6"
      >
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#0B0B14]/10 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFE66B] border-2 border-[#0B0B14] rounded-full text-xs font-mono font-bold text-[#0B0B14] mb-2">
              <Trophy className="w-3.5 h-3.5 text-[#0B0B14]" />
              <span>Rankings</span>
            </div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B0B14]">
              Hall of Flips
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* By Tab: Rewards vs Streak */}
            <div className="flex p-1 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-full">
              <button
                type="button"
                onClick={() => setTab("rewards")}
                className={`px-3 py-1 text-xs font-display font-bold rounded-full cursor-pointer transition-colors ${
                  tab === "rewards" ? "bg-[#0B0B14] text-white" : "text-[#0B0B14]"
                }`}
              >
                Top ETH
              </button>
              <button
                type="button"
                onClick={() => setTab("streak")}
                className={`px-3 py-1 text-xs font-display font-bold rounded-full cursor-pointer transition-colors ${
                  tab === "streak" ? "bg-[#0B0B14] text-white" : "text-[#0B0B14]"
                }`}
              >
                Longest Streak
              </button>
            </div>

            {/* Timeframe Filter (only when Top ETH selected) */}
            {tab === "rewards" && (
              <div className="flex p-1 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-full">
                {(["24h", "7d", "all"] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeFrame(tf)}
                    className={`px-2.5 py-1 text-[11px] font-mono font-black rounded-full cursor-pointer transition-colors uppercase ${
                      timeFrame === tf ? "bg-[#FE2D88] text-[#0B0B14]" : "text-[#0B0B14]"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard Table / Rows */}
        <div className="flex flex-col gap-2">
          {loading ? (
            <div className="py-12 text-center font-mono text-xs text-[#0B0B14]/80">
              Loading rankings...
            </div>
          ) : leaders.length === 0 ? (
            <div className="py-12 text-center font-mono text-xs text-[#0B0B14]/80 bg-[#F4FAFF] rounded-[20px] border-2 border-[#0B0B14]/20">
              No flips recorded yet in this window. Be the first to play!
            </div>
          ) : (
            leaders.map((leader, idx) => {
              const medalIcons = ["🥇", "🥈", "🥉"];
              const medal = medalIcons[idx] || `#${idx + 1}`;
              const formattedAddr = `${leader.address.slice(0, 6)}...${leader.address.slice(-4)}`;

              return (
                <div
                  key={leader.address + idx}
                  className="flex items-center justify-between p-3.5 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-[18px] hover:bg-white transition-all shadow-[0_2px_0_#0B0B14]"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center font-display font-black text-sm">
                      {medal}
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-bold text-[#0B0B14]">
                      {formattedAddr}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-mono text-sm sm:text-base font-black text-[#0B0B14]">
                        {tab === "rewards"
                          ? `${leader.score} ETH`
                          : `${leader.score} streak`}
                      </span>
                      {leader.totalFlips !== undefined && (
                        <span className="text-[10px] font-mono text-[#0B0B14]/60 block">
                          {leader.totalFlips} flips
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Full Leaderboard Link */}
        <div className="pt-2 flex justify-end">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-black text-[#0A2BB5] hover:underline"
          >
            <span>View Full Hall of Flips</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </Surface>
    </section>
  );
}
