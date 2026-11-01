import { db, sqlite } from "./index";
import { wallets, flips, ledger, payouts, protocolSettings, auditLog, tierFlips, lastTierFlips, recycleGuardFlags } from "./schema";
import { eq, desc, and, gte, gt, sql } from "drizzle-orm";
import { REWARD_CONFIG } from "@/config/rewards";

export interface WalletRecord {
  address: string;
  firstSeenAt: number;
  lastBalance: number;
  balanceFirstObservedAt: number;
  isBanned: number;
  totalFlips: number;
  totalEarnedEth: number;
  currentStreak: number;
  bestStreak: number;
  createdAt: number;
  updatedAt: number;
}

export interface FlipRecord {
  id: string;
  walletAddress: string;
  clientSeed: string;
  serverSeed: string;
  seedHash: string;
  nonce: number;
  call: string;
  result: string;
  calledCorrectly: number;
  tokenBalance: number;
  appliedTier: number;
  tierMultiplier: number;
  callMultiplier: number;
  rewardEth: number;
  noRewardReason: string | null;
  createdAt: number;
}

export interface LedgerSummary {
  flipsToday: number;
  rewardsEarnedTodayEth: number;
  globalRewardsEarnedTodayEth: number;
  totalAccruedEth: number;
  totalClaimableEth: number;
  totalPaidEth: number;
  lastFlipTimestamp: number | null;
}

export interface IRepository {
  getWallet(address: string): Promise<WalletRecord | null>;
  getOrCreateWallet(address: string, initialBalance?: number): Promise<WalletRecord>;
  updateWalletBalance(address: string, newBalance: number): Promise<WalletRecord>;
  recordFlip(flip: FlipRecord, ledgerAmountEth: number): Promise<void>;
  getWalletFlips(address: string, limit?: number, offset?: number): Promise<FlipRecord[]>;
  getLedgerSummary(address: string): Promise<LedgerSummary>;
  createPayoutClaim(address: string, minClaimEth: number): Promise<{ payoutId: string; amountEth: number } | null>;
  updatePayoutStatus(payoutId: string, status: "pending" | "submitted" | "confirmed" | "failed", txHash?: string, errorMessage?: string): Promise<void>;
  getLeaderboard(by: "rewards" | "streak", timeFrame: "24h" | "7d" | "all", limit?: number): Promise<any[]>;
  getProtocolStats(): Promise<{
    totalFlips: number;
    totalEthPaid: number;
    activePlayersToday: number;
    lastBigWin: { wallet: string; amount: number; time: number } | null;
  }>;
  getRecentFlips(limit?: number): Promise<FlipRecord[]>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  recordAuditLog(adminAddress: string, action: string, details: string): Promise<void>;
  isRewardsPaused(): Promise<boolean>;

  // Tier Gated Flip methods
  getTierFlips(address: string): Promise<Array<{ tier: number; usedAt: number; flipId: string }>>;
  getLastTierFlips(address: string, limit?: number): Promise<Array<{ tier: number; usedAt: number; flipId: string }>>;
  recordTierFlipAtomic(params: {
    flip: FlipRecord;
    tier: number;
    isWhale: boolean;
    ledgerAmountEth: number;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; error?: string }>;
  getRecycleFlags(): Promise<any[]>;
  flagRecycleWallet(address: string, reason: string, details?: string): Promise<void>;
  resolveRecycleFlag(id: string, action: "ban" | "clear"): Promise<void>;
  backfillTierFlipsFromHistory(): Promise<{ backfilled: number }>;
}

export class SQLiteRepository implements IRepository {
  async getWallet(address: string): Promise<WalletRecord | null> {
    const addr = address.toLowerCase();
    const rows = await db.select().from(wallets).where(eq(wallets.address, addr)).limit(1);
    return rows[0] || null;
  }

