import { defineChain } from "viem";
import { env } from "@/lib/env";

export const robinhoodChain = defineChain({
  id: env.client.NEXT_PUBLIC_RH_CHAIN_ID,
  name:
    env.client.NEXT_PUBLIC_NETWORK_MODE === "testnet" || env.client.NEXT_PUBLIC_RH_CHAIN_ID === 46630
      ? "Robinhood Chain Testnet"
      : "Robinhood Chain",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [env.client.NEXT_PUBLIC_RH_RPC_URL],
    },
    public: {
      http: [env.client.NEXT_PUBLIC_RH_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name:
        env.client.NEXT_PUBLIC_NETWORK_MODE === "testnet" || env.client.NEXT_PUBLIC_RH_CHAIN_ID === 46630
          ? "Robinhood Chain Testnet Explorer"
          : "Robinhood Chain Explorer",
      url: env.client.NEXT_PUBLIC_RH_EXPLORER_URL,
    },
  },
  testnet: env.client.NEXT_PUBLIC_NETWORK_MODE === "testnet" || env.client.NEXT_PUBLIC_RH_CHAIN_ID === 46630,
  contracts: {},
});

export const SUPPORTED_CHAINS = [robinhoodChain];
