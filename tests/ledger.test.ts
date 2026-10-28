import { describe, it, expect, beforeEach } from "vitest";
import { SQLiteRepository } from "../src/db/repository";
import { REWARD_CONFIG } from "../src/config/rewards";
import { sqlite } from "../src/db/index";

describe("Ledger Math & Idempotent Claims", () => {
  const repo = new SQLiteRepository();
  const testWallet = `0xtest_${Date.now()}`;

  beforeEach(async () => {
    // Clear test wallet entries if any
    sqlite.prepare("DELETE FROM ledger WHERE wallet_address = ?").run(testWallet);
    sqlite.prepare("DELETE FROM flips WHERE wallet_address = ?").run(testWallet);
    sqlite.prepare("DELETE FROM payouts WHERE wallet_address = ?").run(testWallet);
    sqlite.prepare("DELETE FROM wallets WHERE address = ?").run(testWallet);
  });

  it("accurately tracks ledger states and prevents double-claims", async () => {
    await repo.getOrCreateWallet(testWallet, 50000);

    // Record 2 flips with rewards
    const flip1 = {
      id: `flp_test_1_${Date.now()}`,
      walletAddress: testWallet,
      clientSeed: "seed_1",
      serverSeed: "serv_1",
      seedHash: "hash_1",
      nonce: 1,
      call: "heads",
      result: "heads",
      calledCorrectly: 1,
      tokenBalance: 50000,
      appliedTier: 3,
      tierMultiplier: 2.0,
      callMultiplier: 1.5,
      rewardEth: 0.0006,
      noRewardReason: null,
      createdAt: Date.now() - 5000,
    };

    const flip2 = {
      id: `flp_test_2_${Date.now()}`,
      walletAddress: testWallet,
      clientSeed: "seed_2",
      serverSeed: "serv_2",
      seedHash: "hash_2",
      nonce: 2,
      call: "tails",
      result: "tails",
      calledCorrectly: 1,
      tokenBalance: 50000,
      appliedTier: 3,
      tierMultiplier: 2.0,
      callMultiplier: 1.5,
      rewardEth: 0.0006,
      noRewardReason: null,
      createdAt: Date.now() - 1000,
    };

    await repo.recordFlip(flip1, 0.0006);
    await repo.recordFlip(flip2, 0.0006);

    // Check summary
    const summary = await repo.getLedgerSummary(testWallet);
    expect(summary.totalClaimableEth).toBe(0.0012);
    expect(summary.totalPaidEth).toBe(0);

    // Attempt claim below threshold (min 0.002) -> should return null
    const smallClaim = await repo.createPayoutClaim(testWallet, 0.002);
    expect(smallClaim).toBeNull();

    // Claim with valid threshold (min 0.001)
    const validClaim = await repo.createPayoutClaim(testWallet, 0.001);
    expect(validClaim).not.toBeNull();
    expect(validClaim?.amountEth).toBe(0.0012);

    // Immediately check summary: claimable should now be 0, accrued 0.0012
    const summaryAfterClaim = await repo.getLedgerSummary(testWallet);
    expect(summaryAfterClaim.totalClaimableEth).toBe(0);
    expect(summaryAfterClaim.totalAccruedEth).toBe(0.0012);

    // Re-attempting claim immediately must yield null (idempotency check)
    const doubleClaim = await repo.createPayoutClaim(testWallet, 0.001);
    expect(doubleClaim).toBeNull();

    // Confirm payout
    await repo.updatePayoutStatus(validClaim!.payoutId, "confirmed", "0xtxhash_mock_123");
    const summaryConfirmed = await repo.getLedgerSummary(testWallet);
    expect(summaryConfirmed.totalClaimableEth).toBe(0);
    expect(summaryConfirmed.totalAccruedEth).toBe(0);
    expect(summaryConfirmed.totalPaidEth).toBe(0.0012);
  });

  it("rolls back ledger rows to claimable if payout fails", async () => {
    await repo.getOrCreateWallet(testWallet, 10000);

    const flip = {
      id: `flp_fail_${Date.now()}`,
      walletAddress: testWallet,
      clientSeed: "seed_f",
      serverSeed: "serv_f",
      seedHash: "hash_f",
      nonce: 1,
      call: "heads",
      result: "heads",
      calledCorrectly: 1,
      tokenBalance: 10000,
      appliedTier: 2,
      tierMultiplier: 1.5,
      callMultiplier: 1.5,
      rewardEth: 0.0015,
      noRewardReason: null,
      createdAt: Date.now(),
    };

    await repo.recordFlip(flip, 0.0015);

    const claim = await repo.createPayoutClaim(testWallet, 0.001);
    expect(claim).not.toBeNull();

    // Simulate payout failure
    await repo.updatePayoutStatus(claim!.payoutId, "failed", undefined, "Simulated RPC timeout");

    const summaryAfterFailure = await repo.getLedgerSummary(testWallet);
    // Rolled back to claimable!
    expect(summaryAfterFailure.totalClaimableEth).toBe(0.0015);
    expect(summaryAfterFailure.totalAccruedEth).toBe(0);
    expect(summaryAfterFailure.totalPaidEth).toBe(0);
  });
});
