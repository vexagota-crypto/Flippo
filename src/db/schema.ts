import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";

export const wallets = sqliteTable("wallets", {
  address: text("address").primaryKey(),
  firstSeenAt: integer("first_seen_at").notNull(),
  lastBalance: real("last_balance").notNull().default(0),
  balanceFirstObservedAt: integer("balance_first_observed_at").notNull(),
  isBanned: integer("is_banned").notNull().default(0),
  totalFlips: integer("total_flips").notNull().default(0),
  totalEarnedEth: real("total_earned_eth").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const flips = sqliteTable("flips", {
  id: text("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().references(() => wallets.address),
  clientSeed: text("client_seed").notNull(),
  serverSeed: text("server_seed").notNull(),
  seedHash: text("seed_hash").notNull(),
  nonce: integer("nonce").notNull(),
  call: text("call").notNull(), // 'heads' | 'tails'
  result: text("result").notNull(), // 'heads' | 'tails'
  calledCorrectly: integer("called_correctly").notNull(),
  tokenBalance: real("token_balance").notNull(),
  appliedTier: integer("applied_tier").notNull(),
  tierMultiplier: real("tier_multiplier").notNull(),
  callMultiplier: real("call_multiplier").notNull(),
  rewardEth: real("reward_eth").notNull(),
  noRewardReason: text("no_reward_reason"), // null or reason
  createdAt: integer("created_at").notNull(),
});

export const tierFlips = sqliteTable(
  "tier_flips",
  {
    id: text("id").primaryKey(),
    walletAddress: text("wallet_address").notNull(),
    tier: integer("tier").notNull(),
    usedAt: integer("used_at").notNull(),
    flipId: text("flip_id").notNull(),
    ledgerId: text("ledger_id"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => ({
    walletTierUniq: uniqueIndex("wallet_tier_idx").on(table.walletAddress, table.tier),
  })
);

export const lastTierFlips = sqliteTable("last_tier_flips", {
  id: text("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  tier: integer("tier").notNull(),
  usedAt: integer("used_at").notNull(),
  flipId: text("flip_id").notNull(),
  ledgerId: text("ledger_id"),
  createdAt: integer("created_at").notNull(),
});

export const practiceFlips = sqliteTable("practice_flips", {
  id: text("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const recycleGuardFlags = sqliteTable("recycle_guard_flags", {
  id: text("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").notNull().default("flagged"), // 'flagged' | 'cleared' | 'banned'
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const ledger = sqliteTable("ledger", {
  id: text("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  flipId: text("flip_id"),
  amountEth: real("amount_eth").notNull(),
  state: text("state").notNull(), // 'accrued' | 'claimable' | 'paid' | 'reversed'
  payoutId: text("payout_id"),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const payouts = sqliteTable("payouts", {
  id: text("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  amountEth: real("amount_eth").notNull(),
  txHash: text("tx_hash"),
  status: text("status").notNull(), // 'pending' | 'submitted' | 'confirmed' | 'failed'
  retryCount: integer("retry_count").notNull().default(0),
  errorMessage: text("error_message"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const protocolSettings = sqliteTable("protocol_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  adminAddress: text("admin_address").notNull(),
  action: text("action").notNull(),
  details: text("details").notNull(),
  createdAt: integer("created_at").notNull(),
});
