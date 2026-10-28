# 🪙 FLIPPO ($FLIPPO)

**FLIPPO** is a playful, premium, mobile-first Web3 coin-flip arcade built for the **Robinhood Chain**. Connect your wallet, call Heads or Tails, flip the 3D coin, and earn real ETH rewards directly to your wallet. Your verified $FLIPPO token holdings determine your dynamic multiplier tier.

Designed with a high-energy **Candy Arcade × Tactical Fintech** aesthetic: chunky 3px ink borders, solid offset drop shadows (`0 5px 0 #0B0B14`), tactile physics, dynamic CSS 3D coin flip transforms, and strict provable fairness.

---

## 🚀 Key Features

- **🎮 Physical 3D Coin Flip Engine**: Built entirely with hardware-accelerated CSS 3D transforms (`preserve-3d`, `perspective: 1200px`), real 100px vertical hop trajectory, dynamic contact shadow, ground impact squash-and-stretch, and smooth decelerating easing. Both custom Heads (Glossy inflatable "F") and Tails (Inflatable "TAILS") faces.
- **⚡ Dynamic Holding Multiplier Ladder**: 6 tiers scaling from **0x** (below 1,000 $FLIPPO) up to a hard-capped **5.0x** (1,000,000+ $FLIPPO), plus an extra **1.5x bonus** for calling the flip correctly.
- **🔒 Provably Fair Architecture**: Every flip uses cryptographic commitments (HMAC-SHA256). The server publishes a SHA256 commitment of its seed *before* the flip. The outcome is computed deterministically from `HMAC-SHA256(serverSeed, clientSeed + ":" + nonce)`. Any user can independently verify every flip via the interactive modal at `/history`.
- **🏦 Automated Treasury Payouts**: Integrated with Privy Server Wallets (`fco8bilv7ilbclyb33z9w20d`, resolving to on-chain address `0xAaf9c56d92a8453Bab14d9a66e6735250B03F0b6`). When users claim, ETH is transferred on-chain directly from the protocol treasury.
- **🛡️ Idempotent Double-Entry Ledger**: Full SQLite database with WAL mode and foreign key constraints. Tracks state transitions: `accrued` ➔ `claimable` ➔ `paid`. Double-claims are mathematically impossible, and failed on-chain transactions automatically roll back ledger rows to claimable status.
- **🛡️ Anti-Exploit & Budget Guardrails**:
  - **30-second cooldown** between flips to prevent rapid automated spamming.
  - **24-hour minimum hold-time rule** prevents flash-loans and rapid buying/selling from qualifying for multiplier tiers.
  - **10 flips/wallet/day** maximum rate limit.
  - **0.01 ETH/wallet/day** wallet payout ceiling.
  - **0.5 ETH/day** global protocol payout budget.
  - **0.001 ETH minimum claim threshold** to prevent dust spam.
- **📱 Mobile-First Experience**: Designed for iPhone 13 (390px) up to ultra-wide displays (1440px+). Minimum 44px touch targets (58px for FLIP button) with 0 accessibility/contrast violations.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router, Turbopack) | Server actions, API routes, fast SSR & static generation |
| **Styling** | Tailwind CSS v4 + Vanilla CSS Variables | Candy arcade color tokens, 3px ink borders, tactile button physics |
| **Web3 Auth** | `@privy-io/react-auth` | Social login, embedded wallets, and external web3 wallets |
| **Treasury Payouts** | `@privy-io/server-auth` | Server wallet management & secure on-chain transaction signing |
| **EVM Client** | `viem` | Robinhood Chain RPC communication, contract calls, balance verification |
| **Database** | SQLite (`better-sqlite3`) + `drizzle-orm` | High-throughput, local double-entry accounting in WAL mode |
| **Testing & QA** | Vitest + Playwright (Edge/Chromium) + Axe | Unit testing, visual QA, and WCAG accessibility contrast checks |

---

## 📦 Getting Started

### 1. Prerequisites
- **Node.js**: v18.18+ or v20+
- **pnpm**: `npm install -g pnpm`

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <repo-url> flippo
cd flippo
pnpm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local` and configure your credentials:
```bash
cp .env.example .env.local
```

#### Required Variables:
```ini
# Privy Authentication
NEXT_PUBLIC_PRIVY_APP_ID="cmvs9fiib00ca0hjjtv07lt4w"
PRIVY_APP_SECRET="privy_app_secret_..."
PRIVY_SERVER_WALLET_ID="fco8bilv7ilbclyb33z9w20d"

# Robinhood Chain Configuration
NEXT_PUBLIC_RH_CHAIN_ID="4663"
RH_RPC_URL="https://rpc.mainnet.chain.robinhood.com"
NEXT_PUBLIC_RH_EXPLORER_URL="https://robinhoodchain.blockscout.com/"

# Token & WalletConnect
NEXT_PUBLIC_FLIPPO_TOKEN_ADDRESS="COMING_SOON" # Replace with contract address when deployed
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="37375078e2476ce0c496e479ead499a4"

