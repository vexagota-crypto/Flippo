/**
 * Deploy Script for Flippo ERC-20 on Robinhood Chain
 * Uses viem to deploy FlippoToken.sol
 */
import { createWalletClient, createPublicClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { robinhoodChain } from "../src/lib/chains";
import { env } from "../src/lib/env";

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  if (!privateKey) {
    console.error("Please export DEPLOYER_PRIVATE_KEY=0x...");
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey);
  const client = createWalletClient({
    account,
    chain: robinhoodChain,
    transport: http(env.client.NEXT_PUBLIC_RH_RPC_URL),
  });

  const publicClient = createPublicClient({
    chain: robinhoodChain,
    transport: http(env.client.NEXT_PUBLIC_RH_RPC_URL),
  });

  console.log(`Deploying $FLIPPO from deployer: ${account.address}`);
  console.log(`Target Chain: Robinhood Chain (${robinhoodChain.id})`);

  // Note: Compile FlippoToken.sol with solc or hardhat to obtain bytecode and abi
  console.log("To deploy via Foundry/Hardhat:");
  console.log(`forge create contracts/FlippoToken.sol:FlippoToken --rpc-url ${env.client.NEXT_PUBLIC_RH_RPC_URL} --private-key $DEPLOYER_PRIVATE_KEY --constructor-args 100000000`);
}

main().catch(console.error);
