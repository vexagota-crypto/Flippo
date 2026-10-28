import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/server/auth";
import { repository } from "@/db/repository";
import { processPayoutTransaction } from "@/server/treasury";
import { REWARD_CONFIG } from "@/config/rewards";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    let user = await authenticateRequest(req);

    if (!user && env.client.NEXT_PUBLIC_NETWORK_MODE === "testnet") {
      const devHeader = req.headers.get("x-dev-wallet");
      if (devHeader && /^0x[a-fA-F0-9]{40}$/.test(devHeader)) {
        user = {
          userId: `dev:${devHeader}`,
          walletAddress: devHeader.toLowerCase(),
        };
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please connect your wallet." },
        { status: 401 }
      );
    }

    // 1. Create idempotent payout claim
    const claim = await repository.createPayoutClaim(
      user.walletAddress,
      REWARD_CONFIG.MIN_CLAIM_THRESHOLD_ETH
    );

    if (!claim) {
      const summary = await repository.getLedgerSummary(user.walletAddress);
      return NextResponse.json(
        {
          error: `Minimum claim amount is ${REWARD_CONFIG.MIN_CLAIM_THRESHOLD_ETH} ETH. Current claimable: ${summary.totalClaimableEth} ETH`,
          claimable: summary.totalClaimableEth,
        },
        { status: 400 }
      );
    }

    // 2. Broadcast payout transaction from Treasury wallet
    const payoutResult = await processPayoutTransaction({
      payoutId: claim.payoutId,
      recipientAddress: user.walletAddress as `0x${string}`,
      amountEth: claim.amountEth,
    });

    const updatedSummary = await repository.getLedgerSummary(user.walletAddress);

    if (!payoutResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: payoutResult.error || "Failed to broadcast claim transaction from treasury.",
          summary: updatedSummary,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payoutId: claim.payoutId,
      amountEth: claim.amountEth,
      txHash: payoutResult.txHash,
      summary: updatedSummary,
    });
  } catch (error: any) {
    console.error("Claim payout error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process reward claim" },
      { status: 500 }
    );
  }
}
