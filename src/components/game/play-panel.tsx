"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@/components/connect-button";
import { robinhoodChain } from "@/lib/chains";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Award,
  Clock,
  AlertCircle,
  CheckCircle2,
  Zap,
  RotateCw,
} from "lucide-react";

interface PlayPanelProps {
  onFlipStart: () => void;
  onFlipComplete: (result: "heads" | "tails") => void;
  isFlipping: boolean;
}

export function PlayPanel({
  onFlipStart,
  onFlipComplete,
  isFlipping,
}: PlayPanelProps) {
  const { authenticated, getAccessToken, user } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = wallets[0] || (user?.wallet?.address ? { address: user.wallet.address } : null);

  const [selectedCall, setSelectedCall] = useState<"heads" | "tails">("heads");
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [flipResult, setFlipResult] = useState<any>(null);
  const [animatedReward, setAnimatedReward] = useState<number>(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [whaleCountdown, setWhaleCountdown] = useState<number>(0);

  // Check wrong network
  const currentChainId = activeWallet && "chainId" in activeWallet && activeWallet.chainId
    ? parseInt(String(activeWallet.chainId).replace("eip155:", ""), 10)
    : robinhoodChain.id;
  const isWrongNetwork = authenticated && currentChainId !== robinhoodChain.id;

  // Fetch user stats with 8-second AbortController timeout
  const fetchStats = async () => {
    if (!activeWallet?.address) return;
    setIsLoadingStats(true);
    setStatsError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`/api/flip-status?address=${activeWallet.address}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.success) {
        setStats(data);
        if (data.whaleCountdownSeconds > 0) {
          setWhaleCountdown(data.whaleCountdownSeconds);
        }
      } else {
        setStatsError(data.error || "Failed to load stats");
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        setStatsError("Network request timed out. Tap retry.");
      } else {
        setStatsError("Could not load stats. Check connection.");
      }
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (activeWallet?.address) {
      fetchStats();
    }
  }, [activeWallet?.address]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // Whale countdown timer
  useEffect(() => {
    if (whaleCountdown <= 0) return;
    const timer = setInterval(() => {
      setWhaleCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [whaleCountdown]);

  // Reward counting up animation
  useEffect(() => {
    if (!flipResult?.rewardEth || flipResult.rewardEth <= 0) {
      setAnimatedReward(0);
      return;
    }
    const target = flipResult.rewardEth;
    let current = 0;
    const step = target / 25;
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        setAnimatedReward(target);
        clearInterval(interval);
      } else {
        setAnimatedReward(Math.round(current * 1e8) / 1e8);
      }
    }, 35);
    return () => clearInterval(interval);
  }, [flipResult]);

  // Format seconds to Xh Ym
  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // Execute Flip (Live Treasury Reward Flip)
  const handleFlip = async () => {
    if (!authenticated || isFlipping || isWrongNetwork) return;
    if (!stats?.isRewardFlipAvailable) return;

    setErrorMessage(null);
    setFlipResult(null);
    onFlipStart();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else if (activeWallet?.address) {
        headers["x-dev-wallet"] = activeWallet.address;
      }

      const res = await fetch("/api/flip", {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          call: selectedCall,
          idempotencyKey: `flip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        }),
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Flip request failed");
      }

      // Wait 1.4s for coin spin landing
      setTimeout(() => {
        onFlipComplete(data.flip.result);
        setFlipResult(data.flip);
        fetchStats();

        // Confetti burst on correct calls (reward flips)
        if (data.flip.calledCorrectly) {
          const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (!prefersReduced) {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.65 },
              colors: ["#FE2D88", "#0C73FE", "#FFE66B", "#FFFFFF"],
            });
          }
        }
      }, 1400);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Flip error:", err);
      setErrorMessage(err?.name === "AbortError" ? "Flip request timed out. Please retry." : err?.message || "Failed to complete flip.");
      onFlipComplete("heads");
    }
  };

  // Claim Rewards
  const handleClaim = async () => {
    if (!authenticated || isClaiming) return;
    setIsClaiming(true);
    setClaimSuccess(null);
    setErrorMessage(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else if (activeWallet?.address) {
        headers["x-dev-wallet"] = activeWallet.address;
      }

      const res = await fetch("/api/claim", {
        method: "POST",
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Claim failed");
      }

      setClaimSuccess(`Claim broadcasted! TX: ${data.txHash.slice(0, 8)}...`);
      fetchStats();
    } catch (err: any) {
      clearTimeout(timeoutId);
      setErrorMessage(err?.name === "AbortError" ? "Claim request timed out. Please retry." : err?.message || "Failed to claim rewards");
    } finally {
      setIsClaiming(false);
    }
  };

  const isRewardFlipReady = !!stats?.isRewardFlipAvailable;
  const currentTier = stats?.rawTier?.tier || 0;
  const currentMultiplier = stats?.rawTier?.multiplier || 1.0;
  const nextTier = stats?.nextTier;

  return (
    <Surface
      tone="white"
      radius="xl"
      className="w-full max-w-lg p-4 sm:p-6 bg-white border-[3px] border-[#0B0B14] shadow-[0_6px_0_#0B0B14] flex flex-col gap-4 select-none transition-all"
    >
      {/* 1. NOT CONNECTED STATE */}
      {!authenticated ? (
        <div className="flex flex-col items-center text-center gap-4 py-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E3F1FF] border-2 border-[#0B0B14] rounded-full text-xs font-mono font-bold text-[#0B0B14]">
            <Sparkles className="w-3.5 h-3.5 text-[#0C73FE]" />
            <span>Robinhood Chain Native</span>
          </div>

          <div>
            <h3 className="font-display font-extrabold text-2xl text-[#0B0B14] tracking-tight">
              Ready to Flip?
            </h3>
            <p className="text-xs text-[#0B0B14]/80 max-w-xs mt-1">
              Connect your wallet to flip the coin and earn real ETH rewards multiplied by your $FLIPPO holdings.
            </p>
          </div>

          <div className="w-full">
            <ConnectButton fullWidth size="lg" label="Connect Wallet to Play" />
          </div>

          <p className="text-[11px] font-mono text-[#0B0B14]/60">
            🔒 Safe & zero-risk: no approvals or spending transactions are ever requested.
          </p>
        </div>
      ) : (
        /* 2. CONNECTED PLAY STATE */
        <div className="flex flex-col gap-3.5">
          {/* Header Stats Bar: 2 Clean Columns */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-[20px] text-center">
            {/* Holdings & Tier */}
            <div className="flex flex-col items-center justify-center p-1 border-r-2 border-[#0B0B14]/15">
              <span className="text-[10px] font-mono uppercase text-[#0B0B14]/60 font-bold">
                Holdings & Tier
              </span>
              <span className="font-mono text-xs sm:text-sm font-extrabold text-[#0B0B14] truncate max-w-[140px] mt-0.5">
                {stats?.tokenBalance !== undefined ? `${stats.tokenBalance.toLocaleString()} $FLIPPO` : "..."}
              </span>
              <span className="text-[11px] font-mono font-black text-[#0C73FE] mt-0.5">
                {stats?.rawTier ? `Tier ${stats.rawTier.tier} (${stats.rawTier.multiplier}x)` : "..."}
              </span>
            </div>

            {/* Hold Time Status (10 mins requirement) */}
            <div className="flex flex-col items-center justify-center p-1">
              <span className="text-[10px] font-mono uppercase text-[#0B0B14]/60 font-bold">
                Hold Time Status
              </span>
              <span className="font-mono text-xs sm:text-sm font-extrabold text-[#0B0B14] mt-0.5">
                {stats?.holdTime?.met ? (
                  <span className="text-[#16A34A] font-black">✓ Verified</span>
                ) : (
                  <span className="text-[#FE2D88] font-black">
                    {stats?.holdTime?.minutesRemaining ?? 10}m left
                  </span>
                )}
              </span>
              <span className="text-[10px] font-mono text-[#0B0B14]/60 mt-0.5">
                10m required
              </span>
            </div>
          </div>

          {/* STATS ERROR RETRY BAR */}
          {statsError && (
            <div className="p-2.5 bg-[#FFF0F5] border-2 border-[#FE2D88] rounded-[16px] flex items-center justify-between text-xs font-mono text-[#0B0B14]">
              <span className="text-[#C2185B] font-bold">{statsError}</span>
              <button
                type="button"
                onClick={fetchStats}
                disabled={isLoadingStats}
                className="px-2.5 py-1 bg-[#FE2D88] text-white font-bold rounded-lg flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <RotateCw className={`w-3 h-3 ${isLoadingStats ? "animate-spin" : ""}`} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* EXACT E3 TIER STATUS CARD */}
          <div className="p-3 rounded-[18px] border-2 border-[#0B0B14] bg-[#FFF9E6] shadow-[0_2px_0_#0B0B14]">
            {stats?.tierState === "AVAILABLE" && (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse shrink-0" />
                <span className="text-xs font-mono font-extrabold text-[#0B0B14]">
                  Tier {currentTier} ({currentMultiplier}x) reward flip ready!
                </span>
              </div>
            )}

            {stats?.tierState === "WHALE_READY" && (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse shrink-0" />
                <span className="text-xs font-mono font-extrabold text-[#0B0B14]">
                  👑 Whale flip ready (5x daily privilege)!
                </span>
              </div>
            )}

            {stats?.tierState === "WHALE_COOLDOWN" && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0C73FE] shrink-0" />
                <span className="text-xs font-mono font-bold text-[#0B0B14]">
                  Whale flip used. Next whale flip in {formatCountdown(whaleCountdown)}.
                </span>
              </div>
            )}

            {stats?.tierState === "TIER_USED" && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#0B0B14]">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span>Tier {currentTier} flip used.</span>
                </div>
                {nextTier ? (
                  <span className="text-[11px] font-mono text-[#0B0B14]/80">
                    Hold <strong>{nextTier.tokensNeeded.toLocaleString()}</strong> more $FLIPPO to unlock Tier {nextTier.tier} ({nextTier.multiplier}x).
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-[#0B0B14]/80">
                    You have unlocked and redeemed all standard tiers!
                  </span>
                )}
              </div>
            )}

            {stats?.tierState === "HOLDING_FOR_ELIGIBILITY" && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FE2D88] shrink-0" />
                <span className="text-xs font-mono font-bold text-[#0B0B14]">
                  Holding for eligibility: {stats?.holdTime?.minutesRemaining ?? 10}m left until Tier {currentTier} unlocks (10m hold required).
                </span>
              </div>
            )}

            {stats?.tierState === "BELOW_MIN" && (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#0C73FE] shrink-0" />
                <span className="text-xs font-mono font-bold text-[#0B0B14]">
                  Hold 100,000 $FLIPPO to start earning reward flips.
                </span>
              </div>
            )}

            {stats?.tierState === "BUDGET_REACHED" && (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#FE2D88] shrink-0" />
                <span className="text-xs font-mono font-bold text-[#0B0B14]">
                  Daily reward budget reached. Resets at 00:00 UTC.
                </span>
              </div>
            )}

            {stats?.tierState === "TREASURY_LOW" && (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#FE2D88] shrink-0" />
                <span className="text-xs font-mono font-bold text-[#0B0B14]">
                  Treasury rewards currently paused.
                </span>
              </div>
            )}
          </div>

          {/* HEADS / TAILS CALL TOGGLE */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono font-bold text-[#0B0B14] text-center">
              Call your side before the flip:
            </span>
            <div className="grid grid-cols-2 gap-3">
              {/* Heads Button */}
              <button
                type="button"
                onClick={() => setSelectedCall("heads")}
                disabled={isFlipping}
                className={`min-h-[56px] h-14 p-2 rounded-[20px] border-[3px] border-[#0B0B14] flex items-center justify-center gap-2.5 font-display font-black text-sm tracking-tight transition-all cursor-pointer ${selectedCall === "heads"
                  ? "bg-[#FFE66B] text-[#0B0B14] shadow-[0_4px_0_#0B0B14] translate-y-[-1px]"
                  : "bg-[#F4FAFF] text-[#0B0B14] shadow-[0_2px_0_#0B0B14] hover:bg-white"
                  }`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[#0B0B14] shrink-0">
                  <Image
                    src="/assets/coin-heads.png"
                    alt="Heads"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <span>HEADS</span>
              </button>

              {/* Tails Button */}
              <button
                type="button"
                onClick={() => setSelectedCall("tails")}
                disabled={isFlipping}
                className={`min-h-[56px] h-14 p-2 rounded-[20px] border-[3px] border-[#0B0B14] flex items-center justify-center gap-2.5 font-display font-black text-sm tracking-tight transition-all cursor-pointer ${selectedCall === "tails"
                  ? "bg-[#FFE66B] text-[#0B0B14] shadow-[0_4px_0_#0B0B14] translate-y-[-1px]"
                  : "bg-[#F4FAFF] text-[#0B0B14] shadow-[0_2px_0_#0B0B14] hover:bg-white"
                  }`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[#0B0B14] shrink-0">
                  <Image
                    src="/assets/coin-tails.png"
                    alt="Tails"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <span>TAILS</span>
              </button>
            </div>
          </div>

          {/* ACTION BUTTON (PRIMARY REWARD FLIP) */}
          <div className="flex flex-col gap-2 mt-1">
            <Button
              variant="pink"
              size="lg"
              disabled={isFlipping || !isRewardFlipReady || isWrongNetwork}
              onClick={handleFlip}
              className="w-full text-lg font-black min-h-[56px] h-14 shadow-[0_4px_0_#0B0B14] active:translate-y-1 relative overflow-hidden"
            >
              {isFlipping ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin text-xl">🪙</span>
                  <span>Flipping...</span>
                </span>
              ) : isRewardFlipReady ? (
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5 fill-current" />
                  <span>FLIP FOR REWARD ({currentMultiplier}x)</span>
                </span>
              ) : (
                <span>REWARD FLIP UNAVAILABLE</span>
              )}
            </Button>
          </div>

          {/* FLIP RESULT CARD */}
          {flipResult && (
            <div className="p-3.5 bg-[#E3F1FF] border-2 border-[#0B0B14] rounded-[20px] shadow-[0_3px_0_#0B0B14] animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-[#0B0B14] text-white rounded-full text-xs font-display font-extrabold uppercase">
                    Result: {flipResult.result}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-mono font-extrabold ${flipResult.calledCorrectly
                      ? "bg-[#16A34A] text-white"
                      : "bg-[#0B0B14]/10 text-[#0B0B14]"
                      }`}
                  >
                    {flipResult.calledCorrectly ? "🎯 Correct Call! (+1.5x Bonus)" : "Wrong Call (Base Paid)"}
                  </span>
                </div>
              </div>

              {/* Reward Count Up */}
              <div className="flex items-center justify-between pt-1 border-t border-[#0B0B14]/10">
                <span className="text-xs font-mono text-[#0B0B14]/70">Reward Earned:</span>
                <span className="font-mono text-base font-black text-[#FE2D88]">
                  +{animatedReward} ETH
                </span>
              </div>

              {flipResult.noRewardReason && (
                <div className="text-[11px] font-mono text-[#E5484D] bg-white p-2 rounded-[12px] border border-[#0B0B14]/20">
                  ⚠️ Flip completed with 0 ETH reward: {flipResult.noRewardReason}
                </div>
              )}
            </div>
          )}

          {/* CLAIM REWARDS SECTION */}
          {stats && stats.totalClaimableEth >= 0.001 && (
            <div className="p-3.5 bg-[#FFE66B]/30 border-2 border-[#0B0B14] rounded-[20px] flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#0B0B14]/70 block">
                  Claimable Balance
                </span>
                <span className="font-mono text-sm font-extrabold text-[#0B0B14]">
                  {stats.totalClaimableEth} ETH
                </span>
              </div>
              <Button
                variant="pink"
                size="sm"
                isLoading={isClaiming}
                onClick={handleClaim}
                className="px-4 text-xs font-black min-h-[44px]"
              >
                Claim to Wallet
              </Button>
            </div>
          )}

          {/* Success / Error Notification */}
          {claimSuccess && (
            <div className="p-2.5 bg-[#16A34A]/10 border-2 border-[#16A34A] text-[#16A34A] rounded-[14px] text-xs font-mono font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{claimSuccess}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 bg-[#E5484D]/10 border-2 border-[#E5484D] text-[#E5484D] rounded-[14px] text-xs font-mono font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </Surface>
  );
}
