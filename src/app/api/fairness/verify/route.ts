import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyFlipFairness } from "@/lib/fairness";

const verifyBodySchema = z.object({
  serverSeed: z.string(),
  seedHash: z.string(),
  clientSeed: z.string(),
  nonce: z.number(),
  reportedResult: z.enum(["heads", "tails"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid verification parameters" },
        { status: 400 }
      );
    }

    const verification = verifyFlipFairness(parsed.data);

    return NextResponse.json({
      success: true,
      verification,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Verification failed" },
      { status: 500 }
    );
  }
}
