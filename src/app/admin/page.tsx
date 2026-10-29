"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { Shield, Pause, Play, Ban, RefreshCw, RotateCw, AlertTriangle } from "lucide-react";

export default function AdminPage() {
  const { getAccessToken, authenticated } = usePrivy();
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banAddress, setBanAddress] = useState("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/admin", { headers, signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.success) {
        setAdminData(data.data);
      } else {
        setError(data.error || "Failed to load admin data");
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      setError(e.name === "AbortError" ? "Request timed out" : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [authenticated]);

  const handleTogglePause = async () => {
    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/admin", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "toggle_pause" }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg(`Rewards paused state toggled to: ${data.isRewardsPaused}`);
        fetchAdminData();
      }
    } catch (e: any) {
      setActionMsg(`Failed to toggle pause: ${e.message}`);
    }
  };

  const handleBanWallet = async (action: "ban_wallet" | "unban_wallet") => {
    if (!banAddress) return;
    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/admin", {
        method: "POST",
        headers,
        body: JSON.stringify({ action, payload: { address: banAddress } }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg(data.message);
        setBanAddress("");
        fetchAdminData();
      }
    } catch (e: any) {
      setActionMsg(`Action failed: ${e.message}`);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#F4FAFF] text-[#0B0B14]">
      <Navbar />

      <div className="pt-28 pb-16 px-4 sm:px-6 max-w-5xl mx-auto w-full flex flex-col gap-8">
        <div className="text-center">
          <div className="inline-block transform -rotate-1 mb-2">
            <span className="px-3.5 py-1 bg-[#0B0B14] text-white font-mono text-xs font-black rounded-full border-2 border-[#0B0B14] shadow-[0_2px_0_#FE2D88]">
              restricted protocol access
            </span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-[#0B0B14] tracking-tight">
            Admin Governance Portal
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#0B0B14]/80">
            Control protocol pause state, audit ledger transactions, and oversee treasury reserves.
          </p>
        </div>

        {actionMsg && (
          <div className="p-3 bg-[#FFE66B]/50 border-2 border-[#0B0B14] rounded-[14px] text-xs font-mono font-bold text-center">
            {actionMsg}
          </div>
        )}

        {error && (
          <div className="p-3 bg-[#FFF0F5] border-2 border-[#FE2D88] rounded-[16px] flex items-center justify-between text-xs font-mono">
            <span className="text-[#C2185B] font-bold">{error}</span>
            <button
              type="button"
              onClick={fetchAdminData}
              className="px-2.5 py-1 bg-[#FE2D88] text-white font-bold rounded-lg flex items-center gap-1 active:scale-95"
            >
              <RotateCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Treasury Overview */}
        <Surface
          tone="white"
          radius="xl"
          className="p-6 bg-white border-[3px] border-[#0B0B14] shadow-[0_6px_0_#0B0B14] flex flex-col gap-4"
        >
          <div className="flex items-center justify-between border-b-2 border-[#0B0B14]/10 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#0C73FE]" />
              <h3 className="font-display font-black text-lg text-[#0B0B14]">
                Protocol Treasury (Server Wallet)
              </h3>
            </div>
            <Button variant="white" size="sm" onClick={fetchAdminData}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-3 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-[16px]">
              <span className="text-[10px] text-[#0B0B14]/60 uppercase block mb-1">
                Treasury Address
              </span>
              <span className="font-bold text-[#0B0B14] break-all">
                {adminData?.treasuryAddress || "Loading..."}
              </span>
            </div>

            <div className="p-3 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-[16px]">
              <span className="text-[10px] text-[#0B0B14]/60 uppercase block mb-1">
                Live On-Chain Balance
              </span>
              <span className="font-black text-base text-[#FE2D88]">
                {adminData?.treasuryBalanceEth !== undefined
                  ? `${adminData.treasuryBalanceEth} ETH`
                  : "..."}
              </span>
            </div>
          </div>
        </Surface>

        {/* Controls: Pause & Ban */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pause Rewards */}
          <Surface
            tone="white"
            radius="xl"
            className="p-6 bg-white border-[3px] border-[#0B0B14] shadow-[0_5px_0_#0B0B14] flex flex-col justify-between gap-4"
          >
            <div>
              <h4 className="font-display font-extrabold text-base text-[#0B0B14] mb-1">
                Protocol Reward Distribution
              </h4>
              <p className="text-xs text-[#0B0B14]/70 mb-3">
                Emergency pause stops all ETH reward accruals globally while allowing free flips for fun.
              </p>
              <div className="font-mono text-xs font-bold mb-2">
                Status:{" "}
                <span
                  className={
                    adminData?.isRewardsPaused ? "text-[#E5484D]" : "text-[#16A34A]"
                  }
                >
                  {adminData?.isRewardsPaused ? "PAUSED (0 ETH Rewards)" : "ACTIVE (Distributing)"}
                </span>
              </div>
            </div>

            <Button
              variant={adminData?.isRewardsPaused ? "blue" : "pink"}
              size="md"
              onClick={handleTogglePause}
              className="w-full text-xs font-black min-h-[48px]"
            >
              {adminData?.isRewardsPaused ? (
                <span className="flex items-center gap-1.5">
                  <Play className="w-4 h-4" />
                  Resume Rewards
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Pause className="w-4 h-4" />
                  Pause Rewards
                </span>
              )}
            </Button>
          </Surface>

          {/* Ban / Restrict Wallet */}
          <Surface
            tone="white"
            radius="xl"
            className="p-6 bg-white border-[3px] border-[#0B0B14] shadow-[0_5px_0_#0B0B14] flex flex-col justify-between gap-4"
          >
            <div>
              <h4 className="font-display font-extrabold text-base text-[#0B0B14] mb-1">
                Wallet Restrictions
              </h4>
              <p className="text-xs text-[#0B0B14]/70 mb-3">
                Ban or unban malicious bot wallets from flipping or claiming.
              </p>
              <input
                type="text"
                placeholder="0x..."
                value={banAddress}
                onChange={(e) => setBanAddress(e.target.value)}
                className="w-full h-11 px-3 rounded-[12px] border-2 border-[#0B0B14] bg-[#F4FAFF] font-mono text-base text-[#0B0B14]"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="white"
                size="sm"
                onClick={() => handleBanWallet("ban_wallet")}
                className="w-1/2 text-xs font-black text-[#E5484D] min-h-[44px]"
              >
                Ban Wallet
              </Button>
              <Button
                variant="white"
                size="sm"
                onClick={() => handleBanWallet("unban_wallet")}
                className="w-1/2 text-xs font-black text-[#16A34A] min-h-[44px]"
              >
                Unban Wallet
              </Button>
            </div>
          </Surface>
        </div>

        {/* Audit Log */}
        <Surface
          tone="white"
          radius="xl"
          className="p-6 bg-white border-[3px] border-[#0B0B14] shadow-[0_5px_0_#0B0B14] flex flex-col gap-4"
        >
          <h4 className="font-display font-extrabold text-base text-[#0B0B14]">
            Recent Governance Audit Log
          </h4>

          <div className="divide-y divide-[#0B0B14]/10 font-mono text-xs max-h-64 overflow-y-auto">
            {adminData?.auditLogs?.length === 0 ? (
              <div className="py-4 text-[#0B0B14]/50 text-center">
                No admin actions logged yet.
              </div>
            ) : (
              adminData?.auditLogs?.map((log: any) => (
                <div key={log.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#0B0B14] block">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-[#0B0B14]/60">
                      {log.details} &bull; by {log.admin_address}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#0B0B14]/50">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </Surface>
      </div>

      <Footer />
    </main>
  );
}
