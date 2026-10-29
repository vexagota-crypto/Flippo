"use client";

import React, { useState, useEffect } from "react";
import { useWallets } from "@privy-io/react-auth";
import { REWARD_CONFIG } from "@/config/rewards";
import { Surface } from "@/components/ui/surface";
import { TrendingUp, Lock, CheckCircle2, Zap, Clock, RotateCw } from "lucide-react";

export function MultiplierLadder() {
  const { wallets } = useWallets();
  const activeWallet = wallets[0];
  const [statusData, setStatusData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = () => {
    if (!activeWallet?.address) return;
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    fetch(`/api/flip-status?address=${activeWallet.address}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(timeoutId);
        if (data.success) {
          setStatusData(data);
        } else {
          setError(data.error || "Failed to load tier status");
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        setError(err.name === "AbortError" ? "Network timeout" : "Could not load tiers");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStatus();
  }, [activeWallet?.address]);

  const currentTier = statusData?.rawTier?.tier ?? 0;
  const tokenBalance = statusData?.tokenBalance ?? 0;
  const tierStatuses = statusData?.tierStatuses ?? [];

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
              One Flip Per Tier + 24h Whale Daily
            </h2>
            <p className="text-xs sm:text-sm text-[#0B0B14]/75 mt-1">
              Every holding milestone unlocks a one-time boosted flip. Whales holding 1,000,000+ enjoy a recurring 5x flip every 24 hours.
            </p>
          </div>

          {/* Progress bar to next tier */}
          {statusData?.nextTier && (
            <div className="sm:max-w-xs w-full p-3 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-[18px]">
              <div className="flex justify-between items-center text-xs font-mono font-bold mb-1.5">
                <span className="text-[#0B0B14]">To Next Tier:</span>
                <span className="text-[#0C73FE]">
                  +{statusData.nextTier.tokensNeeded.toLocaleString()} $FLIPPO
                </span>
              </div>
              <div className="w-full h-3 bg-white border border-[#0B0B14] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FE2D88] to-[#0C73FE] transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        ((tokenBalance - (statusData.rawTier?.minTokens || 0)) /
                          (statusData.nextTier.minTokens - (statusData.rawTier?.minTokens || 0))) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Retry on error */}
        {error && (
          <div className="p-3 bg-[#FFF0F5] border-2 border-[#FE2D88] rounded-[16px] flex items-center justify-between text-xs font-mono">
            <span className="text-[#C2185B] font-bold">{error}</span>
            <button
              type="button"
              onClick={fetchStatus}
              className="px-2.5 py-1 bg-[#FE2D88] text-white font-bold rounded-lg flex items-center gap-1 active:scale-95"
            >
              <RotateCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Ascending Staircase Cards with Detailed States */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-end">
          {REWARD_CONFIG.TIERS.filter((t) => t.tier > 0).map((tier) => {
            const isUserTier = currentTier === tier.tier;
            const tierStatusInfo = tierStatuses.find((ts: any) => ts.tier === tier.tier);
            const status = tierStatusInfo?.status || (currentTier >= tier.tier ? "AVAILABLE" : "LOCKED");

            // Progressive heights for staircase effect
            const heightClasses = [
              "",
              "min-h-[190px]",
              "min-h-[205px]",
              "min-h-[220px]",
              "min-h-[235px]",
              "min-h-[250px]",
            ];

            return (
              <div
                key={tier.tier}
                className={`relative p-4 rounded-[20px] border-[3px] border-[#0B0B14] flex flex-col justify-between transition-transform duration-200 ${heightClasses[tier.tier]} ${
                  isUserTier
                    ? "bg-[#FFE66B] shadow-[0_6px_0_#0B0B14] translate-y-[-4px]"
                    : status === "USED" || status === "FORFEITED"
                    ? "bg-[#F0F2F5] shadow-[0_2px_0_#0B0B14] opacity-80"
                    : status === "LOCKED"
                    ? "bg-[#F4FAFF] shadow-[0_2px_0_#0B0B14]"
                    : "bg-[#E3F1FF] shadow-[0_4px_0_#0B0B14]"
                }`}
              >
                {/* Status Badges */}
                {isUserTier && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 bg-[#FE2D88] text-white border-2 border-[#0B0B14] rounded-full text-[10px] font-mono font-black shadow-[0_2px_0_#0B0B14]">
                    CURRENT TIER
                  </div>
                )}

                {/* Top: Tier Number & Status Icon */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono font-extrabold uppercase text-[#0B0B14]/60">
                      Tier {tier.tier}
                    </span>
                    {tier.isWhale ? (
                      <span className="text-[9px] font-mono font-black bg-[#0B0B14] text-[#FFE66B] px-1.5 py-0.5 rounded flex items-center gap-1">
                        <span>👑</span>
                        <span>24H DAILY</span>
                      </span>
                    ) : status === "USED" ? (
                      <span className="text-[9px] font-mono font-bold bg-[#16A34A] text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>USED</span>
                      </span>
                    ) : status === "FORFEITED" ? (
                      <span className="text-[9px] font-mono font-bold bg-[#64748B] text-white px-1.5 py-0.5 rounded">
                        SKIPPED
                      </span>
                    ) : status === "AVAILABLE" && isUserTier ? (
                      <span className="text-[9px] font-mono font-black bg-[#FE2D88] text-white px-1.5 py-0.5 rounded animate-pulse flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5 fill-current" />
                        <span>READY</span>
                      </span>
                    ) : status === "LOCKED" ? (
                      <span className="text-[9px] font-mono font-bold bg-[#0B0B14]/15 text-[#0B0B14] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        <span>LOCKED</span>
                      </span>
                    ) : null}
                  </div>
                  <h4 className="font-display font-extrabold text-sm leading-tight text-[#0B0B14]">
                    {tier.name}
                  </h4>
                </div>

                {/* Bottom: Multiplier & Required tokens */}
                <div className="pt-3 border-t border-[#0B0B14]/15">
                  <div className="font-display font-black text-2xl text-[#0B0B14] tracking-tight">
                    {tier.multiplier}x
                  </div>
                  <div className="text-[11px] font-mono font-bold text-[#0B0B14] mt-0.5">
                    {tier.minTokens.toLocaleString()}+
                    <span className="text-[9px] block text-[#0B0B14]/80">$FLIPPO</span>
                  </div>

                  {status === "LOCKED" && tokenBalance < tier.minTokens && (
                    <div className="text-[9px] font-mono text-[#0C73FE] font-bold mt-1">
                      Need {(tier.minTokens - tokenBalance).toLocaleString()} more
                    </div>
                  )}

                  {status === "USED" && tierStatusInfo?.usedAt && (
                    <div className="text-[9px] font-mono text-[#16A34A] font-bold mt-1">
                      Used on {new Date(tierStatusInfo.usedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Surface>
    </section>
  );
}
