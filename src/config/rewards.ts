export interface MultiplierTier {
  tier: number;
  name: string;
  minTokens: number;
  multiplier: number;
  description: string;
}

export const REWARD_CONFIG = {
  // Base Reward per flip in ETH
  BASE_REWARD_ETH: 0.0002,

  // Multiplier awarded when user correctly predicts Heads / Tails
  CALL_BONUS_MULTIPLIER: 1.5,

  // Multiplier tiers based on $FLIPPO token holdings (with hard cap at Tier 5)
  TIERS: [
    {
      tier: 0,
      name: "No Holding",
      minTokens: 0,
      multiplier: 0,
      description: "Below minimum hold (flip for fun, 0x reward)",
    },
    {
      tier: 1,
      name: "Bronze Flipper",
      minTokens: 1_000,
      multiplier: 1.0,
      description: "1,000 $FLIPPO: Standard 1x reward",
    },
    {
      tier: 2,
      name: "Silver Flipper",
      minTokens: 10_000,
      multiplier: 1.5,
      description: "10,000 $FLIPPO: 1.5x reward boost",
    },
    {
      tier: 3,
      name: "Gold Flipper",
      minTokens: 50_000,
      multiplier: 2.0,
      description: "50,000 $FLIPPO: 2x double reward",
    },
    {
      tier: 4,
      name: "Platinum Whale",
      minTokens: 200_000,
      multiplier: 3.0,
      description: "200,000 $FLIPPO: 3x triple reward",
    },
    {
      tier: 5,
      name: "Diamond Flippo (Hard Cap)",
      minTokens: 1_000_000,
      multiplier: 5.0,
      description: "1,000,000 $FLIPPO: 5x maximum hard cap",
    },
  ] as MultiplierTier[],

  // Hold-time rule: must maintain balance at or above tier for MIN_HOLD_HOURS to unlock tier
  MIN_HOLD_HOURS: 24,

  // Cooldown between flips per wallet in seconds
  COOLDOWN_SECONDS: 30,

  // Maximum flips per wallet per UTC day
  MAX_FLIPS_PER_WALLET_PER_DAY: 10,

  // Maximum ETH rewards a single wallet can earn per UTC day
  WALLET_DAILY_CAP_ETH: 0.01,

  // Maximum ETH rewards the global protocol distributes per UTC day
  GLOBAL_DAILY_BUDGET_ETH: 0.5,

  // Minimum claim threshold before wallet can trigger a payout transaction
  MIN_CLAIM_THRESHOLD_ETH: 0.001,
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
