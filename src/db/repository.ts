import { db, sqlite } from "./index";
import { wallets, flips, ledger, payouts, protocolSettings, auditLog } from "./schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";

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

    // If balance has increased or dropped to a different tier, reset or maintain timestamp
    let balanceFirstObservedAt = existing.balanceFirstObservedAt;
    if (newBalance < existing.lastBalance) {
      // Balance dropped: reset observation timer
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

    // Update wallet stats
    const newStreak = flip.calledCorrectly === 1 ? wallet.currentStreak + 1 : 0;
    const bestStreak = Math.max(wallet.bestStreak, newStreak);
    const totalFlips = wallet.totalFlips + 1;
    const totalEarnedEth = Math.round((wallet.totalEarnedEth + ledgerAmountEth) * 1e8) / 1e8;

    // Run in SQLite transaction for append-only idempotency
    const runTx = sqlite.transaction(() => {
      // Insert flip
      db.insert(flips).values(flip).run();

      // Update wallet
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

      // If reward > 0, append to ledger in 'claimable' state
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
    // Midnight UTC today
    const startOfDayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    // 1. Flips today by this wallet
    const flipsTodayRes = db
      .select({ count: sql<number>`count(*)` })
      .from(flips)
      .where(and(eq(flips.walletAddress, addr), gte(flips.createdAt, startOfDayUtc)))
      .get();
    const flipsToday = flipsTodayRes?.count || 0;

    // 2. Rewards earned today by this wallet
    const rewardsTodayRes = db
      .select({ sum: sql<number>`coalesce(sum(amount_eth), 0)` })
      .from(ledger)
      .where(and(eq(ledger.walletAddress, addr), gte(ledger.createdAt, startOfDayUtc)))
      .get();
    const rewardsEarnedTodayEth = Math.round((rewardsTodayRes?.sum || 0) * 1e8) / 1e8;

    // 3. Global rewards earned today across protocol
    const globalRewardsRes = db
      .select({ sum: sql<number>`coalesce(sum(amount_eth), 0)` })
      .from(ledger)
      .where(gte(ledger.createdAt, startOfDayUtc))
      .get();
    const globalRewardsEarnedTodayEth = Math.round((globalRewardsRes?.sum || 0) * 1e8) / 1e8;

    // 4. Ledger states breakdown for this wallet
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

    // 5. Last flip timestamp
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

    // Find claimable entries for this wallet
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
      // Create payout record
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

      // Transition ledger rows to 'accrued' pointing to this payoutId
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
        // Mark all ledger entries for this payout as 'paid'
        db.update(ledger)
          .set({ state: "paid", updatedAt: now })
          .where(eq(ledger.payoutId, payoutId))
          .run();
      } else if (status === "failed") {
        // Rollback ledger entries to 'claimable' so the user can claim again
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

    // Filter by timestamp for 24h or 7d
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
      .where(gte(flips.rewardEth, 0.0003))
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
