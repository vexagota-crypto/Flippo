import { NextRequest, NextResponse } from "next/server";
import { repository } from "@/db/repository";
import { getWalletTokenBalance } from "@/server/token-balance";
import { REWARD_CONFIG, getTierByBalance, calculateFlipReward } from "@/config/rewards";

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: "Valid wallet address query parameter required" },
        { status: 400 }
      );
    }

    const addr = address.toLowerCase();
    const [tokenBalance, wallet, summary, paused] = await Promise.all([
      getWalletTokenBalance(addr),
      repository.getOrCreateWallet(addr),
      repository.getLedgerSummary(addr),
      repository.isRewardsPaused(),
    ]);

    const rawTier = getTierByBalance(tokenBalance);

    // Evaluate hold-time status
    const now = Date.now();
    const hoursHeld = (now - wallet.balanceFirstObservedAt) / (1000 * 60 * 60);
    const holdTimeMet = rawTier.tier === 0 || hoursHeld >= REWARD_CONFIG.MIN_HOLD_HOURS;
    const hoursRemaining = holdTimeMet ? 0 : Math.max(0, REWARD_CONFIG.MIN_HOLD_HOURS - hoursHeld);

    // Active tier considering hold-time
    const activeTier = holdTimeMet ? rawTier : REWARD_CONFIG.TIERS[0];

    // Next tier calculation
    const allTiers = [...REWARD_CONFIG.TIERS].sort((a, b) => a.tier - b.tier);
    const nextTier = allTiers.find((t) => t.tier === rawTier.tier + 1) || null;
    const tokensNeededForNextTier = nextTier ? Math.max(0, nextTier.minTokens - tokenBalance) : 0;
    const tierProgressPct = nextTier
      ? Math.min(100, Math.max(0, ((tokenBalance - rawTier.minTokens) / (nextTier.minTokens - rawTier.minTokens)) * 100))
      : 100;

    // Cooldown check
    let cooldownSecondsLeft = 0;
    if (summary.lastFlipTimestamp) {
      const elapsedSec = (now - summary.lastFlipTimestamp) / 1000;
      if (elapsedSec < REWARD_CONFIG.COOLDOWN_SECONDS) {
        cooldownSecondsLeft = Math.ceil(REWARD_CONFIG.COOLDOWN_SECONDS - elapsedSec);
      }
    }

    // Estimate next reward if called correctly
    const nextRewardEstimate = calculateFlipReward({
      tierMultiplier: activeTier.multiplier,
      calledCorrectly: true,
    }).totalRewardEth;

    return NextResponse.json({
      success: true,
      address: addr,
      tokenBalance,
      currentTier: activeTier.tier,
      tierName: activeTier.name,
      multiplier: activeTier.multiplier,
      holdTimeMet,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      nextTier: nextTier
        ? {
            tier: nextTier.tier,
            name: nextTier.name,
            minTokens: nextTier.minTokens,
            multiplier: nextTier.multiplier,
            tokensNeeded: tokensNeededForNextTier,
            progressPct: Math.round(tierProgressPct),
          }
        : null,
      flipsToday: summary.flipsToday,
      maxFlipsPerDay: REWARD_CONFIG.MAX_FLIPS_PER_WALLET_PER_DAY,
      rewardsEarnedTodayEth: summary.rewardsEarnedTodayEth,
      walletDailyCapEth: REWARD_CONFIG.WALLET_DAILY_CAP_ETH,
      totalAccruedEth: summary.totalAccruedEth,
      totalClaimableEth: summary.totalClaimableEth,
      totalPaidEth: summary.totalPaidEth,
      minClaimThresholdEth: REWARD_CONFIG.MIN_CLAIM_THRESHOLD_ETH,
      cooldownSecondsLeft,
      cooldownTotalSeconds: REWARD_CONFIG.COOLDOWN_SECONDS,
      nextRewardEstimate,
      streak: wallet.currentStreak,
      bestStreak: wallet.bestStreak,
      isRewardsPaused: paused,
    });
  } catch (err: any) {
    console.error("Error fetching user stats:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}
