import { describe, it, expect } from "vitest";
import { repository } from "../src/db/repository";
import { REWARD_CONFIG, getTierByBalance, calculateFlipReward } from "../src/config/rewards";
import { determineFlipOutcome, generateServerSeedCommitment, verifyFlipFairness } from "../src/lib/fairness";

function makeTestAddress(suffix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const time = Date.now().toString(36);
  const combined = `${rand}_${time}_${suffix}`.slice(0, 38).padStart(38, "0");
  return `0x99${combined}`.toLowerCase();
}

describe("Tier-Gated Reward Mechanic (E4)", () => {
  it("enforces one flip per tier: second flip at same tier is rejected", async () => {
    const addr = makeTestAddress("tier_one_only");
    await repository.getOrCreateWallet(addr);

    const now = Date.now();
    const flip1 = {
      id: `flp_${now}_1`,
      walletAddress: addr,
      clientSeed: "seed1",
      serverSeed: "srv1",
      seedHash: "hash1",
      nonce: 1,
      call: "heads" as const,
      result: "heads" as const,
      calledCorrectly: 1,
      tokenBalance: 150_000,
      appliedTier: 1,
      tierMultiplier: 1.0,
      callMultiplier: 1.5,
      rewardEth: 0.003,
      noRewardReason: null,
      createdAt: now,
    };

    // First Tier 1 flip succeeds
    const res1 = await repository.recordTierFlipAtomic({
      flip: flip1,
      tier: 1,
      isWhale: false,
      ledgerAmountEth: 0.0003,
    });
    if (!res1.success) {
      console.error("DEBUG res1 error:", res1.error);
    }
    expect(res1.success).toBe(true);

    // Second Tier 1 flip MUST be rejected
    const flip2 = {
      ...flip1,
      id: `flp_${now}_2`,
      nonce: 2,
    };
    const res2 = await repository.recordTierFlipAtomic({
      flip: flip2,
      tier: 1,
      isWhale: false,
      ledgerAmountEth: 0.0003,
    });
    expect(res2.success).toBe(false);
    expect(res2.error).toMatch(/already been used/i);
  });

  it("unlocks tiers 1, 2, 3 in sequence, allowing exactly 1 flip each", async () => {
    const addr = makeTestAddress("seq_unlocks");
    await repository.getOrCreateWallet(addr);

    for (let tier = 1; tier <= 3; tier++) {
      const now = Date.now() + tier;
      const flip = {
        id: `flp_seq_${tier}_${now}`,
        walletAddress: addr,
        clientSeed: `seed_${tier}`,
        serverSeed: `srv_${tier}`,
        seedHash: `hash_${tier}`,
        nonce: tier,
        call: "heads" as const,
        result: "heads" as const,
        calledCorrectly: 1,
        tokenBalance: tier === 1 ? 100_000 : tier === 2 ? 500_000 : 2_000_000,
        appliedTier: tier,
        tierMultiplier: tier === 1 ? 1.0 : tier === 2 ? 1.5 : 2.0,
        callMultiplier: 1.5,
        rewardEth: 0.003 * tier,
        noRewardReason: null,
        createdAt: now,
      };

      const res = await repository.recordTierFlipAtomic({
        flip,
        tier,
        isWhale: false,
        ledgerAmountEth: 0.003 * tier,
      });
      expect(res.success).toBe(true);
    }

    const tierFlips = await repository.getTierFlips(addr);
    expect(tierFlips.map((t) => t.tier).sort()).toEqual([1, 2, 3]);
  });

  it("skipped tier policy (forfeit): jumping to tier 3 forfeits lower tiers 1 & 2", async () => {
    const addr = makeTestAddress("skipped_tier_forfeit");
    await repository.getOrCreateWallet(addr);

    const now = Date.now();
    const flipTier3 = {
      id: `flp_jump_${now}`,
      walletAddress: addr,
      clientSeed: "seed3",
      serverSeed: "srv3",
      seedHash: "hash3",
      nonce: 1,
      call: "tails" as const,
      result: "tails" as const,
      calledCorrectly: 1,
      tokenBalance: 2_000_000,
      appliedTier: 3,
      tierMultiplier: 2.0,
      callMultiplier: 1.5,
      rewardEth: 0.006,
      noRewardReason: null,
      createdAt: now,
    };

    // Wallet jumps directly to tier 3
    const resJump = await repository.recordTierFlipAtomic({
      flip: flipTier3,
      tier: 3,
      isWhale: false,
      ledgerAmountEth: 0.006,
    });
    expect(resJump.success).toBe(true);

    // Tiers 1 and 2 should now be recorded as used/forfeited
    const usedTiers = await repository.getTierFlips(addr);
    const tiersUsed = usedTiers.map((t) => t.tier);
    expect(tiersUsed).toContain(1);
    expect(tiersUsed).toContain(2);
    expect(tiersUsed).toContain(3);

    // Attempting to flip tier 1 or 2 now must be rejected
    const flipTier1 = {
      ...flipTier3,
      id: `flp_tier1_late_${now}`,
      nonce: 2,
    };
    const resLate1 = await repository.recordTierFlipAtomic({
      flip: flipTier1,
      tier: 1,
      isWhale: false,
      ledgerAmountEth: 0.0003,
    });
    expect(resLate1.success).toBe(false);
    expect(resLate1.error).toMatch(/already been used/i);
  });

  it("whale tier enforces rolling 24h window", async () => {
    const addr = makeTestAddress("whale_24h");
    await repository.getOrCreateWallet(addr);

    const now = Date.now();
    const flipWhale1 = {
      id: `flp_whale_${now}_1`,
      walletAddress: addr,
      clientSeed: "whaleSeed1",
      serverSeed: "whaleSrv1",
      seedHash: "whaleHash1",
      nonce: 1,
      call: "heads" as const,
      result: "heads" as const,
      calledCorrectly: 1,
      tokenBalance: 10_000_000,
      appliedTier: 5,
      tierMultiplier: 5.0,
      callMultiplier: 1.5,
      rewardEth: 0.015,
      noRewardReason: null,
      createdAt: now,
    };

    // First whale flip succeeds
    const res1 = await repository.recordTierFlipAtomic({
      flip: flipWhale1,
      tier: 5,
      isWhale: true,
      ledgerAmountEth: 0.015,
    });
    expect(res1.success).toBe(true);

    // Immediate second whale flip fails (within 24h)
    const flipWhale2 = {
      ...flipWhale1,
      id: `flp_whale_${now}_2`,
      nonce: 2,
    };
    const res2 = await repository.recordTierFlipAtomic({
      flip: flipWhale2,
      tier: 5,
      isWhale: true,
      ledgerAmountEth: 0.015,
    });
    expect(res2.success).toBe(false);
    expect(res2.error).toMatch(/cooldown/i);
  });

  it("concurrency: parallel double submits for same tier -> exactly one succeeds", async () => {
    const addr = makeTestAddress("concurrency_race");
    await repository.getOrCreateWallet(addr);

    const now = Date.now();
    const makeFlip = (nonce: number) => ({
      id: `flp_race_${nonce}_${now}`,
      walletAddress: addr,
      clientSeed: `cseed_${nonce}`,
      serverSeed: `sseed_${nonce}`,
      seedHash: `hash_${nonce}`,
      nonce,
      call: "heads" as const,
      result: "heads" as const,
      calledCorrectly: 1,
      tokenBalance: 500_000,
      appliedTier: 2,
      tierMultiplier: 1.5,
      callMultiplier: 1.5,
      rewardEth: 0.0045,
      noRewardReason: null,
      createdAt: now,
    });

    const [resA, resB] = await Promise.all([
      repository.recordTierFlipAtomic({
        flip: makeFlip(1),
        tier: 2,
        isWhale: false,
        ledgerAmountEth: 0.0045,
      }),
      repository.recordTierFlipAtomic({
        flip: makeFlip(2),
        tier: 2,
        isWhale: false,
        ledgerAmountEth: 0.0045,
      }),
    ]);

    const successes = [resA, resB].filter((r) => r.success);
    const failures = [resA, resB].filter((r) => !r.success);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
  });

  it("validates updated tier thresholds, 10-minute hold time, and 0.002 base reward", () => {
    // 1. Thresholds
    expect(getTierByBalance(99_999).tier).toBe(0);
    expect(getTierByBalance(100_000).tier).toBe(1);
    expect(getTierByBalance(500_000).tier).toBe(2);
    expect(getTierByBalance(2_000_000).tier).toBe(3);
    expect(getTierByBalance(5_000_000).tier).toBe(4);
    expect(getTierByBalance(10_000_000).tier).toBe(5);

    // 2. 10-Minute Hold Time Gate
    expect(REWARD_CONFIG.MIN_HOLD_MINUTES).toBe(10);
    expect(REWARD_CONFIG.HOLD_TIME_MS).toBe(10 * 60 * 1000);

    // 3. Base Reward = 0.002 ETH
    expect(REWARD_CONFIG.BASE_REWARD_ETH).toBe(0.002);

    // Tier 1 (1.0x) + Correct Call (1.5x) => 0.002 * 1.0 * 1.5 = 0.003 ETH
    const tier1Win = calculateFlipReward({ tierMultiplier: 1.0, calledCorrectly: true });
    expect(tier1Win.totalRewardEth).toBe(0.003);

    // Tier 5 (5.0x) + Correct Call (1.5x) => 0.002 * 5.0 * 1.5 = 0.015 ETH
    const tier5Win = calculateFlipReward({ tierMultiplier: 5.0, calledCorrectly: true });
    expect(tier5Win.totalRewardEth).toBe(0.015);
  });

  it("daily wallet cap and budget limits are correctly evaluated", () => {
    const userEarned = 0.1;
    const isCapReached = userEarned >= REWARD_CONFIG.WALLET_DAILY_CAP_ETH;
    expect(isCapReached).toBe(true);

    const protocolEarned = 5.0;
    const isGlobalCapReached = protocolEarned >= REWARD_CONFIG.GLOBAL_DAILY_BUDGET_ETH;
    expect(isGlobalCapReached).toBe(true);
  });
});

