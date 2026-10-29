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
    const [tokenBalance, wallet, summary, paused, tierFlips, lastWhaleFlips, practiceCountToday, lastPractice] =
      await Promise.all([
        getWalletTokenBalance(addr),
        repository.getOrCreateWallet(addr),
        repository.getLedgerSummary(addr),
        repository.isRewardsPaused(),
        repository.getTierFlips(addr),
        repository.getLastTierFlips(addr, 1),
        repository.getPracticeFlipsCountToday(addr),
        repository.getLastPracticeFlip(addr),
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

    // Whale cooldown check (24h)
    const isWhale = rawTier.tier === REWARD_CONFIG.WHALE_TIER_INDEX;
    let whaleCountdownSeconds = 0;
    if (isWhale && lastWhaleFlips.length > 0) {
      const lastUsed = lastWhaleFlips[0].usedAt;
      const cooldownMs = REWARD_CONFIG.LAST_TIER_COOLDOWN_HOURS * 3600 * 1000;
      if (now - lastUsed < cooldownMs) {
        whaleCountdownSeconds = Math.ceil((cooldownMs - (now - lastUsed)) / 1000);
      }
    }

    const usedThisTier = !isWhale && tierFlips.some((tf) => tf.tier === rawTier.tier);
    const walletDailyCapReached = summary.rewardsEarnedTodayEth >= REWARD_CONFIG.WALLET_DAILY_CAP_ETH;
    const globalDailyBudgetReached = summary.globalRewardsEarnedTodayEth >= REWARD_CONFIG.GLOBAL_DAILY_BUDGET_ETH;

    let tierState:
      | "BELOW_MIN"
      | "HOLDING_FOR_ELIGIBILITY"
      | "AVAILABLE"
      | "TIER_USED"
      | "WHALE_COOLDOWN"
      | "WHALE_READY"
      | "BUDGET_REACHED"
      | "TREASURY_LOW" = "AVAILABLE";

    if (paused) {
      tierState = "TREASURY_LOW";
    } else if (walletDailyCapReached || globalDailyBudgetReached) {
      tierState = "BUDGET_REACHED";
    } else if (rawTier.tier === 0) {
      tierState = "BELOW_MIN";
    } else if (!holdTimeMet) {
      tierState = "HOLDING_FOR_ELIGIBILITY";
    } else if (isWhale) {
      tierState = whaleCountdownSeconds > 0 ? "WHALE_COOLDOWN" : "WHALE_READY";
    } else if (usedThisTier) {
      tierState = "TIER_USED";
    } else {
      tierState = "AVAILABLE";
    }

    const isRewardFlipAvailable = tierState === "AVAILABLE" || tierState === "WHALE_READY";
    const practiceFlipsRemaining = Math.max(0, REWARD_CONFIG.PRACTICE_MAX_PER_DAY - practiceCountToday);
    const practiceCooldownMs = REWARD_CONFIG.PRACTICE_COOLDOWN_SECONDS * 1000;
    const practiceCooldownSecondsLeft =
      lastPractice && now - lastPractice.createdAt < practiceCooldownMs
        ? Math.ceil((practiceCooldownMs - (now - lastPractice.createdAt)) / 1000)
        : 0;

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
      rawTier: rawTier.tier,
      tierState,
      isRewardFlipAvailable,
      holdTimeMet,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      whaleCountdownSeconds,
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
      practiceFlipsToday: practiceCountToday,
      practiceFlipsRemaining,
      practiceCooldownSecondsLeft,
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
