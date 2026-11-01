import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/server/auth";
import { executeFlip } from "@/server/flip-engine";
import { repository } from "@/db/repository";
import { env } from "@/lib/env";

const flipBodySchema = z.object({
  call: z.enum(["heads", "tails"]),
  clientSeed: z.string().max(64).optional(),
  idempotencyKey: z.string().max(128).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    let user = await authenticateRequest(req);

    // Fallback in testnet mode if auth header is a direct test address
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
        { error: "Unauthorized. Please connect your wallet through Privy." },
        { status: 401 }
      );
    }

    // 2. Validate input
    const body = await req.json();
    const parsed = flipBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid flip parameters. Choose heads or tails." },
        { status: 400 }
      );
    }

    // 3. Execute Flip
    const result = await executeFlip({
      walletAddress: user.walletAddress,
      call: parsed.data.call,
      clientSeed: parsed.data.clientSeed,
      idempotencyKey: parsed.data.idempotencyKey,
    });

    // 4. Return result with updated stats
    const summary = await repository.getLedgerSummary(user.walletAddress);

    return NextResponse.json({
      success: true,
      flip: result,
      summary,
    });
  } catch (error: any) {
    console.error("Flip execution error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to execute flip" },
      { status: 500 }
    );
  }
}
