import { NextRequest, NextResponse } from "next/server";
import { repository } from "@/db/repository";

export async function GET(req: NextRequest) {
  try {
    const by = (req.nextUrl.searchParams.get("by") || "rewards") as "rewards" | "streak";
    const timeFrame = (req.nextUrl.searchParams.get("timeFrame") || "all") as "24h" | "7d" | "all";
    const limit = Math.min(50, parseInt(req.nextUrl.searchParams.get("limit") || "10", 10));

    const rows = await repository.getLeaderboard(by, timeFrame, limit);

    return NextResponse.json({
      success: true,
      by,
      timeFrame,
      data: rows,
    });
  } catch (err: any) {
    console.error("Leaderboard query error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
