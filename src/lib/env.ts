import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_NETWORK_MODE: z.enum(["testnet", "mainnet"]).default("testnet"),
  NEXT_PUBLIC_PRIVY_APP_ID: z.string().min(1, "NEXT_PUBLIC_PRIVY_APP_ID is required"),
  NEXT_PUBLIC_RH_CHAIN_ID: z.coerce.number().default(4663),
  NEXT_PUBLIC_RH_RPC_URL: z.string().url("NEXT_PUBLIC_RH_RPC_URL must be a valid URL").default("https://rpc.mainnet.chain.robinhood.com"),
  NEXT_PUBLIC_RH_EXPLORER_URL: z.string().url("NEXT_PUBLIC_RH_EXPLORER_URL must be a valid URL").default("https://robinhoodchain.blockscout.com/"),
  NEXT_PUBLIC_FLIPPO_TOKEN_ADDRESS: z.string().default("COMING_SOON"),
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().default(""),
  NEXT_PUBLIC_TWITTER_URL: z.string().default("https://x.com/flippocoin"),
  NEXT_PUBLIC_TELEGRAM_URL: z.string().default("https://t.me/flippocoin"),
  NEXT_PUBLIC_DOCS_URL: z.string().default("https://docs.flippo.fun"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
});

const serverEnvSchema = z.object({
  PRIVY_APP_SECRET: z.string().min(1, "PRIVY_APP_SECRET is required"),
  PRIVY_SERVER_WALLET_ID: z.string().min(1, "PRIVY_SERVER_WALLET_ID is required"),
  PRIVY_AUTHORIZATION_PRIVATE_KEY: z.string().optional().default(""),
  ADMIN_WALLETS: z.string().optional().default(""),
  CRON_SECRET: z.string().min(1, "CRON_SECRET is required"),
  DATABASE_URL: z.string().default("flippo.db"),
});

function parseEnv() {
  const clientParsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_NETWORK_MODE: process.env.NEXT_PUBLIC_NETWORK_MODE,
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    NEXT_PUBLIC_RH_CHAIN_ID: process.env.NEXT_PUBLIC_RH_CHAIN_ID,
    NEXT_PUBLIC_RH_RPC_URL: process.env.NEXT_PUBLIC_RH_RPC_URL,
    NEXT_PUBLIC_RH_EXPLORER_URL: process.env.NEXT_PUBLIC_RH_EXPLORER_URL,
    NEXT_PUBLIC_FLIPPO_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_FLIPPO_TOKEN_ADDRESS,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    NEXT_PUBLIC_TWITTER_URL: process.env.NEXT_PUBLIC_TWITTER_URL,
    NEXT_PUBLIC_TELEGRAM_URL: process.env.NEXT_PUBLIC_TELEGRAM_URL,
    NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!clientParsed.success) {
    console.error("❌ Invalid client environment variables:", clientParsed.error.flatten().fieldErrors);
    throw new Error("Invalid client environment variables: " + JSON.stringify(clientParsed.error.flatten().fieldErrors));
  }

  const isServer = typeof window === "undefined";
  let serverParsed: { success: true; data: z.infer<typeof serverEnvSchema> } | { success: false; error: z.ZodError } = {
    success: true,
    data: {
      PRIVY_APP_SECRET: process.env.PRIVY_APP_SECRET || "",
      PRIVY_SERVER_WALLET_ID: process.env.PRIVY_SERVER_WALLET_ID || "",
      PRIVY_AUTHORIZATION_PRIVATE_KEY: process.env.PRIVY_AUTHORIZATION_PRIVATE_KEY || "",
      ADMIN_WALLETS: process.env.ADMIN_WALLETS || "",
      CRON_SECRET: process.env.CRON_SECRET || "flippo_cron_sec_f893d2c10a4e76b5",
      DATABASE_URL: process.env.DATABASE_URL || "flippo.db",
    },
  };

  if (isServer) {
    serverParsed = serverEnvSchema.safeParse({
      PRIVY_APP_SECRET: process.env.PRIVY_APP_SECRET,
      PRIVY_SERVER_WALLET_ID: process.env.PRIVY_SERVER_WALLET_ID,
      PRIVY_AUTHORIZATION_PRIVATE_KEY: process.env.PRIVY_AUTHORIZATION_PRIVATE_KEY,
      ADMIN_WALLETS: process.env.ADMIN_WALLETS,
      CRON_SECRET: process.env.CRON_SECRET,
      DATABASE_URL: process.env.DATABASE_URL || "flippo.db",
    });

    if (!serverParsed.success) {
      console.error("❌ Invalid server environment variables:", serverParsed.error.flatten().fieldErrors);
      throw new Error("Invalid server environment variables: " + JSON.stringify(serverParsed.error.flatten().fieldErrors));
    }
  }

  return {
    client: clientParsed.data,
    server: serverParsed.data,
  };
}

export const env = parseEnv();
