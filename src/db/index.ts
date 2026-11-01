import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbPath =
  process.env.DATABASE_URL ||
  (process.env.VERCEL ? path.join("/tmp", "flippo.db") : path.join(process.cwd(), "flippo.db"));

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("busy_timeout = 5000");

// Initialize tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS wallets (
    address TEXT PRIMARY KEY,
    first_seen_at INTEGER NOT NULL,
    last_balance REAL NOT NULL DEFAULT 0,
    balance_first_observed_at INTEGER NOT NULL,
    is_banned INTEGER NOT NULL DEFAULT 0,
    total_flips INTEGER NOT NULL DEFAULT 0,
    total_earned_eth REAL NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS flips (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    client_seed TEXT NOT NULL,
    server_seed TEXT NOT NULL,
    seed_hash TEXT NOT NULL,
    nonce INTEGER NOT NULL,
    call TEXT NOT NULL,
    result TEXT NOT NULL,
    called_correctly INTEGER NOT NULL,
    token_balance REAL NOT NULL,
    applied_tier INTEGER NOT NULL,
    tier_multiplier REAL NOT NULL,
    call_multiplier REAL NOT NULL,
    reward_eth REAL NOT NULL,
    no_reward_reason TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tier_flips (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    tier INTEGER NOT NULL,
    used_at INTEGER NOT NULL,
    flip_id TEXT NOT NULL,
    ledger_id TEXT,
    created_at INTEGER NOT NULL,
    UNIQUE(wallet_address, tier)
  );

  CREATE TABLE IF NOT EXISTS last_tier_flips (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    tier INTEGER NOT NULL,
    used_at INTEGER NOT NULL,
    flip_id TEXT NOT NULL,
    ledger_id TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS recycle_guard_flags (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'flagged',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ledger (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    flip_id TEXT,
    amount_eth REAL NOT NULL,
    state TEXT NOT NULL,
    payout_id TEXT,
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payouts (
    id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    amount_eth REAL NOT NULL,
    tx_hash TEXT,
    status TEXT NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS protocol_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    admin_address TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

export const db = drizzle(sqlite, { schema });
export { sqlite };
