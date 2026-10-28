import { NextRequest, NextResponse } from "next/server";
import { repository } from "@/db/repository";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    if (env.client.NEXT_PUBLIC_NETWORK_MODE !== "testnet") {
      return NextResponse.json(
        { error: "Faucet is only active in testnet mode." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const address = body.address?.toLowerCase();

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: "Valid wallet address is required" },
        { status: 400 }
      );
    }

    const wallet = await repository.getOrCreateWallet(address);

    // Give 10,000 test $FLIPPO (Tier 2 boost) per faucet call
    const faucetAmount = 10_000;
    const newBalance = wallet.lastBalance + faucetAmount;

    await repository.updateWalletBalance(address, newBalance);

    return NextResponse.json({
      success: true,
      message: `Successfully claimed ${faucetAmount.toLocaleString()} test $FLIPPO!`,
      newBalance,
    });
  } catch (err: any) {
    console.error("Faucet error:", err);
    return NextResponse.json(
      { error: err?.message || "Faucet claim failed" },
      { status: 500 }
    );
  }
}
