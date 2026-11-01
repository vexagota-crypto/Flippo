import { repository } from "@/db/repository";
import { REWARD_CONFIG, getTierByBalance, calculateFlipReward } from "@/config/rewards";
import { getWalletTokenBalance } from "./token-balance";
import { generateServerSeedCommitment, determineFlipOutcome } from "@/lib/fairness";
import { getTreasuryLiveBalance } from "./treasury";

export type NoRewardReason =
  | "BELOW_MIN_HOLD"
  | "HOLD_TIME_NOT_MET"
  | "TIER_FLIP_USED"
  | "WHALE_COOLDOWN_ACTIVE"
  | "WALLET_DAILY_CAP_REACHED"
  | "GLOBAL_DAILY_BUDGET_REACHED"
  | "TREASURY_INSUFFICIENT"
  | "REWARDS_PAUSED"
  | "WALLET_BANNED";

export interface FlipExecutionRequest {
  walletAddress: string;
  call: "heads" | "tails";
  clientSeed?: string;
  idempotencyKey?: string;
}

export interface FlipExecutionResult {
  id: string;
  walletAddress: string;
  call: "heads" | "tails";
  result: "heads" | "tails";
  calledCorrectly: boolean;
  tokenBalance: number;
  appliedTier: number;
  tierMultiplier: number;
  callMultiplier: number;
  rewardEth: number;
  noRewardReason: NoRewardReason | null;
  serverSeed: string;
  seedHash: string;
  clientSeed: string;
  nonce: number;
  createdAt: number;
}

export async function executeFlip(
  req: FlipExecutionRequest
): Promise<FlipExecutionResult> {
  const addr = req.walletAddress.toLowerCase();
  const now = Date.now();

  // 1. Check if wallet is banned
  const wallet = await repository.getOrCreateWallet(addr);
  if (wallet.isBanned) {
    throw new Error("Wallet is restricted from playing.");
  }

  // 2. Check if protocol rewards are paused
  const rewardsPaused = await repository.isRewardsPaused();

  // 3. Generate Provably Fair Seeds & Outcome
  const clientSeed = req.clientSeed || Math.random().toString(36).substring(2, 15);
  const { serverSeed, seedHash } = generateServerSeedCommitment();
  const nonce = wallet.totalFlips + 1;
  const result = determineFlipOutcome(serverSeed, clientSeed, nonce);
  const calledCorrectly = req.call === result;
  const flipId = `flp_${now}_${Math.random().toString(36).substring(2, 7)}`;

  // 4. Read token balance and assess multiplier tier
  const tokenBalance = await getWalletTokenBalance(addr);
  await repository.updateWalletBalance(addr, tokenBalance);
  const rawTier = getTierByBalance(tokenBalance);

  let eligibleTier = rawTier;
  let noRewardReason: NoRewardReason | null = null;

  if (rewardsPaused) {
    noRewardReason = "REWARDS_PAUSED";
  } else if (rawTier.tier === 0) {
    noRewardReason = "BELOW_MIN_HOLD";
  } else {
    // 5. Evaluate Hold-Time Rule (10 minutes minimum hold at or above tier)
    const minutesHeld = (now - wallet.balanceFirstObservedAt) / (1000 * 60);
    if (minutesHeld < REWARD_CONFIG.MIN_HOLD_MINUTES) {
      noRewardReason = "HOLD_TIME_NOT_MET";
      eligibleTier = REWARD_CONFIG.TIERS[0];
    } else {
      // 6. Evaluate Tier-Gated Flip Availability
      const isWhale = rawTier.tier === REWARD_CONFIG.WHALE_TIER_INDEX;

      if (isWhale) {
        // Whale tier: rolling 24h privilege
        const recentWhaleFlips = await repository.getLastTierFlips(addr, 1);
        if (recentWhaleFlips.length > 0) {
          const lastUsed = recentWhaleFlips[0].usedAt;
          const cooldownMs = REWARD_CONFIG.LAST_TIER_COOLDOWN_HOURS * 3600 * 1000;
          if (now - lastUsed < cooldownMs) {
            noRewardReason = "WHALE_COOLDOWN_ACTIVE";
          }
        }
      } else {
        // Tiers 1-4: exactly one flip per tier
        const usedTierFlips = await repository.getTierFlips(addr);
        const hasUsedThisTier = usedTierFlips.some((tf) => tf.tier === rawTier.tier);
        if (hasUsedThisTier) {
          noRewardReason = "TIER_FLIP_USED";
        }
      }
    }
  }

  // 8. Evaluate Daily Budget Caps
  const ledgerSummary = await repository.getLedgerSummary(addr);
  if (!noRewardReason) {
    if (ledgerSummary.rewardsEarnedTodayEth >= REWARD_CONFIG.WALLET_DAILY_CAP_ETH) {
      noRewardReason = "WALLET_DAILY_CAP_REACHED";
    } else if (ledgerSummary.globalRewardsEarnedTodayEth >= REWARD_CONFIG.GLOBAL_DAILY_BUDGET_ETH) {
      noRewardReason = "GLOBAL_DAILY_BUDGET_REACHED";
    }
  }

  // 9. Calculate potential reward
  const calc = calculateFlipReward({
    tierMultiplier: noRewardReason ? 0 : eligibleTier.multiplier,
    calledCorrectly,
  });

  let finalRewardEth = calc.totalRewardEth;

  // 10. Check live treasury balance if reward > 0
  if (finalRewardEth > 0) {
    const treasuryBalance = await getTreasuryLiveBalance();
    if (treasuryBalance < finalRewardEth) {
      finalRewardEth = 0;
      noRewardReason = "TREASURY_INSUFFICIENT";
    }
  }

  const flipRecord = {
    id: flipId,
    walletAddress: addr,
    clientSeed,
    serverSeed,
    seedHash,
    nonce,
    call: req.call,
    result,
    calledCorrectly: calledCorrectly ? 1 : 0,
    tokenBalance,
    appliedTier: eligibleTier.tier,
    tierMultiplier: eligibleTier.multiplier,
    callMultiplier: calledCorrectly ? REWARD_CONFIG.CALL_BONUS_MULTIPLIER : 1.0,
    rewardEth: finalRewardEth,
    noRewardReason,
    createdAt: now,
  };

  // 11. Atomic recording (single transaction prevents double claims)
  if (!noRewardReason && eligibleTier.tier > 0) {
    const isWhale = eligibleTier.tier === REWARD_CONFIG.WHALE_TIER_INDEX;
    const recordResult = await repository.recordTierFlipAtomic({
      flip: flipRecord,
      tier: eligibleTier.tier,
      isWhale,
      ledgerAmountEth: finalRewardEth,
      idempotencyKey: req.idempotencyKey,
    });

    if (!recordResult.success) {
      // Concurrency protection caught parallel double submit
      throw new Error(recordResult.error || "Concurrent flip rejected");
    }
  } else {
    // Record flip without tier claim (e.g. capped or no reward)
    await repository.recordFlip(flipRecord, finalRewardEth);
  }

  return {
    ...flipRecord,
    calledCorrectly,
    noRewardReason,
  };
}
