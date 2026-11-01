import { NextRequest, NextResponse, connection } from "next/server";
import { repository } from "@/db/repository";
import { getTreasuryAddress, getTreasuryLiveBalance } from "@/server/treasury";
import { authenticateRequest } from "@/server/auth";
import { env } from "@/lib/env";
import { sqlite } from "@/db/index";

export async function GET(req: NextRequest) {
  await connection();
  try {
    const user = await authenticateRequest(req);
    const adminWallets = (env.server.ADMIN_WALLETS || "")
      .split(",")
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);

    // If ADMIN_WALLETS is configured, ensure caller is an admin
    if (adminWallets.length > 0) {
      if (!user || !adminWallets.includes(user.walletAddress)) {
        return NextResponse.json({ error: "Unauthorized. Admin wallet required." }, { status: 403 });
      }
    }

    const [paused, treasuryAddress, treasuryBalance, auditLogs, protocolStats] = await Promise.all([
      repository.isRewardsPaused(),
      getTreasuryAddress(),
      getTreasuryLiveBalance(),
      sqlite.prepare("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 50").all(),
      repository.getProtocolStats(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        isRewardsPaused: paused,
        treasuryAddress,
        treasuryBalanceEth: treasuryBalance,
        auditLogs,
        protocolStats,
      },
    });
  } catch (err: any) {
    if (err?.digest === "NEXT_PRERENDER_INTERRUPTED") throw err;
    return NextResponse.json({ error: err?.message || "Admin query failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const adminWallets = (env.server.ADMIN_WALLETS || "")
      .split(",")
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);

    if (adminWallets.length > 0) {
      if (!user || !adminWallets.includes(user.walletAddress)) {
        return NextResponse.json({ error: "Unauthorized. Admin wallet required." }, { status: 403 });
      }
    }

    const body = await req.json();
    const { action, payload } = body;
    const adminAddr = user?.walletAddress || "admin_direct";

    if (action === "toggle_pause") {
      const current = await repository.isRewardsPaused();
      const next = !current;
      await repository.setSetting("rewards_paused", next ? "true" : "false");
      await repository.recordAuditLog(adminAddr, "TOGGLE_REWARDS_PAUSE", `Set to ${next}`);
      return NextResponse.json({ success: true, isRewardsPaused: next });
    }

    if (action === "ban_wallet") {
      const target = payload?.address?.toLowerCase();
      if (target) {
        sqlite.prepare("UPDATE wallets SET is_banned = 1 WHERE address = ?").run(target);
        await repository.recordAuditLog(adminAddr, "BAN_WALLET", `Banned wallet ${target}`);
        return NextResponse.json({ success: true, message: `Banned wallet ${target}` });
      }
    }

    if (action === "unban_wallet") {
      const target = payload?.address?.toLowerCase();
      if (target) {
        sqlite.prepare("UPDATE wallets SET is_banned = 0 WHERE address = ?").run(target);
        await repository.recordAuditLog(adminAddr, "UNBAN_WALLET", `Unbanned wallet ${target}`);
        return NextResponse.json({ success: true, message: `Unbanned wallet ${target}` });
      }
    }

    return NextResponse.json({ error: "Unknown admin action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Admin operation failed" }, { status: 500 });
  }
}
