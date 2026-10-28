import { viemPublicClient } from "./treasury";
import { env } from "@/lib/env";
import { repository } from "@/db/repository";
import { formatUnits, isAddress } from "viem";

const erc20Abi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

export async function getWalletTokenBalance(walletAddress: string): Promise<number> {
  const addr = walletAddress.toLowerCase();
  const tokenAddress = env.client.NEXT_PUBLIC_FLIPPO_TOKEN_ADDRESS;

  // 1. If a valid on-chain token contract is provided, query it
  if (tokenAddress && tokenAddress !== "COMING_SOON" && isAddress(tokenAddress)) {
    try {
      const [rawBalance, decimals] = await Promise.all([
        viemPublicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [addr as `0x${string}`],
        }),
        viemPublicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "decimals",
        }).catch(() => 18),
      ]);

      const formatted = parseFloat(formatUnits(rawBalance, decimals));
      // Update database cache
      await repository.updateWalletBalance(addr, formatted);
      return formatted;
    } catch (err) {
      console.warn(`Could not read on-chain balance from ${tokenAddress}:`, err);
    }
  }

  // 2. Fallback to persisted balance in the repository
  const wallet = await repository.getWallet(addr);
  return wallet ? wallet.lastBalance : 0;
}
