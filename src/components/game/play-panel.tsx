"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { robinhoodChain } from "@/lib/chains";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Flame,
  Award,
  Clock,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
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
  const { login, authenticated, getAccessToken, user } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = wallets[0] || (user?.wallet?.address ? { address: user.wallet.address } : null);

  const [selectedCall, setSelectedCall] = useState<"heads" | "tails">("heads");
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [flipResult, setFlipResult] = useState<any>(null);
  const [animatedReward, setAnimatedReward] = useState<number>(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Check wrong network
  const currentChainId = activeWallet && "chainId" in activeWallet && activeWallet.chainId
    ? parseInt(String(activeWallet.chainId).replace("eip155:", ""), 10)
    : robinhoodChain.id;
  const isWrongNetwork = authenticated && currentChainId !== robinhoodChain.id;

  // Fetch user stats
  const fetchStats = async () => {
    if (!activeWallet?.address) return;
    setIsLoadingStats(true);
    try {
      const res = await fetch(`/api/user-stats?address=${activeWallet.address}`);
      const data = await res.json();
      if (data.success) {
        setStats(data);
        if (data.cooldownSecondsLeft > 0) {
          setCooldownRemaining(data.cooldownSecondsLeft);
        }
      }
    } catch (err) {
      console.error("Failed to load user stats:", err);
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

  // Execute Flip
  const handleFlip = async () => {
    if (!authenticated || isFlipping || cooldownRemaining > 0 || isWrongNetwork) return;

    setErrorMessage(null);
    setFlipResult(null);
    onFlipStart();

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
        body: JSON.stringify({
          call: selectedCall,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Flip request failed");
      }

      // Wait 1.4s for coin spin landing
      setTimeout(() => {
        onFlipComplete(data.flip.result);
        setFlipResult(data.flip);
        setCooldownRemaining(30);
        fetchStats();

        // Confetti burst on correct calls!
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
      console.error("Flip error:", err);
      setErrorMessage(err?.message || "Failed to complete flip.");
      onFlipComplete("heads");
    }
  };

  // Claim Rewards
  const handleClaim = async () => {
    if (!authenticated || isClaiming) return;
    setIsClaiming(true);
    setClaimSuccess(null);
    setErrorMessage(null);

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
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Claim failed");
      }

      setClaimSuccess(`Claim broadcasted! TX: ${data.txHash.slice(0, 8)}...`);
      fetchStats();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to claim rewards");
    } finally {
      setIsClaiming(false);
    }
  };

  // Disabled reason computation
  let disabledReason: string | null = null;
  if (isWrongNetwork) {
    disabledReason = "Please switch to Robinhood Chain";
  } else if (cooldownRemaining > 0) {
    disabledReason = `Cooldown active (${cooldownRemaining}s)`;
  } else if (stats && stats.flipsToday >= stats.maxFlipsPerDay) {
    disabledReason = `Daily flip limit reached (${stats.flipsToday}/${stats.maxFlipsPerDay})`;
  } else if (stats && stats.rewardsEarnedTodayEth >= stats.walletDailyCapEth) {
    disabledReason = `Daily reward cap reached (${stats.rewardsEarnedTodayEth} ETH)`;
  } else if (stats && stats.isRewardsPaused) {
    disabledReason = "Protocol rewards currently paused";
  } else if (stats && !stats.holdTimeMet && stats.currentTier === 0) {
    disabledReason = `Hold time active: ${stats.hoursRemaining}h remaining for multiplier`;
  }

  return (
    <Surface
      tone="white"
      radius="xl"
      className="w-full max-w-lg p-5 sm:p-7 bg-white border-[3px] border-[#0B0B14] shadow-[0_6px_0_#0B0B14] flex flex-col gap-5 select-none transition-all"
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

          <Button
            variant="pink"
            size="lg"
            onClick={() => login()}
            className="w-full text-base font-black shadow-[0_5px_0_#0B0B14]"
          >
            Connect Wallet to Play
          </Button>

          <p className="text-[11px] font-mono text-[#0B0B14]/60">
            🔒 Safe & zero-risk: no approvals or spending transactions are ever requested.
          </p>
        </div>
      ) : (
        /* 2. CONNECTED PLAY STATE */
        <div className="flex flex-col gap-4">
          {/* Header Stats Bar */}
          <div className="grid grid-cols-3 gap-2 p-2 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-[20px] text-center">
            {/* Holdings & Tier */}
            <div className="flex flex-col items-center justify-center p-1.5 border-r-2 border-[#0B0B14]/15">
              <span className="text-[10px] font-mono uppercase text-[#0B0B14]/60">
                Holdings
              </span>
              <span className="font-mono text-xs font-extrabold text-[#0B0B14] truncate">
                {stats?.tokenBalance !== undefined ? stats.tokenBalance.toLocaleString() : "..."}
              </span>
              <span className="text-[10px] font-mono font-bold text-[#0C73FE]">
                {stats?.multiplier !== undefined ? `${stats.multiplier}x Multiplier` : "..."}
              </span>
            </div>

            {/* Today's Flips */}
            <div className="flex flex-col items-center justify-center p-1.5 border-r-2 border-[#0B0B14]/15">
              <span className="text-[10px] font-mono uppercase text-[#0B0B14]/60">
                Flips Today
              </span>
              <span className="font-mono text-xs font-extrabold text-[#0B0B14]">
                {stats?.flipsToday !== undefined
                  ? `${stats.flipsToday} of ${stats.maxFlipsPerDay}`
                  : "..."}
              </span>
              <span className="text-[10px] font-mono text-[#16A34A] font-bold">
                {stats?.maxFlipsPerDay && stats?.flipsToday !== undefined
                  ? `${Math.max(0, stats.maxFlipsPerDay - stats.flipsToday)} left`
                  : ""}
              </span>
            </div>

            {/* Next Reward Estimate */}
            <div className="flex flex-col items-center justify-center p-1.5">
              <span className="text-[10px] font-mono uppercase text-[#0B0B14]/60">
                Next Win
              </span>
              <span className="font-mono text-xs font-extrabold text-[#FE2D88]">
                {stats?.nextRewardEstimate !== undefined
                  ? `~${stats.nextRewardEstimate} ETH`
                  : "..."}
              </span>
              <span className="text-[10px] font-mono text-[#0B0B14]/60">
                with Call Bonus
              </span>
            </div>
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
                className={`min-h-[56px] h-14 p-2 rounded-[20px] border-[3px] border-[#0B0B14] flex items-center justify-center gap-2.5 font-display font-black text-sm tracking-tight transition-all cursor-pointer ${
                  selectedCall === "heads"
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
                className={`min-h-[56px] h-14 p-2 rounded-[20px] border-[3px] border-[#0B0B14] flex items-center justify-center gap-2.5 font-display font-black text-sm tracking-tight transition-all cursor-pointer ${
                  selectedCall === "tails"
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

          {/* GIANT FLIP BUTTON */}
          <div className="flex flex-col gap-1.5 mt-1">
            <Button
              variant="pink"
              size="lg"
              disabled={isFlipping || cooldownRemaining > 0 || isWrongNetwork}
              onClick={handleFlip}
              className="w-full text-xl font-black min-h-[58px] h-15 shadow-[0_5px_0_#0B0B14] active:translate-y-1 relative overflow-hidden"
            >
              {isFlipping ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin text-2xl">🪙</span>
                  <span>Flipping...</span>
                </span>
              ) : cooldownRemaining > 0 ? (
                <span className="flex items-center gap-2 font-mono">
                  <Clock className="w-5 h-5 animate-pulse" />
                  <span>Cooldown ({cooldownRemaining}s)</span>
                </span>
              ) : (
                <span>FLIP COIN</span>
              )}
            </Button>

            {/* Small reason notice for disabled states */}
            {disabledReason && (
              <div className="flex items-center justify-center gap-1.5 text-center text-xs font-mono font-bold text-[#E5484D] mt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{disabledReason}</span>
              </div>
            )}
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
                    className={`px-2 py-0.5 rounded-full text-xs font-mono font-extrabold ${
                      flipResult.calledCorrectly
                        ? "bg-[#16A34A] text-white"
                        : "bg-[#0B0B14]/10 text-[#0B0B14]"
                    }`}
                  >
                    {flipResult.calledCorrectly ? "🎯 Correct Call! (+1.5x)" : "Wrong Call (Base Paid)"}
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
          {stats && stats.totalClaimableEth >= stats.minClaimThresholdEth && (
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
                className="px-4 text-xs font-black"
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
