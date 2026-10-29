"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { REWARD_CONFIG, getTierByBalance, calculateFlipReward } from "@/config/rewards";
import { env } from "@/lib/env";
import {
  Sparkles,
  Wallet,
  Coins,
  Zap,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Calculator,
  Lock,
  Clock,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
} from "lucide-react";

export default function HowItWorksPage() {
  const isTestnet = env.client.NEXT_PUBLIC_NETWORK_MODE === "testnet";

  // State for interactive slider (0 to 1,000,000)
  const [sliderTokens, setSliderTokens] = useState<number>(25_000);
  const activeTier = getTierByBalance(sliderTokens);

  // State for Reward Math calculator
  const [calcTierIndex, setCalcTierIndex] = useState<number>(2);
  const [calcCallCorrect, setCalcCallCorrect] = useState<boolean>(true);
  const selectedTier = REWARD_CONFIG.TIERS.find((t) => t.tier === calcTierIndex) || REWARD_CONFIG.TIERS[1];
  const calcResult = calculateFlipReward({
    tierMultiplier: selectedTier.multiplier,
    calledCorrectly: calcCallCorrect,
  });

  // State for FAQ accordions
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is Flippo?",
      a: "Flippo is a provably fair coin flip reward game built natively on Robinhood Chain. By simply holding $FLIPPO tokens in your self-custody wallet, you qualify for real ETH rewards directly from the protocol treasury.",
    },
    {
      q: "Do I need to approve or spend my $FLIPPO to play?",
      a: "Never! Flippo requires zero ERC-20 token approvals and zero spending transactions. We only read your on-chain balance. Your tokens always remain 100% safe in your own wallet.",
    },
    {
      q: "How many reward flips can I do?",
      a: "Each standard holding tier (Tiers 1 through 4) grants you exactly one lifetime reward flip when reached and held for 24 hours. Once used, that tier's reward flip is spent. To unlock another reward flip, acquire enough $FLIPPO to reach the next tier!",
    },
    {
      q: "What happens if I buy tokens and skip tiers?",
      a: "If you purchase enough $FLIPPO to jump directly over lower tiers (for example, buying 200,000 tokens to jump straight to Tier 4), the skipped lower tiers are forfeited and cannot be claimed retroactively. You will be eligible for the Tier 4 flip once your 24-hour hold time completes.",
    },
    {
      q: "How does the Whale tier (Tier 5) work?",
      a: "Holders of 1,000,000 or more $FLIPPO unlock the ultimate Whale privilege: a recurring 5.0x reward flip that refreshes every 24 hours on a rolling window. There is no lifetime cap for whales—you can flip every single day as long as you maintain your balance.",
    },
    {
      q: "What are practice flips?",
      a: "Want to experience the thrill without burning a reward flip, or while waiting for your 24-hour hold time? You can take up to 20 practice flips per UTC day completely free. Practice flips use the same provably fair engine but distribute 0 ETH.",
    },
    {
      q: "How do I claim my ETH rewards?",
      a: "When you win a flip, your reward is credited to your internal ledger in the protocol. Once your balance reaches the minimum threshold of 0.001 ETH, a single tap on 'Claim to Wallet' sends the ETH directly to your connected address from the treasury.",
    },
    {
      q: "Is the coin flip truly fair?",
      a: "Yes! Every single flip is provably fair using HMAC-SHA256 commit-reveal. The server commits to a secret seed hash before you flip. Your client seed and flip nonce are combined with the revealed server seed so anyone can cryptographically verify that the outcome was never manipulated.",
    },
  ];

  return (
    <main className="min-h-screen flex flex-col bg-[#F4FAFF] text-[#0B0B14]">
      <Navbar />

      <div className="pt-28 pb-20 px-4 sm:px-6 max-w-5xl mx-auto w-full flex flex-col gap-12 sm:gap-16">
        {/* 1. HERO SECTION */}
        <section className="text-center max-w-3xl mx-auto flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFE66B] border-2 border-[#0B0B14] rounded-full text-xs font-mono font-black text-[#0B0B14] shadow-[0_2px_0_#0B0B14] transform -rotate-1">
            <Sparkles className="w-3.5 h-3.5 text-[#0B0B14]" />
            <span>HOW FLIPPO WORKS</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-6xl text-[#0B0B14] tracking-tight leading-none">
            Hold $FLIPPO. <br />
            <span className="text-[#FE2D88]">Flip the Coin.</span> Win Real ETH.
          </h1>

          <p className="text-sm sm:text-base text-[#0B0B14]/80 max-w-xl font-body">
            Flippo transforms token holding into an interactive provably fair game. Unlock tier multipliers, call your side, and claim instant treasury payouts.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            <Link href="/">
              <Button variant="pink" size="lg" className="px-8 font-black text-base min-h-[56px] h-14 shadow-[0_4px_0_#0B0B14]">
                <span>Start Flipping</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            {isTestnet && (
              <Link href="/faucet">
                <Button variant="white" size="lg" className="px-6 font-bold text-sm min-h-[56px] h-14 bg-white border-2 border-[#0B0B14]">
                  Need Test Tokens? (Faucet)
                </Button>
              </Link>
            )}
          </div>
        </section>

        {/* 2. THREE SIMPLE STEPS */}
        <section className="flex flex-col gap-6">
          <div className="text-center">
            <h2 className="font-display font-black text-2xl sm:text-3xl text-[#0B0B14]">
              Three Simple Steps to Play
            </h2>
            <p className="text-xs sm:text-sm text-[#0B0B14]/70 mt-1">
              Zero approvals. Zero gas to hold. Pure reward mechanics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1 */}
            <Surface
              tone="white"
              radius="xl"
              className="p-6 bg-white border-[3px] border-[#0B0B14] shadow-[0_5px_0_#0B0B14] flex flex-col gap-3 relative"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#E3F1FF] border-2 border-[#0B0B14] flex items-center justify-center font-display font-black text-lg text-[#0C73FE]">
                1
              </div>
              <h3 className="font-display font-black text-lg text-[#0B0B14]">
                Connect Wallet
              </h3>
              <p className="text-xs text-[#0B0B14]/80 font-body leading-relaxed">
                Connect seamlessly via Privy with your Robinhood Wallet, MetaMask, Coinbase Wallet, or an embedded self-custody wallet.
              </p>
              <div className="mt-auto pt-2 text-[11px] font-mono font-bold text-[#0C73FE]">
                🔒 100% read-only connection
              </div>
            </Surface>

            {/* Step 2 */}
            <Surface
              tone="white"
              radius="xl"
              className="p-6 bg-white border-[3px] border-[#0B0B14] shadow-[0_5px_0_#0B0B14] flex flex-col gap-3 relative"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#FFF9E6] border-2 border-[#0B0B14] flex items-center justify-center font-display font-black text-lg text-[#0B0B14]">
                2
              </div>
              <h3 className="font-display font-black text-lg text-[#0B0B14]">
                Hold $FLIPPO (24h)
              </h3>
              <p className="text-xs text-[#0B0B14]/80 font-body leading-relaxed">
                Hold tokens to unlock reward tiers from 1.0x to 5.0x. Maintain your balance for 24 hours to fulfill the anti-flash-loan hold rule.
              </p>
              <div className="mt-auto pt-2 text-[11px] font-mono font-bold text-[#FE2D88]">
                ⭐ Up to 5.0x reward multiplier
              </div>
            </Surface>

            {/* Step 3 */}
            <Surface
              tone="white"
              radius="xl"
              className="p-6 bg-white border-[3px] border-[#0B0B14] shadow-[0_5px_0_#0B0B14] flex flex-col gap-3 relative"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#FFE66B] border-2 border-[#0B0B14] flex items-center justify-center font-display font-black text-lg text-[#0B0B14]">
                3
              </div>
              <h3 className="font-display font-black text-lg text-[#0B0B14]">
                Flip & Win Real ETH
              </h3>
              <p className="text-xs text-[#0B0B14]/80 font-body leading-relaxed">
                Call Heads or Tails and flip. Win ETH rewards multiplied by your tier, with an extra 1.5x bonus for correct calls!
              </p>
              <div className="mt-auto pt-2 text-[11px] font-mono font-bold text-[#16A34A]">
                💸 Direct treasury payouts
              </div>
            </Surface>
          </div>
        </section>

        {/* 3. TIER STAIRCASE WITH INTERACTIVE BALANCE SLIDER */}
        <section className="flex flex-col gap-6">
          <Surface
            tone="white"
            radius="xl"
            className="p-6 sm:p-8 bg-white border-[3px] border-[#0B0B14] shadow-[0_6px_0_#0B0B14] flex flex-col gap-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#0B0B14]/10 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#E3F1FF] border-2 border-[#0B0B14] rounded-full text-xs font-mono font-bold text-[#0B0B14] mb-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#0C73FE]" />
                  <span>Interactive Tier Preview</span>
                </div>
                <h3 className="font-display font-black text-xl sm:text-2xl text-[#0B0B14]">
                  Holding Tier Staircase
                </h3>
              </div>

              {/* Live tier badge from slider */}
              <div className="px-4 py-2 bg-[#FFE66B] border-2 border-[#0B0B14] rounded-[16px] text-center shadow-[0_3px_0_#0B0B14]">
                <span className="text-[10px] font-mono uppercase text-[#0B0B14]/70 block font-bold">
                  Unlocked Tier
                </span>
                <span className="font-display font-black text-base text-[#0B0B14]">
                  Tier {activeTier.tier}: {activeTier.name} ({activeTier.multiplier}x)
                </span>
              </div>
            </div>

            {/* Slider Control */}
            <div className="flex flex-col gap-2 p-4 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-[18px]">
              <div className="flex justify-between items-center text-xs font-mono font-bold">
                <span className="text-[#0B0B14]">Simulate Your $FLIPPO Balance:</span>
                <span className="text-[#0C73FE] text-sm font-black">
                  {sliderTokens.toLocaleString()} $FLIPPO
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1000000"
                step="5000"
                value={sliderTokens}
                onChange={(e) => setSliderTokens(Number(e.target.value))}
                className="w-full h-3 bg-white border border-[#0B0B14] rounded-lg appearance-none cursor-pointer accent-[#FE2D88]"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#0B0B14]/50">
                <span>0</span>
                <span>200K (Plat)</span>
                <span>500K</span>
                <span>1M+ (Whale)</span>
              </div>
            </div>

            {/* The 5 Tiers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
              {REWARD_CONFIG.TIERS.filter((t) => t.tier > 0).map((tier) => {
                const isSelected = activeTier.tier === tier.tier;
                return (
                  <div
                    key={tier.tier}
                    className={`p-4 rounded-[18px] border-[3px] border-[#0B0B14] flex flex-col justify-between transition-all ${
                      isSelected
                        ? "bg-[#FFE66B] shadow-[0_5px_0_#0B0B14] translate-y-[-4px]"
                        : "bg-[#F4FAFF] shadow-[0_2px_0_#0B0B14]"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center text-[10px] font-mono uppercase font-black text-[#0B0B14]/60 mb-1">
                        <span>Tier {tier.tier}</span>
                        {tier.isWhale && (
                          <span className="bg-[#0B0B14] text-[#FFE66B] px-1 py-0.5 rounded text-[8px]">
                            24h Whale
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-black text-sm text-[#0B0B14]">
                        {tier.name}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-[#0B0B14]/15 mt-3">
                      <div className="font-display font-black text-2xl text-[#0B0B14]">
                        {tier.multiplier}x
                      </div>
                      <div className="text-[10px] font-mono font-bold text-[#0B0B14]/80 mt-0.5">
                        {tier.minTokens.toLocaleString()}+ $FLIPPO
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Surface>
        </section>

        {/* 4. REWARD CALCULATION & WORKED EXAMPLE */}
        <section className="flex flex-col gap-6">
          <Surface
            tone="white"
            radius="xl"
            className="p-6 sm:p-8 bg-[#E3F1FF] border-[3px] border-[#0B0B14] shadow-[0_6px_0_#0B0B14] flex flex-col gap-4"
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#0C73FE]" />
              <h3 className="font-display font-black text-xl text-[#0B0B14]">
                The Flippo Reward Formula
              </h3>
            </div>

            <div className="p-4 bg-white border-2 border-[#0B0B14] rounded-[18px] font-mono text-xs sm:text-sm text-[#0B0B14] flex flex-col gap-2">
              <div className="font-black text-[#FE2D88] text-sm sm:text-base">
                Reward = BASE_REWARD_ETH &times; TierMultiplier &times; CallBonus
              </div>
              <div className="text-xs text-[#0B0B14]/80 leading-relaxed">
                &bull; <strong>Base Reward:</strong> {REWARD_CONFIG.BASE_REWARD_ETH} ETH fixed starting pool
                <br />
                &bull; <strong>Tier Multiplier:</strong> Scales from 1.0x (Bronze) up to 5.0x (Whale)
                <br />
                &bull; <strong>Call Bonus:</strong> 1.5x bonus if your coin call (Heads/Tails) is correct; 1.0x if wrong (you still earn base x tier!)
              </div>
            </div>

            {/* Interactive Calculator */}
            <div className="p-4 bg-white border-2 border-[#0B0B14] rounded-[18px] flex flex-col gap-4">
              <h4 className="font-display font-black text-sm text-[#0B0B14]">
                Try the Live Calculator:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono uppercase font-bold text-[#0B0B14]/70 block mb-1">
                    Select Multiplier Tier
                  </label>
                  <select
                    value={calcTierIndex}
                    onChange={(e) => setCalcTierIndex(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-[12px] font-mono text-xs font-bold text-[#0B0B14]"
                  >
                    {REWARD_CONFIG.TIERS.filter((t) => t.tier > 0).map((t) => (
                      <option key={t.tier} value={t.tier}>
                        Tier {t.tier}: {t.name} ({t.multiplier}x)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase font-bold text-[#0B0B14]/70 block mb-1">
                    Call Result (Heads / Tails)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCalcCallCorrect(true)}
                      className={`p-2.5 rounded-[12px] border-2 border-[#0B0B14] font-mono text-xs font-black cursor-pointer ${
                        calcCallCorrect ? "bg-[#16A34A] text-white" : "bg-[#F4FAFF] text-[#0B0B14]"
                      }`}
                    >
                      🎯 Correct (1.5x)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcCallCorrect(false)}
                      className={`p-2.5 rounded-[12px] border-2 border-[#0B0B14] font-mono text-xs font-black cursor-pointer ${
                        !calcCallCorrect ? "bg-[#0B0B14] text-white" : "bg-[#F4FAFF] text-[#0B0B14]"
                      }`}
                    >
                      Wrong (1.0x)
                    </button>
                  </div>
                </div>
              </div>

              {/* Calculated Output */}
              <div className="p-3 bg-[#FFE66B]/30 border-2 border-[#0B0B14] rounded-[14px] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#0B0B14]/70 block font-bold">
                    Total Estimated Reward
                  </span>
                  <span className="font-mono text-xs text-[#0B0B14]">
                    {REWARD_CONFIG.BASE_REWARD_ETH} &times; {selectedTier.multiplier} &times; {calcCallCorrect ? 1.5 : 1.0}
                  </span>
                </div>
                <div className="font-mono text-xl sm:text-2xl font-black text-[#FE2D88]">
                  {calcResult.totalRewardEth} ETH
                </div>
              </div>
            </div>
          </Surface>
        </section>

        {/* 5. WHY IT'S PROVABLY FAIR */}
        <section className="flex flex-col gap-6">
          <Surface
            tone="white"
            radius="xl"
            className="p-6 sm:p-8 bg-white border-[3px] border-[#0B0B14] shadow-[0_6px_0_#0B0B14] flex flex-col gap-5"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
              <h3 className="font-display font-black text-xl sm:text-2xl text-[#0B0B14]">
                Provably Fair Commit-Reveal
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-[#0B0B14]/80 font-body leading-relaxed">
              Every coin flip outcome is determined using standard cryptographic HMAC-SHA256 commitments. The server cannot change the coin result after you choose your side, and you cannot predict the server seed in advance.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3.5 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-[16px]">
                <div className="font-bold text-[#0C73FE] mb-1">1. Server Seed Hash</div>
                <div className="text-[11px] text-[#0B0B14]/70">
                  Before you flip, the server generates a cryptographically secure random seed and publishes its SHA-256 hash.
                </div>
              </div>

              <div className="p-3.5 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-[16px]">
                <div className="font-bold text-[#FE2D88] mb-1">2. Client Seed & Nonce</div>
                <div className="text-[11px] text-[#0B0B14]/70">
                  Your browser provides a client seed along with your sequential flip nonce to ensure randomness is jointly determined.
                </div>
              </div>

              <div className="p-3.5 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-[16px]">
                <div className="font-bold text-[#16A34A] mb-1">3. Reveal & Verification</div>
                <div className="text-[11px] text-[#0B0B14]/70">
                  After the flip completes, the unhashed server seed is revealed. Anyone can verify the hash matches and replay the math.
                </div>
              </div>
            </div>
          </Surface>
        </section>

        {/* 6. RULES & PROTOCOL SAFEGUARDS */}
        <section className="flex flex-col gap-6">
          <Surface
            tone="white"
            radius="xl"
            className="p-6 sm:p-8 bg-[#FFF9E6] border-[3px] border-[#0B0B14] shadow-[0_6px_0_#0B0B14] flex flex-col gap-4"
          >
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#0B0B14]" />
              <h3 className="font-display font-black text-xl text-[#0B0B14]">
                Rules & Anti-Exploit Safeguards
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-[#0B0B14]">
              <div className="p-3 bg-white border-2 border-[#0B0B14] rounded-[14px] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                <div>
                  <strong>One Flip Per Tier:</strong> Tiers 1-4 grant exactly 1 lifetime flip per tier milestone.
                </div>
              </div>

              <div className="p-3 bg-white border-2 border-[#0B0B14] rounded-[14px] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                <div>
                  <strong>Skipped Tier Forfeit:</strong> Jumping tiers locks and forfeits lower tier flips permanently.
                </div>
              </div>

              <div className="p-3 bg-white border-2 border-[#0B0B14] rounded-[14px] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                <div>
                  <strong>24h Whale Daily:</strong> Tier 5 whales enjoy a rolling 24-hour recurring 5x flip privilege.
                </div>
              </div>

              <div className="p-3 bg-white border-2 border-[#0B0B14] rounded-[14px] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                <div>
                  <strong>24h Hold Time:</strong> Tokens must be held for 24 continuous hours before unlocks activate.
                </div>
              </div>

              <div className="p-3 bg-white border-2 border-[#0B0B14] rounded-[14px] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                <div>
                  <strong>Practice Flips:</strong> 15-second cooldown, max 20 free practice flips per UTC day.
                </div>
              </div>

              <div className="p-3 bg-white border-2 border-[#0B0B14] rounded-[14px] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                <div>
                  <strong>Daily Budget:</strong> 0.01 ETH wallet cap and 0.5 ETH global protocol cap per UTC day.
                </div>
              </div>
            </div>
          </Surface>
        </section>

        {/* 7. FREQUENTLY ASKED QUESTIONS (ACCORDION) */}
        <section className="flex flex-col gap-6">
          <div className="text-center">
            <h2 className="font-display font-black text-2xl sm:text-3xl text-[#0B0B14]">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[#0B0B14]/70 mt-1">
              Everything you need to know about playing and earning with Flippo.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border-[3px] border-[#0B0B14] rounded-[20px] shadow-[0_3px_0_#0B0B14] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-[#F4FAFF] transition-colors"
                  >
                    <span className="font-display font-extrabold text-sm sm:text-base text-[#0B0B14]">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#0B0B14] shrink-0 transition-transform duration-200 ${
                        isOpen ? "transform rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-[#0B0B14]/80 font-body leading-relaxed border-t border-[#0B0B14]/10">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 8. CTA BLOCK */}
        <section className="text-center py-6 flex flex-col items-center gap-4">
          <div className="p-8 sm:p-12 bg-white border-[3px] border-[#0B0B14] rounded-[32px] shadow-[0_8px_0_#0B0B14] w-full max-w-2xl flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#FFE66B] border-2 border-[#0B0B14] flex items-center justify-center text-2xl">
              🪙
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#0B0B14]">
              Ready to Call Your Side?
            </h2>
            <p className="text-xs sm:text-sm text-[#0B0B14]/75 max-w-md">
              Connect your wallet, verify your tier, and flip for real ETH rewards on Robinhood Chain right now.
            </p>

            <Link href="/" className="w-full sm:w-auto">
              <Button variant="pink" size="lg" className="w-full sm:w-auto px-10 font-black text-base min-h-[56px] h-14 shadow-[0_4px_0_#0B0B14]">
                <span>Play Flippo Now</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            {isTestnet && (
              <p className="text-[11px] font-mono text-[#0B0B14]/60 mt-1">
                Testing on Robinhood Testnet? Grab free test tokens from the{" "}
                <Link href="/faucet" className="font-bold text-[#0C73FE] underline">
                  Faucet
                </Link>
                .
              </p>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
