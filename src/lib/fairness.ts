import crypto from "crypto";

export interface ProvableSeedPair {
  serverSeed: string;
  seedHash: string;
}

/**
 * Generate a cryptographically secure random server seed and its public SHA-256 commitment hash
 */
export function generateServerSeedCommitment(): ProvableSeedPair {
  const serverSeed = crypto.randomBytes(32).toString("hex");
  const seedHash = crypto.createHash("sha256").update(serverSeed).digest("hex");
  return {
    serverSeed,
    seedHash,
  };
}

/**
 * Deterministically calculate the flip result from serverSeed, clientSeed, and nonce
 * Returns 0 for heads, 1 for tails
 */
export function determineFlipOutcome(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): "heads" | "tails" {
  const payload = `${serverSeed}:${clientSeed}:${nonce}`;
  const hmac = crypto.createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}`).digest("hex");
  const intVal = parseInt(hmac.slice(0, 8), 16);
  return intVal % 2 === 0 ? "heads" : "tails";
}

/**
 * Verify a flip's provable fairness:
 * 1. Checks that SHA256(serverSeed) === seedHash
 * 2. Checks that outcome computed matches reported outcome
 */
export function verifyFlipFairness(params: {
  serverSeed: string;
  seedHash: string;
  clientSeed: string;
  nonce: number;
  reportedResult: "heads" | "tails";
}): {
  isValid: boolean;
  computedHash: string;
  computedResult: "heads" | "tails";
  reason?: string;
} {
  const computedHash = crypto.createHash("sha256").update(params.serverSeed).digest("hex");
  if (computedHash.toLowerCase() !== params.seedHash.toLowerCase()) {
    return {
      isValid: false,
      computedHash,
      computedResult: "heads",
      reason: "Server seed does not match the committed seed hash",
    };
  }

  const computedResult = determineFlipOutcome(params.serverSeed, params.clientSeed, params.nonce);
  if (computedResult !== params.reportedResult) {
    return {
      isValid: false,
      computedHash,
      computedResult,
      reason: `Calculated outcome (${computedResult}) does not match reported outcome (${params.reportedResult})`,
    };
  }

  return {
    isValid: true,
    computedHash,
    computedResult,
  };
}
