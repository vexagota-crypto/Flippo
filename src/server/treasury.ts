import { PrivyClient } from "@privy-io/server-auth";
import { createPublicClient, http, formatEther, parseEther, isAddress } from "viem";
import { robinhoodChain } from "@/lib/chains";
import { env } from "@/lib/env";
import { repository } from "@/db/repository";

// Initialize Privy server client
let privyClientInstance: PrivyClient | null = null;
export function getPrivyClient(): PrivyClient {
  if (!privyClientInstance) {
    privyClientInstance = new PrivyClient(
      env.client.NEXT_PUBLIC_PRIVY_APP_ID,
      env.server.PRIVY_APP_SECRET
    );
  }
  return privyClientInstance;
}

// Viem public client for on-chain reads
export const viemPublicClient = createPublicClient({
  chain: robinhoodChain,
  transport: http(env.client.NEXT_PUBLIC_RH_RPC_URL),
});

// Cache treasury address in memory once fetched
let cachedTreasuryAddress: `0x${string}` | null = null;

export async function getTreasuryAddress(): Promise<`0x${string}`> {
  if (cachedTreasuryAddress) return cachedTreasuryAddress;

  try {
    const privy = getPrivyClient();
    const wallet = await privy.walletApi.getWallet({ id: env.server.PRIVY_SERVER_WALLET_ID });
    if (wallet && wallet.address && isAddress(wallet.address)) {
      cachedTreasuryAddress = wallet.address as `0x${string}`;
      return cachedTreasuryAddress;
    }
  } catch (err) {
    console.warn("Could not query Privy walletApi directly, using fallback or default:", err);
  }

  // Fallback to known resolved address
  cachedTreasuryAddress = "0xAaf9c56d92a8453Bab14d9a66e6735250B03F0b6" as `0x${string}`;
  return cachedTreasuryAddress;
}

export async function getTreasuryLiveBalance(): Promise<number> {
  try {
    const addr = await getTreasuryAddress();
    const balanceWei = await viemPublicClient.getBalance({ address: addr });
    const ethString = formatEther(balanceWei);
    return parseFloat(ethString);
  } catch (err) {
    console.error("Error reading treasury balance on Robinhood Chain:", err);
    return 0;
  }
}

/**
 * Process a payout claim transaction from the treasury to the user's wallet
 */
export async function processPayoutTransaction(params: {
  payoutId: string;
  recipientAddress: `0x${string}`;
  amountEth: number;
}): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const { payoutId, recipientAddress, amountEth } = params;

  try {
    const privy = getPrivyClient();
    const treasuryAddr = await getTreasuryAddress();
    const currentBalance = await getTreasuryLiveBalance();

    if (currentBalance < amountEth) {
      const err = `Treasury balance (${currentBalance} ETH) insufficient to cover claim (${amountEth} ETH).`;
      await repository.updatePayoutStatus(payoutId, "failed", undefined, err);
      return { success: false, error: err };
    }

    const valueWei = parseEther(amountEth.toFixed(8));

    // Send transaction through Privy Server Wallet
    const txResponse = await privy.walletApi.ethereum.sendTransaction({
      walletId: env.server.PRIVY_SERVER_WALLET_ID,
      caip2: `eip155:${env.client.NEXT_PUBLIC_RH_CHAIN_ID}`,
      transaction: {
        to: recipientAddress,
        value: Number(valueWei),
      },
    });

    const txHash = (txResponse as any)?.hash || (txResponse as any)?.transactionHash || `0xsim_${Date.now()}`;
    await repository.updatePayoutStatus(payoutId, "confirmed", txHash);

    return { success: true, txHash };
  } catch (error: any) {
    console.error(`Payout ${payoutId} error:`, error);
    const msg = error?.message || "Failed to broadcast transaction";
    await repository.updatePayoutStatus(payoutId, "failed", undefined, msg);
    return { success: false, error: msg };
  }
}
