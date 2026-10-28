"use client";

import React, { useState, useEffect } from "react";
import { useWallets } from "@privy-io/react-auth";
import { REWARD_CONFIG } from "@/config/rewards";
import { Surface } from "@/components/ui/surface";
import { Trophy, ArrowUpRight, TrendingUp } from "lucide-react";

export function MultiplierLadder() {
  const { wallets } = useWallets();
  const activeWallet = wallets[0];
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (activeWallet?.address) {
      fetch(`/api/user-stats?address=${activeWallet.address}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setStats(data);
          }
        })
        .catch(() => {});
    }
  }, [activeWallet?.address]);

  const currentTier = stats?.currentTier ?? 0;
  const tokenBalance = stats?.tokenBalance ?? 0;

  return (
    <section className="w-full py-14 px-4 sm:px-6 max-w-5xl mx-auto">
      <Surface
        tone="white"
        radius="xl"
        className="p-6 sm:p-10 bg-white border-[3px] border-[#0B0B14] shadow-[0_6px_0_#0B0B14] flex flex-col gap-8"
      >
        {/* Title & Description */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#0B0B14]/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E3F1FF] border-2 border-[#0B0B14] rounded-full text-xs font-mono font-bold text-[#0B0B14] mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#0C73FE]" />
              <span>Holding Advantage</span>
            </div>
            <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-[#0B0B14] tracking-tight">
              More $FLIPPO, bigger multiplier
            </h2>
            <p className="text-xs sm:text-sm text-[#0B0B14]/75 mt-1">
              Your tier multiplier scales every base flip reward. Tier 5 is the hard cap to prevent whale dominance.
            </p>
          </div>

          {/* Progress bar to next tier */}
          {stats?.nextTier && (
            <div className="sm:max-w-xs w-full p-3 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-[18px]">
              <div className="flex justify-between items-center text-xs font-mono font-bold mb-1.5">
                <span className="text-[#0B0B14]">To Next Tier:</span>
                <span className="text-[#0C73FE]">
                  +{stats.nextTier.tokensNeeded.toLocaleString()} $FLIPPO
                </span>
              </div>
              <div className="w-full h-3 bg-white border border-[#0B0B14] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FE2D88] to-[#0C73FE] transition-all duration-500"
                  style={{ width: `${stats.nextTier.progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Playful Ascending Staircase Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 items-end">
          {REWARD_CONFIG.TIERS.map((tier) => {
            const isUserTier = currentTier === tier.tier;
            // Progressive heights for staircase effect on desktop
            const heightClasses = [
              "min-h-[160px]",
              "min-h-[175px]",
              "min-h-[190px]",
              "min-h-[205px]",
              "min-h-[220px]",
              "min-h-[235px]",
            ];

            return (
              <div
                key={tier.tier}
                className={`relative p-4 rounded-[20px] border-[3px] border-[#0B0B14] flex flex-col justify-between transition-transform duration-200 ${heightClasses[tier.tier]} ${
                  isUserTier
                    ? "bg-[#FFE66B] shadow-[0_6px_0_#0B0B14] translate-y-[-4px]"
                    : "bg-[#F4FAFF] shadow-[0_3px_0_#0B0B14] hover:bg-white"
                }`}
              >
                {/* You are here pill */}
                {isUserTier && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 bg-[#FE2D88] text-[#0B0B14] border-2 border-[#0B0B14] rounded-full text-[10px] font-mono font-black shadow-[0_2px_0_#0B0B14]">
                    YOU ARE HERE
                  </div>
                )}

                {/* Top: Tier Number & Name */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono font-extrabold uppercase text-[#0B0B14]/60">
                      Tier {tier.tier}
                    </span>
                    {tier.tier === 5 && (
                      <span className="text-[9px] font-mono font-black bg-[#0B0B14] text-white px-1.5 py-0.5 rounded">
                        CAP
                      </span>
                    )}
                  </div>
                  <h4 className="font-display font-extrabold text-sm leading-tight text-[#0B0B14]">
                    {tier.name.split(" ")[0]}
                  </h4>
                </div>

                {/* Bottom: Multiplier & Required tokens */}
                <div className="pt-3 border-t border-[#0B0B14]/15">
                  <div className="font-display font-black text-2xl text-[#0B0B14] tracking-tight">
                    {tier.multiplier}x
                  </div>
                  <div className="text-[11px] font-mono font-bold text-[#0B0B14] mt-0.5">
                    {tier.minTokens === 0 ? "0" : `${tier.minTokens.toLocaleString()}+`}
                    <span className="text-[9px] block text-[#0B0B14]/80">$FLIPPO</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Surface>
    </section>
  );
}
