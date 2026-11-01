export interface MultiplierTier {
  tier: number;
  name: string;
  minTokens: number;
  multiplier: number;
  description: string;
  isWhale?: boolean;
}

export type SkippedTierPolicy = "forfeit" | "allow";

export const REWARD_CONFIG = {
  // Base Reward per flip in ETH (updated to 0.002 ETH)
  BASE_REWARD_ETH: 0.002,

  // Multiplier awarded when user correctly predicts Heads / Tails
  CALL_BONUS_MULTIPLIER: 1.5,

  // Multiplier tiers based on $FLIPPO token holdings
  TIERS: [
    {
      tier: 0,
      name: "No Holding",
      minTokens: 0,
      multiplier: 0,
      description: "Below minimum hold (0x reward)",
      isWhale: false,
    },
    {
      tier: 1,
      name: "Bronze Flipper",
      minTokens: 100_000,
      multiplier: 1.0,
      description: "100,000 $FLIPPO: 1x standard reward (1 flip per tier)",
      isWhale: false,
    },
    {
      tier: 2,
      name: "Silver Flipper",
      minTokens: 500_000,
      multiplier: 1.5,
      description: "500,000 $FLIPPO: 1.5x reward boost (1 flip per tier)",
      isWhale: false,
    },
    {
      tier: 3,
      name: "Gold Flipper",
      minTokens: 2_000_000,
      multiplier: 2.0,
      description: "2,000,000 $FLIPPO: 2x double reward (1 flip per tier)",
      isWhale: false,
    },
    {
      tier: 4,
      name: "Platinum Whale",
      minTokens: 5_000_000,
      multiplier: 3.0,
      description: "5,000,000 $FLIPPO: 3x triple reward (1 flip per tier)",
      isWhale: false,
    },
    {
      tier: 5,
      name: "Diamond Whale",
      minTokens: 10_000_000,
      multiplier: 5.0,
      description: "10,000,000 $FLIPPO: 5x maximum privilege (1 flip every 24h)",
      isWhale: true,
    },
  ] as MultiplierTier[],

  // Whale tier index
  WHALE_TIER_INDEX: 5,

  // Policy when a wallet skips tiers by making a large buy:
  // "forfeit" (default): skipped lower tiers are locked and forfeited; only the highest tier flip is available.
  SKIPPED_TIER_POLICY: "forfeit" as SkippedTierPolicy,

  // Whale tier rolling cooldown in hours
  LAST_TIER_COOLDOWN_HOURS: 24,

  // Hold-time rule: must maintain balance at or above tier for 10 minutes to unlock tier
  MIN_HOLD_MINUTES: 10,
  HOLD_TIME_MS: 10 * 60 * 1000, // 600,000 ms (10 minutes)
  MIN_HOLD_HOURS: 10 / 60,

  // General cooldown between flips in seconds
  COOLDOWN_SECONDS: 30,

  // Maximum flips per wallet per day
  MAX_FLIPS_PER_WALLET_PER_DAY: 10,

  // Maximum ETH rewards a single wallet can earn per UTC day
  WALLET_DAILY_CAP_ETH: 0.1,

  // Maximum ETH rewards the global protocol distributes per UTC day
  GLOBAL_DAILY_BUDGET_ETH: 5.0,

  // Minimum claim threshold before wallet can trigger a payout transaction
  MIN_CLAIM_THRESHOLD_ETH: 0.005,
} as const;

/**
 * Returns the highest tier qualified by raw balance (ignoring hold time)
 */
export function getTierByBalance(tokenBalance: number): MultiplierTier {
  const tiers = [...REWARD_CONFIG.TIERS].sort((a, b) => b.minTokens - a.minTokens);
  for (const tier of tiers) {
    if (tokenBalance >= tier.minTokens) {
      return tier;
    }
  }
  return REWARD_CONFIG.TIERS[0];
}

/**
 * Returns the next higher tier, or null if already at max (Whale tier)
 */
export function getNextTier(currentTierNumber: number): MultiplierTier | null {
  const next = REWARD_CONFIG.TIERS.find((t) => t.tier === currentTierNumber + 1);
  return next || null;
}

/**
 * Calculate reward for a flip
 * reward = BASE_REWARD_ETH x tierMultiplier x callBonus
 */
export function calculateFlipReward(params: {
  tierMultiplier: number;
  calledCorrectly: boolean;
}): {
  baseReward: number;
  tierMultiplier: number;
  callBonus: number;
  totalRewardEth: number;
} {
  const baseReward = REWARD_CONFIG.BASE_REWARD_ETH;
  const tierMultiplier = params.tierMultiplier;
  const callBonus = params.calledCorrectly ? REWARD_CONFIG.CALL_BONUS_MULTIPLIER : 1.0;

  if (tierMultiplier <= 0) {
    return {
      baseReward,
      tierMultiplier: 0,
      callBonus,
      totalRewardEth: 0,
    };
  }

  const rawReward = baseReward * tierMultiplier * callBonus;
  // Round to 8 decimal places for clean ETH display
  const totalRewardEth = Math.round(rawReward * 1e8) / 1e8;

  return {
    baseReward,
    tierMultiplier,
    callBonus,
    totalRewardEth,
  };
}
