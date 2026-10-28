import { NextRequest, NextResponse } from "next/server";
import { repository } from "@/db/repository";

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get("limit") || "20", 10));
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0", 10);

    let flips;
    if (address && /^0x[a-fA-F0-9]{40}$/.test(address)) {
      flips = await repository.getWalletFlips(address, limit, offset);
    } else {
      flips = await repository.getRecentFlips(limit);
    }

    return NextResponse.json({
      success: true,
      flips,
    });
  } catch (err: any) {
    console.error("History query error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch flip history" },
      { status: 500 }
    );
  }
}
