import { describe, it, expect } from "vitest";
import {
  REWARD_CONFIG,
  getTierByBalance,
  calculateFlipReward,
} from "../src/config/rewards";
import {
  generateServerSeedCommitment,
  determineFlipOutcome,
  verifyFlipFairness,
} from "../src/lib/fairness";

describe("Reward & Multiplier Engine", () => {
  it("determines correct tiers by $FLIPPO balance", () => {
    // Below 100,000 -> Tier 0
    expect(getTierByBalance(0).tier).toBe(0);
    expect(getTierByBalance(99_999).tier).toBe(0);
    expect(getTierByBalance(99_999).multiplier).toBe(0);

    // Tier 1: 100,000 -> 1x
    expect(getTierByBalance(100_000).tier).toBe(1);
    expect(getTierByBalance(100_000).multiplier).toBe(1.0);
    expect(getTierByBalance(250_000).multiplier).toBe(1.0);

    // Tier 2: 500,000 -> 1.5x
    expect(getTierByBalance(500_000).tier).toBe(2);
    expect(getTierByBalance(500_000).multiplier).toBe(1.5);

    // Tier 3: 2,000,000 -> 2x
    expect(getTierByBalance(2_000_000).tier).toBe(3);
    expect(getTierByBalance(2_000_000).multiplier).toBe(2.0);

    // Tier 4: 5,000,000 -> 3x
    expect(getTierByBalance(5_000_000).tier).toBe(4);
    expect(getTierByBalance(5_000_000).multiplier).toBe(3.0);

    // Tier 5: 10,000,000+ -> 5x (Hard Cap)
    expect(getTierByBalance(10_000_000).tier).toBe(5);
    expect(getTierByBalance(10_000_000).multiplier).toBe(5.0);
    expect(getTierByBalance(20_000_000).multiplier).toBe(5.0);
  });

  it("calculates correct flip rewards for correct calls and incorrect calls", () => {
    // Tier 1 (1x multiplier), wrong call (1x bonus)
    const res1 = calculateFlipReward({
      tierMultiplier: 1.0,
      calledCorrectly: false,
    });
    expect(res1.totalRewardEth).toBe(REWARD_CONFIG.BASE_REWARD_ETH);

    // Tier 1 (1x multiplier), correct call (1.5x bonus)
    const res2 = calculateFlipReward({
      tierMultiplier: 1.0,
      calledCorrectly: true,
    });
    expect(res2.totalRewardEth).toBe(
      Math.round(REWARD_CONFIG.BASE_REWARD_ETH * 1.5 * 1e8) / 1e8
    );

    // Tier 3 (2.0x multiplier), correct call (1.5x bonus)
    const res3 = calculateFlipReward({
      tierMultiplier: 2.0,
      calledCorrectly: true,
    });
    expect(res3.totalRewardEth).toBe(
      Math.round(REWARD_CONFIG.BASE_REWARD_ETH * 2.0 * 1.5 * 1e8) / 1e8
    );

    // Tier 0 (0x multiplier) -> 0 reward
    const res0 = calculateFlipReward({
      tierMultiplier: 0,
      calledCorrectly: true,
    });
    expect(res0.totalRewardEth).toBe(0);
  });
});

describe("Provable Fairness Verification", () => {
  it("generates a verifiable server seed commitment", () => {
    const { serverSeed, seedHash } = generateServerSeedCommitment();
    expect(serverSeed).toBeDefined();
    expect(seedHash).toBeDefined();
    expect(serverSeed.length).toBe(64);
    expect(seedHash.length).toBe(64);

    const clientSeed = "test_client_seed_123";
    const nonce = 1;
    const outcome = determineFlipOutcome(serverSeed, clientSeed, nonce);
    expect(["heads", "tails"]).toContain(outcome);

    const verification = verifyFlipFairness({
      serverSeed,
      seedHash,
      clientSeed,
      nonce,
      reportedResult: outcome,
    });

    expect(verification.isValid).toBe(true);
    expect(verification.computedResult).toBe(outcome);
  });

  it("fails verification if server seed or reported result is tampered", () => {
    const { serverSeed, seedHash } = generateServerSeedCommitment();
    const clientSeed = "user_seed_456";
    const nonce = 5;
    const outcome = determineFlipOutcome(serverSeed, clientSeed, nonce);

    // Invert reported result
    const fakeOutcome = outcome === "heads" ? "tails" : "heads";
    const badVerification = verifyFlipFairness({
      serverSeed,
      seedHash,
      clientSeed,
      nonce,
      reportedResult: fakeOutcome,
    });

    expect(badVerification.isValid).toBe(false);

    // Tamper with server seed
    const tamperedSeed = serverSeed.replace("a", "b");
    const badSeedVerification = verifyFlipFairness({
      serverSeed: tamperedSeed,
      seedHash,
      clientSeed,
      nonce,
      reportedResult: outcome,
    });

    expect(badSeedVerification.isValid).toBe(false);
  });
});
