import React from "react";
import Link from "next/link";
import { Surface } from "@/components/ui/surface";
import { Wallet, Sparkles, Coins, ShieldCheck, Clock, Calendar, Lock } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: <Wallet className="w-6 h-6 text-[#FE2D88]" />,
      title: "Connect Wallet",
      description:
        "Connect securely via Privy with your wallet on Robinhood Chain. No sign-up, no email, and zero approval transactions.",
    },
    {
      num: "02",
      icon: <Sparkles className="w-6 h-6 text-[#FFE66B]" />,
      title: "Call & Flip",
      description:
        "Pick Heads or Tails. Every flip awards a base ETH reward, your $FLIPPO holdings multiply it, and correct calls add a 1.5x bonus.",
    },
    {
      num: "03",
      icon: <Coins className="w-6 h-6 text-[#0C73FE]" />,
      title: "Claim ETH",
      description:
        "Accumulate claimable rewards and trigger a direct payout from the protocol treasury to your connected wallet whenever you're ready.",
    },
  ];

  const rules = [
    {
      icon: <Clock className="w-4 h-4 text-[#0C73FE]" />,
      title: "30s Cooldown",
      detail: "Protects protocol throughput and keeps pacing arcade-style.",
    },
    {
      icon: <Calendar className="w-4 h-4 text-[#FE2D88]" />,
      title: "10 Flips / Day",
      detail: "Per-wallet daily cap resets at midnight UTC to distribute rewards broadly.",
    },
    {
      icon: <Lock className="w-4 h-4 text-[#16A34A]" />,
      title: "24h Hold-Time Rule",
      detail: "Balances must be held for 24 hours to count toward higher multiplier tiers.",
    },
  ];

  return (
    <section className="w-full py-14 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col gap-8">
      {/* 3 Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {steps.map((step) => (
          <Surface
            key={step.num}
            tone="white"
            radius="xl"
            className="p-6 bg-white border-[3px] border-[#0B0B14] shadow-[0_5px_0_#0B0B14] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-[16px] bg-[#F4FAFF] border-2 border-[#0B0B14] flex items-center justify-center shadow-[0_2px_0_#0B0B14]">
                  {step.icon}
                </div>
                <span aria-hidden="true" className="font-mono font-black text-2xl text-[#0B0B14]/70">
                  {step.num}
                </span>
              </div>
              <h3 className="font-display font-extrabold text-xl text-[#0B0B14] mb-2">
                {step.title}
              </h3>
              <p className="text-xs text-[#0B0B14]/80 leading-relaxed font-body">
                {step.description}
              </p>
            </div>
          </Surface>
        ))}
      </div>

      {/* Why It's Fair Card */}
      <Surface
        tone="white"
        radius="xl"
        className="p-6 sm:p-8 bg-[#E3F1FF] border-[3px] border-[#0B0B14] shadow-[0_6px_0_#0B0B14] flex flex-col md:flex-row gap-6 items-start justify-between"
      >
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border-2 border-[#0B0B14] rounded-full text-xs font-mono font-bold text-[#0B0B14] mb-3">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            <span>Lightweight Provable Fairness</span>
          </div>
          <h3 className="font-display font-extrabold text-2xl text-[#0B0B14] mb-2">
            Why Flippo is 100% Fair
          </h3>
          <p className="text-xs sm:text-sm text-[#0B0B14]/80 leading-relaxed font-body mb-4">
            Before every flip, the server generates a cryptographically random secret seed and commits its SHA-256 hash. Once the flip completes, the secret seed is revealed so anyone can verify that the outcome was predetermined and unmanipulated.
          </p>

          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B0B14] text-white rounded-full font-mono text-xs font-bold shadow-[0_3px_0_#FE2D88] hover:translate-y-[-1px] transition-transform"
          >
            <span>Verify flips in History</span>
          </Link>
        </div>

        {/* Rules Side Column */}
        <div className="w-full md:w-72 flex flex-col gap-2.5 bg-white p-4 rounded-[20px] border-2 border-[#0B0B14] shadow-[0_3px_0_#0B0B14]">
          <span className="text-[10px] font-mono font-black uppercase text-[#0B0B14]/60">
            Protocol Rules
          </span>
          {rules.map((rule, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-left">
              <span className="p-1 rounded-md bg-[#F4FAFF] border border-[#0B0B14] shrink-0 mt-0.5">
                {rule.icon}
              </span>
              <div>
                <h5 className="font-display font-extrabold text-xs text-[#0B0B14]">
                  {rule.title}
                </h5>
                <p className="text-[11px] font-body text-[#0B0B14]/70 leading-snug">
                  {rule.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Surface>
    </section>
  );
}
