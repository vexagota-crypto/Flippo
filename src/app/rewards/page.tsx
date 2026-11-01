"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { REWARD_CONFIG } from "@/config/rewards";
import { env } from "@/lib/env";
import { useWallets } from "@privy-io/react-auth";
import {
  Award,
  Calculator,
  Lock,
  CheckCircle2,
  Zap,
  RotateCw,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function RewardsPage() {
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
        setError(err.name === "AbortError" ? "Request timed out. Tap retry." : "Could not load rewards");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStatus();
  }, [activeWallet?.address]);

  const currentTier = statusData?.rawTier?.tier ?? 0;
  const tierStatuses = statusData?.tierStatuses ?? [];
  const usedTiers = statusData?.usedTiers ?? [];
  const isTestnet = env.client.NEXT_PUBLIC_NETWORK_MODE === "testnet";

  return (
    <main className="min-h-screen flex flex-col bg-[#F4FAFF] text-[#0B0B14]">
      <Navbar />

      <div className="pt-28 pb-16 px-4 sm:px-6 max-w-5xl mx-auto w-full flex flex-col gap-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-block transform -rotate-1 mb-2">
            <span className="px-3 py-1 bg-[#FFE66B] text-[#0B0B14] font-mono text-xs font-black rounded-full border-2 border-[#0B0B14] shadow-[0_2px_0_#0B0B14]">
              tier-gated reward mechanic
            </span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-[#0B0B14] tracking-tight">
            Reward & Multiplier System
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#0B0B14]/80 font-body">
            Each holding milestone unlocks a single boosted flip. Whales enjoy a rolling 24-hour daily flip privilege.
          </p>

          {/* Testnet faucet notice */}
          {isTestnet && (
            <div className="mt-4 inline-flex items-center gap-2 p-2 px-4 bg-white border-2 border-[#0B0B14] rounded-full text-xs font-mono shadow-[0_2px_0_#0B0B14]">
              <span>Need test $FLIPPO?</span>
              <Link href="/faucet" className="font-bold text-[#0C73FE] hover:underline flex items-center gap-1">
                <span>Visit Faucet</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Retry Banner */}
        {error && (
          <div className="p-3 bg-[#FFF0F5] border-2 border-[#FE2D88] rounded-[16px] flex items-center justify-between text-xs font-mono text-[#0B0B14]">
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

        {/* TIER STATUS SUMMARY (If connected) */}
        {activeWallet?.address && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white border-[3px] border-[#0B0B14] rounded-[20px] shadow-[0_4px_0_#0B0B14]">
              <span className="text-[10px] font-mono uppercase text-[#0B0B14]/60 block mb-1">
                Your Highest Tier
              </span>
              <div className="font-display font-black text-xl text-[#0B0B14]">
                {statusData?.rawTier ? `Tier ${statusData.rawTier.tier}: ${statusData.rawTier.name}` : "Connect Wallet"}
              </div>
              <span className="text-[11px] font-mono text-[#0C73FE] font-bold block mt-1">
                {statusData?.rawTier ? `${statusData.rawTier.multiplier}x Multiplier` : "Hold 100,000+ to qualify"}
              </span>
            </div>

            <div className="p-4 bg-white border-[3px] border-[#0B0B14] rounded-[20px] shadow-[0_4px_0_#0B0B14]">
              <span className="text-[10px] font-mono uppercase text-[#0B0B14]/60 block mb-1">
                24h Whale Status
              </span>
              <div className="font-display font-black text-xl text-[#0B0B14]">
                {currentTier === 5 ? (
                  statusData?.whaleCountdownSeconds > 0 ? (
                    <span className="text-[#0C73FE]">In Cooldown</span>
                  ) : (
                    <span className="text-[#16A34A]">Ready Today!</span>
                  )
                ) : (
                  <span className="text-[#0B0B14]/50">Whales Only (Tier 5: 10M+)</span>
                )}
              </div>
              <span className="text-[11px] font-mono text-[#0B0B14]/70 block mt-1">
                {currentTier === 5 && statusData?.whaleCountdownSeconds > 0
                  ? `Next flip in ${Math.ceil(statusData.whaleCountdownSeconds / 3600)}h`
                  : "1 flip every 24h at 5.0x"}
              </span>
            </div>
          </div>
        )}

        {/* WORKED EXAMPLE CARD */}
        <Surface
          tone="white"
          radius="xl"
          className="p-6 sm:p-8 bg-[#E3F1FF] border-[3px] border-[#0B0B14] shadow-[0_6px_0_#0B0B14] flex flex-col gap-4"
        >
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#0C73FE]" />
            <h3 className="font-display font-extrabold text-xl text-[#0B0B14]">
              How the Multiplier is Calculated
            </h3>
          </div>

          <div className="p-4 bg-white border-2 border-[#0B0B14] rounded-[18px] font-mono text-xs sm:text-sm text-[#0B0B14] flex flex-col gap-2">
            <div className="font-black text-[#FE2D88] text-sm sm:text-base">
              Reward = BASE_REWARD_ETH &times; TierMultiplier &times; CallBonus
            </div>
            <div className="text-[#0B0B14]/80 text-xs">
              &bull; <strong>BASE_REWARD_ETH:</strong> {REWARD_CONFIG.BASE_REWARD_ETH} ETH per flip
              <br />
              &bull; <strong>TierMultiplier:</strong> Up to 5.0x based on your $FLIPPO holding
              <br />
              &bull; <strong>CallBonus:</strong> 1.5x if your Heads or Tails call matches the result (1.0x if wrong)
            </div>
          </div>

          {/* Worked Example */}
          <div className="p-4 bg-[#FFE66B]/30 border-2 border-[#0B0B14] rounded-[18px]">
            <h4 className="font-display font-black text-sm text-[#0B0B14] mb-1">
              Worked Example:
            </h4>
            <p className="font-body text-xs text-[#0B0B14]/85 leading-relaxed">
              Suppose you hold <strong>500,000 $FLIPPO</strong> (unlocking <strong>Tier 2: 1.5x Multiplier</strong>) and call <strong>Heads</strong>. The coin lands on Heads:
            </p>
            <div className="mt-2 font-mono font-bold text-xs bg-white p-2.5 rounded-[12px] border border-[#0B0B14]/20 text-[#0B0B14]">
              {REWARD_CONFIG.BASE_REWARD_ETH} ETH &times; 1.5 (Tier 2) &times; 1.5 (Call Bonus) = <span className="text-[#FE2D88] font-black">0.0045 ETH</span>
            </div>
          </div>
        </Surface>

        {/* TIER TABLE WITH CLEAR STATUSES */}
        <Surface
          tone="white"
          radius="xl"
          className="p-6 sm:p-8 bg-white border-[3px] border-[#0B0B14] shadow-[0_6px_0_#0B0B14] flex flex-col gap-4 overflow-x-auto"
        >
          <div className="flex items-center justify-between border-b-2 border-[#0B0B14]/10 pb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#FE2D88]" />
              <h3 className="font-display font-extrabold text-xl text-[#0B0B14]">
                Holding Multiplier Tiers
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#0B0B14]/60">
              Hold-time rule: 10 mins
            </span>
          </div>

          <table className="w-full text-left font-body text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-[#0B0B14] font-mono text-[11px] uppercase text-[#0B0B14]/60">
                <th className="py-2.5 px-3">Tier</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Min $FLIPPO</th>
                <th className="py-2.5 px-3">Multiplier</th>
                <th className="py-2.5 px-3">Reward Rule</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0B0B14]/10 font-mono">
              {REWARD_CONFIG.TIERS.filter((t) => t.tier > 0).map((tier) => {
                const isCurrent = currentTier === tier.tier;
                const tierStatusInfo = tierStatuses.find((ts: any) => ts.tier === tier.tier);
                const status = tierStatusInfo?.status || (currentTier >= tier.tier ? "AVAILABLE" : "LOCKED");

                return (
                  <tr
                    key={tier.tier}
                    className={`transition-colors ${
                      isCurrent ? "bg-[#FFE66B]/30 font-bold" : "hover:bg-[#F4FAFF]"
                    }`}
                  >
                    <td className="py-3 px-3 font-black">
                      Tier {tier.tier}
                      {isCurrent && (
                        <span className="ml-2 text-[10px] bg-[#FE2D88] text-white px-2 py-0.5 rounded-full">
                          CURRENT
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-display font-extrabold text-[#0B0B14]">
                      {tier.name}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#0C73FE]">
                      {tier.minTokens.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-black text-sm text-[#0B0B14]">
                      {tier.multiplier}x
                    </td>
                    <td className="py-3 px-3 text-xs text-[#0B0B14]/80">
                      {tier.isWhale ? "1 flip every 24h" : "1 flip lifetime"}
                    </td>
                    <td className="py-3 px-3 font-bold">
                      {tier.isWhale ? (
                        <span className="px-2 py-0.5 rounded text-[11px] bg-[#0B0B14] text-[#FFE66B] flex items-center gap-1 w-fit">
                          <span>👑</span>
                          <span>24h Daily</span>
                        </span>
                      ) : status === "USED" ? (
                        <span className="px-2 py-0.5 rounded text-[11px] bg-[#16A34A]/20 text-[#16A34A] flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Used</span>
                        </span>
                      ) : status === "FORFEITED" ? (
                        <span className="px-2 py-0.5 rounded text-[11px] bg-[#64748B]/20 text-[#64748B] w-fit block">
                          Skipped
                        </span>
                      ) : status === "AVAILABLE" && isCurrent ? (
                        <span className="px-2 py-0.5 rounded text-[11px] bg-[#FE2D88] text-white flex items-center gap-1 w-fit animate-pulse">
                          <Zap className="w-3 h-3 fill-current" />
                          <span>Flip Ready</span>
                        </span>
                      ) : status === "HOLDING" ? (
                        <span className="px-2 py-0.5 rounded text-[11px] bg-[#FE2D88]/20 text-[#FE2D88] flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" />
                          <span>Holding (10m)</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] bg-[#0B0B14]/10 text-[#0B0B14]/60 flex items-center gap-1 w-fit">
                          <Lock className="w-3 h-3" />
                          <span>Locked</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Surface>

        {/* PER-TIER CLAIM HISTORY (if connected and has used flips) */}
        {usedTiers.length > 0 && (
          <Surface
            tone="white"
            radius="xl"
            className="p-6 sm:p-8 bg-white border-[3px] border-[#0B0B14] shadow-[0_6px_0_#0B0B14] flex flex-col gap-4"
          >
            <h3 className="font-display font-extrabold text-xl text-[#0B0B14]">
              Your Tier Flip Redemptions
            </h3>
            <div className="divide-y divide-[#0B0B14]/10 font-mono text-xs">
              {usedTiers.map((tf: any) => (
                <div key={tf.tier} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                    <span className="font-bold">Tier {tf.tier} Flip</span>
                    {tf.flipId.startsWith("forfeited_") ? (
                      <span className="text-[#64748B]">(Forfeited by higher tier jump)</span>
                    ) : (
                      <span className="text-[#0B0B14]/60 font-mono">({tf.flipId})</span>
                    )}
                  </div>
                  <span className="text-[#0B0B14]/70">
                    {new Date(tf.usedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </Surface>
        )}

        {/* CTA TO FLIP */}
        <div className="flex justify-center">
          <Link href="/">
            <Button variant="pink" size="lg" className="px-8 font-black min-h-[56px] h-14">
              <span>Ready? Flip the Coin</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