  async getOrCreateWallet(address: string, initialBalance = 0): Promise<WalletRecord> {
    const addr = address.toLowerCase();
    const existing = await this.getWallet(addr);
    const now = Date.now();

    if (existing) {
      return existing;
    }

    const newRecord: WalletRecord = {
      address: addr,
      firstSeenAt: now,
      lastBalance: initialBalance,
      balanceFirstObservedAt: now,
      isBanned: 0,
      totalFlips: 0,
      totalEarnedEth: 0,
      currentStreak: 0,
      bestStreak: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(wallets).values(newRecord);
    return newRecord;
  }

  async updateWalletBalance(address: string, newBalance: number): Promise<WalletRecord> {
    const addr = address.toLowerCase();
    const existing = await this.getOrCreateWallet(addr, newBalance);
    const now = Date.now();

    let balanceFirstObservedAt = existing.balanceFirstObservedAt;
    if (newBalance < existing.lastBalance) {
      // Balance dropped below previously observed: reset observation timestamp
      balanceFirstObservedAt = now;
    } else if (newBalance > existing.lastBalance && existing.lastBalance === 0) {
      // First time acquiring tokens
      balanceFirstObservedAt = now;
    }

    await db
      .update(wallets)
      .set({
        lastBalance: newBalance,
        balanceFirstObservedAt,
        updatedAt: now,
      })
      .where(eq(wallets.address, addr));

    return (await this.getWallet(addr))!;
  }

  async recordFlip(flip: FlipRecord, ledgerAmountEth: number): Promise<void> {
    const addr = flip.walletAddress.toLowerCase();
    const now = Date.now();
    const wallet = await this.getOrCreateWallet(addr);

    const newStreak = flip.calledCorrectly === 1 ? wallet.currentStreak + 1 : 0;
    const bestStreak = Math.max(wallet.bestStreak, newStreak);
    const totalFlips = wallet.totalFlips + 1;
    const totalEarnedEth = Math.round((wallet.totalEarnedEth + ledgerAmountEth) * 1e8) / 1e8;

    const runTx = sqlite.transaction(() => {
      db.insert(flips).values(flip).run();

      db.update(wallets)
        .set({
          totalFlips,
          totalEarnedEth,
          currentStreak: newStreak,
          bestStreak,
          updatedAt: now,
        })
        .where(eq(wallets.address, addr))
        .run();

      if (ledgerAmountEth > 0) {
        db.insert(ledger)
          .values({
            id: `led_${flip.id}`,
            walletAddress: addr,
            flipId: flip.id,
            amountEth: ledgerAmountEth,
            state: "claimable",
            idempotencyKey: `flip_reward_${flip.id}`,
            createdAt: now,
            updatedAt: now,
          })
          .run();
      }
    });

    runTx();
  }

  async getTierFlips(address: string): Promise<Array<{ tier: number; usedAt: number; flipId: string }>> {
    const addr = address.toLowerCase();
    return db
      .select({
        tier: tierFlips.tier,
        usedAt: tierFlips.usedAt,
        flipId: tierFlips.flipId,
      })
      .from(tierFlips)
      .where(eq(tierFlips.walletAddress, addr))
      .all();
  }

  async getLastTierFlips(address: string, limit = 5): Promise<Array<{ tier: number; usedAt: number; flipId: string }>> {
    const addr = address.toLowerCase();
    return db
      .select({
        tier: lastTierFlips.tier,
        usedAt: lastTierFlips.usedAt,
        flipId: lastTierFlips.flipId,
      })
      .from(lastTierFlips)
      .where(eq(lastTierFlips.walletAddress, addr))
      .orderBy(desc(lastTierFlips.usedAt))
      .limit(limit)
      .all();
  }

  async recordTierFlipAtomic(params: {
    flip: FlipRecord;
    tier: number;
    isWhale: boolean;
    ledgerAmountEth: number;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { flip, tier, isWhale, ledgerAmountEth, idempotencyKey } = params;
    const addr = flip.walletAddress.toLowerCase();
    const now = Date.now();

    try {
      const runTx = sqlite.transaction(() => {
        const wallet = db.select().from(wallets).where(eq(wallets.address, addr)).get();
        if (!wallet) {
          throw new Error("Wallet record not found");
        }

        if (isWhale) {
          // Check last whale flip timestamp
          const recentWhaleFlip = db
            .select()
            .from(lastTierFlips)
            .where(eq(lastTierFlips.walletAddress, addr))
            .orderBy(desc(lastTierFlips.usedAt))
            .limit(1)
            .get();

          if (recentWhaleFlip) {
            const cooldownMs = REWARD_CONFIG.LAST_TIER_COOLDOWN_HOURS * 3600 * 1000;
            if (now - recentWhaleFlip.usedAt < cooldownMs) {
              throw new Error("Whale flip is still in 24h cooldown");
            }
          }

          // Record whale flip
          db.insert(lastTierFlips)
            .values({
              id: `wflp_${flip.id}`,
              walletAddress: addr,
              tier,
              usedAt: now,
              flipId: flip.id,
              ledgerId: ledgerAmountEth > 0 ? `led_${flip.id}` : null,
              createdAt: now,
            })
            .run();
        } else {
          // Check if this tier has already been used
          const existingTierFlip = db
            .select()
            .from(tierFlips)
            .where(and(eq(tierFlips.walletAddress, addr), eq(tierFlips.tier, tier)))
            .get();

          if (existingTierFlip) {
            throw new Error(`Reward flip for Tier ${tier} has already been used`);
          }

          // Record tier flip
          db.insert(tierFlips)
            .values({
              id: `tflp_${flip.id}`,
              walletAddress: addr,
              tier,
              usedAt: now,
              flipId: flip.id,
              ledgerId: ledgerAmountEth > 0 ? `led_${flip.id}` : null,
              createdAt: now,
            })
            .run();

          // If SKIPPED_TIER_POLICY is 'forfeit', mark any lower tiers (1 to tier-1) as forfeited so they cannot be reused
          if (REWARD_CONFIG.SKIPPED_TIER_POLICY === "forfeit") {
            for (let lower = 1; lower < tier; lower++) {
              const lowerExists = db
                .select()
                .from(tierFlips)
                .where(and(eq(tierFlips.walletAddress, addr), eq(tierFlips.tier, lower)))
                .get();

              if (!lowerExists) {
                db.insert(tierFlips)
                  .values({
                    id: `forfeit_${addr}_t${lower}_${now}`,
                    walletAddress: addr,
                    tier: lower,
                    usedAt: now,
                    flipId: `forfeited_by_${flip.id}`,
                    ledgerId: null,
                    createdAt: now,
                  })
                  .run();
              }
            }
          }
        }

        // Insert the flip record
        db.insert(flips).values(flip).run();

        // Update streaks and stats
        const newStreak = flip.calledCorrectly === 1 ? wallet.currentStreak + 1 : 0;
        const bestStreak = Math.max(wallet.bestStreak, newStreak);
        const totalFlips = wallet.totalFlips + 1;
        const totalEarnedEth = Math.round((wallet.totalEarnedEth + ledgerAmountEth) * 1e8) / 1e8;

        db.update(wallets)
          .set({
            totalFlips,
            totalEarnedEth,
            currentStreak: newStreak,
            bestStreak,
            updatedAt: now,
          })
          .where(eq(wallets.address, addr))
          .run();

        // Insert ledger entry if reward > 0
        if (ledgerAmountEth > 0) {
          db.insert(ledger)
            .values({
              id: `led_${flip.id}`,
              walletAddress: addr,
              flipId: flip.id,
              amountEth: ledgerAmountEth,
              state: "claimable",
              idempotencyKey: idempotencyKey || `tier_flip_${flip.id}`,
              createdAt: now,
              updatedAt: now,
            })
            .run();
        }
      });

      runTx();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to record tier flip" };
    }
  }

  async getRecycleFlags(): Promise<any[]> {
    return db.select().from(recycleGuardFlags).orderBy(desc(recycleGuardFlags.createdAt)).all();
  }

  async flagRecycleWallet(address: string, reason: string, details?: string): Promise<void> {
    const now = Date.now();
    db.insert(recycleGuardFlags)
      .values({
        id: `rcy_${now}_${Math.random().toString(36).slice(2, 6)}`,
        walletAddress: address.toLowerCase(),
        reason,
        details: details || null,
        status: "flagged",
        createdAt: now,
        updatedAt: now,
      })
      .run();
  }

  async resolveRecycleFlag(id: string, action: "ban" | "clear"): Promise<void> {
    const now = Date.now();
    const flag = db.select().from(recycleGuardFlags).where(eq(recycleGuardFlags.id, id)).get();
    if (!flag) return;

    sqlite.transaction(() => {
      db.update(recycleGuardFlags)
        .set({ status: action === "ban" ? "banned" : "cleared", updatedAt: now })
        .where(eq(recycleGuardFlags.id, id))
        .run();

      if (action === "ban") {
        db.update(wallets)
          .set({ isBanned: 1, updatedAt: now })
          .where(eq(wallets.address, flag.walletAddress))
          .run();
      }
    })();
  }

  async backfillTierFlipsFromHistory(): Promise<{ backfilled: number }> {
    let count = 0;
    const historyFlips = db
      .select()
      .from(flips)
      .where(and(gt(flips.appliedTier, 0), gt(flips.rewardEth, 0)))
      .orderBy(flips.createdAt)
      .all();

    sqlite.transaction(() => {
      for (const flip of historyFlips) {
        const addr = flip.walletAddress.toLowerCase();
        if (flip.appliedTier === REWARD_CONFIG.WHALE_TIER_INDEX) {
          db.insert(lastTierFlips)
            .values({
              id: `mig_w_${flip.id}`,
              walletAddress: addr,
              tier: flip.appliedTier,
              usedAt: flip.createdAt,
              flipId: flip.id,
              ledgerId: `led_${flip.id}`,
              createdAt: flip.createdAt,
            })
            .run();
          count++;
        } else {
          const exists = db
            .select()
            .from(tierFlips)
            .where(and(eq(tierFlips.walletAddress, addr), eq(tierFlips.tier, flip.appliedTier)))
            .get();

          if (!exists) {
            db.insert(tierFlips)
              .values({
                id: `mig_t_${flip.id}`,
                walletAddress: addr,
                tier: flip.appliedTier,
                usedAt: flip.createdAt,
                flipId: flip.id,
                ledgerId: `led_${flip.id}`,
                createdAt: flip.createdAt,
              })
              .run();
            count++;
          }
        }
      }
    })();

    return { backfilled: count };
  }

  async getWalletFlips(address: string, limit = 20, offset = 0): Promise<FlipRecord[]> {
    const addr = address.toLowerCase();
    return db
      .select()
      .from(flips)
      .where(eq(flips.walletAddress, addr))
      .orderBy(desc(flips.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getLedgerSummary(address: string): Promise<LedgerSummary> {
    const addr = address.toLowerCase();
    const now = new Date();
    const startOfDayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    const flipsTodayRes = db
      .select({ count: sql<number>`count(*)` })
      .from(flips)
      .where(and(eq(flips.walletAddress, addr), gte(flips.createdAt, startOfDayUtc)))
      .get();
    const flipsToday = flipsTodayRes?.count || 0;

    const rewardsTodayRes = db
      .select({ sum: sql<number>`coalesce(sum(amount_eth), 0)` })
      .from(ledger)
      .where(and(eq(ledger.walletAddress, addr), gte(ledger.createdAt, startOfDayUtc)))
      .get();
    const rewardsEarnedTodayEth = Math.round((rewardsTodayRes?.sum || 0) * 1e8) / 1e8;

    const globalRewardsRes = db
      .select({ sum: sql<number>`coalesce(sum(amount_eth), 0)` })
      .from(ledger)
      .where(gte(ledger.createdAt, startOfDayUtc))
      .get();
    const globalRewardsEarnedTodayEth = Math.round((globalRewardsRes?.sum || 0) * 1e8) / 1e8;

    const claimableRes = db
      .select({ sum: sql<number>`coalesce(sum(amount_eth), 0)` })
      .from(ledger)
      .where(and(eq(ledger.walletAddress, addr), eq(ledger.state, "claimable")))
      .get();
    const totalClaimableEth = Math.round((claimableRes?.sum || 0) * 1e8) / 1e8;

    const paidRes = db
      .select({ sum: sql<number>`coalesce(sum(amount_eth), 0)` })
      .from(ledger)
      .where(and(eq(ledger.walletAddress, addr), eq(ledger.state, "paid")))
      .get();
    const totalPaidEth = Math.round((paidRes?.sum || 0) * 1e8) / 1e8;

    const accruedRes = db
      .select({ sum: sql<number>`coalesce(sum(amount_eth), 0)` })
      .from(ledger)
      .where(and(eq(ledger.walletAddress, addr), eq(ledger.state, "accrued")))
      .get();
    const totalAccruedEth = Math.round((accruedRes?.sum || 0) * 1e8) / 1e8;

    const lastFlipRes = db
      .select({ createdAt: flips.createdAt })
      .from(flips)
      .where(eq(flips.walletAddress, addr))
      .orderBy(desc(flips.createdAt))
      .limit(1)
      .get();
    const lastFlipTimestamp = lastFlipRes?.createdAt || null;

    return {
      flipsToday,
      rewardsEarnedTodayEth,
      globalRewardsEarnedTodayEth,
      totalAccruedEth,
      totalClaimableEth,
      totalPaidEth,
      lastFlipTimestamp,
    };
  }

  async createPayoutClaim(address: string, minClaimEth: number): Promise<{ payoutId: string; amountEth: number } | null> {
    const addr = address.toLowerCase();
    const now = Date.now();

    const claimableEntries = db
      .select()
      .from(ledger)
      .where(and(eq(ledger.walletAddress, addr), eq(ledger.state, "claimable")))
      .all();

    const totalClaimable = claimableEntries.reduce((sum, item) => sum + item.amountEth, 0);
    const amountEth = Math.round(totalClaimable * 1e8) / 1e8;

    if (amountEth < minClaimEth || claimableEntries.length === 0) {
      return null;
    }

    const payoutId = `pay_${now}_${Math.random().toString(36).slice(2, 8)}`;

    const runClaimTx = sqlite.transaction(() => {
      db.insert(payouts)
        .values({
          id: payoutId,
          walletAddress: addr,
          amountEth,
          status: "pending",
          retryCount: 0,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      for (const entry of claimableEntries) {
        db.update(ledger)
          .set({
            state: "accrued",
            payoutId,
            updatedAt: now,
          })
          .where(eq(ledger.id, entry.id))
          .run();
      }
    });

    runClaimTx();

    return { payoutId, amountEth };
  }

  async updatePayoutStatus(
    payoutId: string,
    status: "pending" | "submitted" | "confirmed" | "failed",
    txHash?: string,
    errorMessage?: string
  ): Promise<void> {
    const now = Date.now();

    const runStatusTx = sqlite.transaction(() => {
      db.update(payouts)
        .set({
          status,
          txHash: txHash || null,
          errorMessage: errorMessage || null,
          updatedAt: now,
        })
        .where(eq(payouts.id, payoutId))
        .run();

      if (status === "confirmed") {
        db.update(ledger)
          .set({ state: "paid", updatedAt: now })
          .where(eq(ledger.payoutId, payoutId))
          .run();
      } else if (status === "failed") {
        db.update(ledger)
          .set({ state: "claimable", payoutId: null, updatedAt: now })
          .where(eq(ledger.payoutId, payoutId))
          .run();
      }
    });

    runStatusTx();
  }

  async getLeaderboard(by: "rewards" | "streak", timeFrame: "24h" | "7d" | "all", limit = 10): Promise<any[]> {
    if (by === "streak") {
      return db
        .select({
          address: wallets.address,
          score: wallets.bestStreak,
          totalFlips: wallets.totalFlips,
          totalEarnedEth: wallets.totalEarnedEth,
        })
        .from(wallets)
        .where(eq(wallets.isBanned, 0))
        .orderBy(desc(wallets.bestStreak), desc(wallets.totalFlips))
        .limit(limit);
    }

    if (timeFrame === "all") {
      return db
        .select({
          address: wallets.address,
          score: wallets.totalEarnedEth,
          totalFlips: wallets.totalFlips,
          bestStreak: wallets.bestStreak,
        })
        .from(wallets)
        .where(eq(wallets.isBanned, 0))
        .orderBy(desc(wallets.totalEarnedEth), desc(wallets.totalFlips))
        .limit(limit);
    }

    const now = Date.now();
    const periodMs = timeFrame === "24h" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    const since = now - periodMs;

    return db
      .select({
        address: ledger.walletAddress,
        score: sql<number>`coalesce(sum(amount_eth), 0)`,
        totalFlips: sql<number>`count(distinct flip_id)`,
      })
      .from(ledger)
      .where(gte(ledger.createdAt, since))
      .groupBy(ledger.walletAddress)
      .orderBy(desc(sql`score`))
      .limit(limit);
  }

  async getProtocolStats() {
    const totalFlipsRes = db.select({ count: sql<number>`count(*)` }).from(flips).get();
    const totalPaidRes = db
      .select({ sum: sql<number>`coalesce(sum(amount_eth), 0)` })
      .from(ledger)
      .where(eq(ledger.state, "paid"))
      .get();

    const now = new Date();
    const startOfDayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    const activePlayersRes = db
      .select({ count: sql<number>`count(distinct wallet_address)` })
      .from(flips)
      .where(gte(flips.createdAt, startOfDayUtc))
      .get();

    const lastBigWinRes = db
      .select({
        wallet: flips.walletAddress,
        amount: flips.rewardEth,
        time: flips.createdAt,
      })
      .from(flips)
      .where(gte(flips.rewardEth, 0.003))
      .orderBy(desc(flips.createdAt))
      .limit(1)
      .get();

    return {
      totalFlips: totalFlipsRes?.count || 0,
      totalEthPaid: Math.round((totalPaidRes?.sum || 0) * 1e8) / 1e8,
      activePlayersToday: activePlayersRes?.count || 0,
      lastBigWin: lastBigWinRes ? {
        wallet: lastBigWinRes.wallet,
        amount: lastBigWinRes.amount,
        time: lastBigWinRes.time,
      } : null,
    };
  }

  async getRecentFlips(limit = 10): Promise<FlipRecord[]> {
    return db
      .select()
      .from(flips)
      .orderBy(desc(flips.createdAt))
      .limit(limit);
  }

  async getSetting(key: string): Promise<string | null> {
    const res = db.select().from(protocolSettings).where(eq(protocolSettings.key, key)).get();
    return res?.value || null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const now = Date.now();
    db.insert(protocolSettings)
      .values({ key, value, updatedAt: now })
      .onConflictDoUpdate({
        target: protocolSettings.key,
        set: { value, updatedAt: now },
      })
      .run();
  }

  async recordAuditLog(adminAddress: string, action: string, details: string): Promise<void> {
    db.insert(auditLog)
      .values({
        id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        adminAddress: adminAddress.toLowerCase(),
        action,
        details,
        createdAt: Date.now(),
      })
      .run();
  }

  async isRewardsPaused(): Promise<boolean> {
    const val = await this.getSetting("rewards_paused");
    return val === "true" || val === "1";
  }
}

export const repository: IRepository = new SQLiteRepository();
