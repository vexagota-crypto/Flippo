"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { REWARD_CONFIG } from "@/config/rewards";
import { useWallets } from "@privy-io/react-auth";
import { Award, Calculator, History, Sparkles, ArrowRight } from "lucide-react";

export default function RewardsPage() {
  const { wallets } = useWallets();
  const activeWallet = wallets[0];
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (activeWallet?.address) {
      fetch(`/api/user-stats?address=${activeWallet.address}`)
        .then((res) => res.json())
        .then((d) => {
          if (d.success) setStats(d);
        })
        .catch(() => {});
    }
  }, [activeWallet?.address]);

  return (
    <main className="min-h-screen flex flex-col bg-[#F4FAFF] text-[#0B0B14]">
      <Navbar />

      <div className="pt-28 pb-16 px-4 sm:px-6 max-w-5xl mx-auto w-full flex flex-col gap-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-block transform -rotate-1 mb-2">
            <span className="px-3 py-1 bg-[#FFE66B] text-[#0B0B14] font-mono text-xs font-black rounded-full border-2 border-[#0B0B14] shadow-[0_2px_0_#0B0B14]">
              multiplier economics
            </span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-[#0B0B14] tracking-tight">
            Reward & Multiplier System
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#0B0B14]/80 font-body">
            Holding $FLIPPO scales your reward tier. Correct coin calls trigger an additional 1.5x bonus.
          </p>
        </div>

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
              Suppose you hold <strong>12,500 $FLIPPO</strong> (unlocking <strong>Tier 2: 1.5x Multiplier</strong>) and call <strong>Heads</strong>. The coin lands on Heads:
            </p>
            <div className="mt-2 font-mono font-bold text-xs bg-white p-2.5 rounded-[12px] border border-[#0B0B14]/20 text-[#0B0B14]">
              {REWARD_CONFIG.BASE_REWARD_ETH} ETH &times; 1.5 (Tier 2) &times; 1.5 (Call Bonus) = <span className="text-[#FE2D88] font-black">0.00045 ETH</span>
            </div>
          </div>
        </Surface>

        {/* TIER TABLE */}
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
              Hold-time requirement: 24h
            </span>
          </div>

          <table className="w-full text-left font-body text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-[#0B0B14] font-mono text-[11px] uppercase text-[#0B0B14]/60">
                <th className="py-2.5 px-3">Tier</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Min $FLIPPO</th>
                <th className="py-2.5 px-3">Multiplier</th>
                <th className="py-2.5 px-3">Max Payout / Flip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0B0B14]/10 font-mono">
              {REWARD_CONFIG.TIERS.map((tier) => {
                const maxReward = Math.round(REWARD_CONFIG.BASE_REWARD_ETH * tier.multiplier * 1.5 * 1e8) / 1e8;
                const isCurrent = stats && stats.currentTier === tier.tier;
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
                          YOU
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-display font-extrabold text-[#0B0B14]">
                      {tier.name}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#0C73FE]">
                      {tier.minTokens.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-black text-sm sm:text-base text-[#0B0B14]">
                      {tier.multiplier}x
                    </td>
                    <td className="py-3 px-3 font-extrabold text-[#FE2D88]">
                      {tier.multiplier === 0 ? "0 ETH" : `~${maxReward} ETH`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Surface>

        {/* CTA TO FLIP */}
        <div className="flex justify-center">
          <Link href="/">
            <Button variant="pink" size="lg" className="px-8 font-black">
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
