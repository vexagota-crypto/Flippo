import { NextRequest, NextResponse } from "next/server";
import { repository } from "@/db/repository";
import { getWalletTokenBalance } from "@/server/token-balance";
import { REWARD_CONFIG, getTierByBalance, getNextTier } from "@/config/rewards";
import { getTreasuryLiveBalance } from "@/server/treasury";

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
    const [tokenBalance, wallet, summary, paused, tierFlips, lastWhaleFlips, treasuryBalance] =
      await Promise.all([
        getWalletTokenBalance(addr),
        repository.getOrCreateWallet(addr),
        repository.getLedgerSummary(addr),
        repository.isRewardsPaused(),
        repository.getTierFlips(addr),
        repository.getLastTierFlips(addr, 1),
        getTreasuryLiveBalance().catch(() => 1.0),
      ]);

    const now = Date.now();
    const rawTier = getTierByBalance(tokenBalance);

    // Hold time calculations (10 minutes required)
    const minutesHeld = (now - wallet.balanceFirstObservedAt) / (1000 * 60);
    const holdTimeMet = rawTier.tier === 0 || minutesHeld >= REWARD_CONFIG.MIN_HOLD_MINUTES;
    const minutesRemaining = holdTimeMet ? 0 : Math.max(0, Math.ceil(REWARD_CONFIG.MIN_HOLD_MINUTES - minutesHeld));
    const msRemaining = holdTimeMet ? 0 : Math.max(0, REWARD_CONFIG.HOLD_TIME_MS - (now - wallet.balanceFirstObservedAt));

    const eligibleTier = holdTimeMet ? rawTier : REWARD_CONFIG.TIERS[0];
    const isWhale = rawTier.tier === REWARD_CONFIG.WHALE_TIER_INDEX;

    // Whale cooldown check (24h)
    let whaleCountdownSeconds = 0;
    if (isWhale && lastWhaleFlips.length > 0) {
      const lastUsed = lastWhaleFlips[0].usedAt;
      const cooldownMs = REWARD_CONFIG.LAST_TIER_COOLDOWN_HOURS * 3600 * 1000;
      if (now - lastUsed < cooldownMs) {
        whaleCountdownSeconds = Math.ceil((cooldownMs - (now - lastUsed)) / 1000);
      }
    }

    // Tier 1-4 used check
    const usedThisTier = !isWhale && tierFlips.some((tf) => tf.tier === rawTier.tier);

    // Daily budget & treasury checks
    const walletDailyCapReached = summary.rewardsEarnedTodayEth >= REWARD_CONFIG.WALLET_DAILY_CAP_ETH;
    const globalDailyBudgetReached = summary.globalRewardsEarnedTodayEth >= REWARD_CONFIG.GLOBAL_DAILY_BUDGET_ETH;
    const requiredReward = REWARD_CONFIG.BASE_REWARD_ETH * (rawTier.multiplier || 1.0) * REWARD_CONFIG.CALL_BONUS_MULTIPLIER;
    const treasuryLow = treasuryBalance < requiredReward;

    // Determine Tier State
    let tierState:
      | "BELOW_MIN"
      | "HOLDING_FOR_ELIGIBILITY"
      | "AVAILABLE"
      | "TIER_USED"
      | "WHALE_COOLDOWN"
      | "WHALE_READY"
      | "BUDGET_REACHED"
      | "TREASURY_LOW" = "AVAILABLE";

    if (paused || treasuryLow) {
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

    // Next tier calculation
    const nextTierConfig = getNextTier(rawTier.tier);
    const nextTier = nextTierConfig
      ? {
        ...nextTierConfig,
        tokensNeeded: Math.max(0, nextTierConfig.minTokens - tokenBalance),
      }
      : null;

    // Comprehensive list of all tiers with per-tier statuses
    const tierStatuses = REWARD_CONFIG.TIERS.filter((t) => t.tier > 0).map((t) => {
      const isCurrent = t.tier === rawTier.tier;
      const amountNeeded = Math.max(0, t.minTokens - tokenBalance);
      const usedRecord = tierFlips.find((tf) => tf.tier === t.tier);

      let status: "LOCKED" | "AVAILABLE" | "USED" | "HOLDING" | "FORFEITED";

      if (t.isWhale) {
        if (tokenBalance < t.minTokens) {
          status = "LOCKED";
        } else if (!holdTimeMet) {
          status = "HOLDING";
        } else if (whaleCountdownSeconds > 0) {
          status = "USED";
        } else {
          status = "AVAILABLE";
        }
      } else if (usedRecord) {
        status = usedRecord.flipId.startsWith("forfeited_") ? "FORFEITED" : "USED";
      } else if (t.tier > rawTier.tier) {
        status = "LOCKED";
      } else if (isCurrent) {
        status = holdTimeMet ? "AVAILABLE" : "HOLDING";
      } else {
        // Lower tier than current, but not used (could happen if skipped-tier policy allowed)
        status = "AVAILABLE";
      }

      return {
        tier: t.tier,
        name: t.name,
        minTokens: t.minTokens,
        multiplier: t.multiplier,
        isWhale: !!t.isWhale,
        isCurrent,
        status,
        amountNeeded,
        usedAt: usedRecord ? usedRecord.usedAt : t.isWhale && lastWhaleFlips.length > 0 ? lastWhaleFlips[0].usedAt : undefined,
      };
    });

    return NextResponse.json({
      success: true,
      address: addr,
      tokenBalance,
      rawTier,
      eligibleTier,
      tierState,
      isRewardFlipAvailable,
      holdTime: {
        met: holdTimeMet,
        minutesHeld: Math.round(minutesHeld * 10) / 10,
        minutesRemaining,
        msRemaining,
      },
      whaleCountdownSeconds,
      nextTier,
      tierStatuses,
      usedTiers: tierFlips,
      treasuryLow,
      isRewardsPaused: paused,
      budget: {
        rewardsEarnedTodayEth: summary.rewardsEarnedTodayEth,
        walletDailyCapEth: REWARD_CONFIG.WALLET_DAILY_CAP_ETH,
        walletDailyCapReached,
        globalDailyBudgetReached,
      },
    });
  } catch (err: any) {
    console.error("Error in /api/flip-status:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch flip status" },
      { status: 500 }
    );
  }
}
