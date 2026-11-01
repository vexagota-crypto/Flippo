import { NextResponse, connection } from "next/server";
import { repository } from "@/db/repository";
import { getTreasuryAddress, getTreasuryLiveBalance } from "@/server/treasury";

export async function GET() {
  await connection();
  try {
    const [stats, treasuryAddress, treasuryBalance] = await Promise.all([
      repository.getProtocolStats(),
      getTreasuryAddress(),
      getTreasuryLiveBalance(),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalFlips: stats.totalFlips,
        totalEthPaid: stats.totalEthPaid,
        activePlayersToday: stats.activePlayersToday,
        lastBigWin: stats.lastBigWin,
        treasuryAddress,
        treasuryBalanceEth: treasuryBalance,
      },
    });
  } catch (err: any) {
    if (err?.digest === "NEXT_PRERENDER_INTERRUPTED") throw err;
    console.error("Error fetching protocol stats:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch protocol stats" },
      { status: 500 }
    );
  }
}