# Network & Admin
NEXT_PUBLIC_NETWORK_MODE="testnet" # "testnet" | "mainnet"
CRON_SECRET="flippo_cron_sec_f893d2c10a4e76b5"
```

### 4. Running the Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🪙 Multiplier Tier Structure

The base reward for a standard flip is **0.0002 ETH**. Your holdings determine your tier multiplier:

| Tier | $FLIPPO Balance Required | Multiplier | Base + Correct Call (1.5x) |
| :--- | :--- | :--- | :--- |
| **Tier 0** | 0 – 999 | **0x** (No rewards) | 0 ETH (Game is free to play) |
| **Tier 1** | 1,000 – 9,999 | **1.0x** | **0.00030 ETH** |
| **Tier 2** | 10,000 – 49,999 | **1.5x** | **0.00045 ETH** |
| **Tier 3** | 50,000 – 199,999 | **2.0x** | **0.00060 ETH** |
| **Tier 4** | 200,000 – 999,999 | **3.0x** | **0.00090 ETH** |
| **Tier 5** | 1,000,000+ | **5.0x** (Hard Cap) | **0.00150 ETH** |

> **Hold-Time Rule**: Your wallet must hold the required tier threshold continuously for at least **24 hours** before that tier activates. This prevents flash-loan and pump-and-dump reward harvesting.

---

## 🎲 Provable Fairness Mathematics

Before every flip, the game server generates an entropy pair:
1. `serverSeed`: A cryptographically secure random 256-bit string (`crypto.randomBytes(32)`).
2. `seedHash`: `SHA256(serverSeed)`, provided to the client as an unalterable commitment.
3. `clientSeed`: Supplied by the player's browser or wallet.
4. `nonce`: Incremental count of flips played by this wallet.

### Outcome Formula
```typescript
const message = `${clientSeed}:${nonce}`;
const hmac = crypto.createHmac("sha256", serverSeed).update(message).digest("hex");
// Take first 8 characters (32 bits of entropy)
const intVal = parseInt(hmac.substring(0, 8), 16);
const result = intVal % 2 === 0 ? "heads" : "tails";
```
Immediately after the flip concludes, the raw `serverSeed` is revealed to the user in their flip receipt. Users can click **Verify Fairness** on any flip in their [History](/history) page to run the independent mathematical verification.

---

## 🏦 Treasury & Claim System

- **Treasury Address**: `0xAaf9c56d92a8453Bab14d9a66e6735250B03F0b6`
- **Claim Threshold**: Minimum **0.001 ETH**.
- **Payout Mechanism**:
  1. User clicks **Claim Rewards**.
  2. Database checks claimable balance and idempotently moves eligible ledger rows into `accrued` status.
  3. Privy Server Wallet sends an on-chain transaction:
     ```typescript
     await privy.walletApi.ethereum.sendTransaction({
       walletId: PRIVY_SERVER_WALLET_ID,
       caip2: `eip155:${RH_CHAIN_ID}`,
       transaction: {
         to: walletAddress,
         value: parseEther(amountEth.toFixed(8)),
       },
     });
     ```
  4. Once confirmed on Robinhood Chain, the payout status is marked `confirmed` and ledger rows transition to `paid`.
  5. If the RPC fails or gas is insufficient, rows roll back safely to `claimable`.

---

## 📄 Smart Contracts ($FLIPPO Token)

The repository includes a ready-to-deploy ERC-20 token contract in `/contracts`:
- `contracts/FlippoToken.sol`: Standard OpenZeppelin-compatible ERC-20 with 1,000,000,000 initial supply minted to the deployer.
- `contracts/deploy.ts`: Viem deployment script targeting Robinhood Chain.

To deploy on Robinhood Chain:
```bash
pnpm ts-node contracts/deploy.ts
```
Then paste the deployed address into `NEXT_PUBLIC_FLIPPO_TOKEN_ADDRESS` in `.env.local`.

---

## 🧪 Testing & Verification

### Unit Tests (Vitest)
Runs the test suite for tier calculation, hold-time rules, reward math, and idempotent claims:
```bash
pnpm test
```

### TypeScript Validation
```bash
npx tsc --noEmit
```

### Visual QA & Axe Accessibility
Runs automated headless browser tests with Microsoft Edge / Chromium, testing 1440px desktop and 390px mobile viewports, verifying 0 contrast violations:
```bash
node scripts/take-screenshots.mjs
```

---

## 🚢 Production Deployment

### Docker & Persistent Volume
Because FLIPPO uses a local SQLite double-entry ledger in WAL mode (`flippo.db`), configure a persistent volume when deploying to platforms like Railway, Fly.io, or Render:

1. Mount a volume to `/data`.
2. Set the SQLite database path in `src/db/index.ts` or configure via `DATABASE_PATH=/data/flippo.db`.
3. Set `NEXT_PUBLIC_NETWORK_MODE="mainnet"`.
4. Ensure the Treasury Server Wallet (`0xAaf9c56d92a8453Bab14d9a66e6735250B03F0b6`) is funded with sufficient Robinhood Chain ETH to cover user claims.

---

## 📜 License
MIT License. Built with ❤️ for Robinhood Chain.
