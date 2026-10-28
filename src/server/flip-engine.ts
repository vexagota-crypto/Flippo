import { repository } from "@/db/repository";
import { REWARD_CONFIG, getTierByBalance, calculateFlipReward } from "@/config/rewards";
import { getWalletTokenBalance } from "./token-balance";
import { generateServerSeedCommitment, determineFlipOutcome } from "@/lib/fairness";
import { getTreasuryLiveBalance } from "./treasury";

export type NoRewardReason =
  | "BELOW_MIN_HOLD"
  | "HOLD_TIME_NOT_MET"
  | "COOLDOWN_ACTIVE"
  | "MAX_FLIPS_EXCEEDED"
  | "WALLET_DAILY_CAP_REACHED"
  | "GLOBAL_DAILY_BUDGET_REACHED"
  | "TREASURY_INSUFFICIENT"
  | "REWARDS_PAUSED"
  | "WALLET_BANNED";

export interface FlipExecutionRequest {
  walletAddress: string;
  call: "heads" | "tails";
  clientSeed?: string;
  serverSeedCommitment?: string;
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

  // 4. Read token balance and assess multiplier tier
  const tokenBalance = await getWalletTokenBalance(addr);
  const rawTier = getTierByBalance(tokenBalance);

  // 5. Evaluate Hold-Time Rule
  // A wallet only counts a tier after its balance has stayed at or above that tier's threshold for MIN_HOLD_HOURS
  let eligibleTier = rawTier;
  let holdTimeReason: NoRewardReason | null = null;

  if (rawTier.tier > 0) {
    const hoursHeld = (now - wallet.balanceFirstObservedAt) / (1000 * 60 * 60);
    if (hoursHeld < REWARD_CONFIG.MIN_HOLD_HOURS) {
      eligibleTier = REWARD_CONFIG.TIERS[0]; // Tier 0 (0x)
      holdTimeReason = "HOLD_TIME_NOT_MET";
    }
  }

  // 6. Evaluate Cooldown, Caps & Budget Controls
  const ledgerSummary = await repository.getLedgerSummary(addr);
  let noRewardReason: NoRewardReason | null = null;

  if (rewardsPaused) {
    noRewardReason = "REWARDS_PAUSED";
  } else if (rawTier.tier === 0) {
    noRewardReason = "BELOW_MIN_HOLD";
  } else if (holdTimeReason) {
    noRewardReason = holdTimeReason;
  } else if (
    ledgerSummary.lastFlipTimestamp &&
    now - ledgerSummary.lastFlipTimestamp < REWARD_CONFIG.COOLDOWN_SECONDS * 1000
  ) {
    noRewardReason = "COOLDOWN_ACTIVE";
  } else if (ledgerSummary.flipsToday >= REWARD_CONFIG.MAX_FLIPS_PER_WALLET_PER_DAY) {
    noRewardReason = "MAX_FLIPS_EXCEEDED";
  } else if (ledgerSummary.rewardsEarnedTodayEth >= REWARD_CONFIG.WALLET_DAILY_CAP_ETH) {
    noRewardReason = "WALLET_DAILY_CAP_REACHED";
  } else if (ledgerSummary.globalRewardsEarnedTodayEth >= REWARD_CONFIG.GLOBAL_DAILY_BUDGET_ETH) {
    noRewardReason = "GLOBAL_DAILY_BUDGET_REACHED";
  }

  // 7. Calculate potential reward
  const calc = calculateFlipReward({
    tierMultiplier: noRewardReason ? 0 : eligibleTier.multiplier,
    calledCorrectly,
  });

  let finalRewardEth = calc.totalRewardEth;

  // 8. If reward > 0, check live treasury balance
  if (finalRewardEth > 0) {
    const treasuryBalance = await getTreasuryLiveBalance();
    if (treasuryBalance < finalRewardEth) {
      // Treasury cannot cover
      finalRewardEth = 0;
      noRewardReason = "TREASURY_INSUFFICIENT";
    }
  }

  // 9. Build and record flip record
  const flipId = `flp_${now}_${Math.random().toString(36).substring(2, 7)}`;
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

  // Record in repository and append to ledger
  await repository.recordFlip(flipRecord, finalRewardEth);

  return {
    ...flipRecord,
    calledCorrectly,
    noRewardReason,
  };
}
