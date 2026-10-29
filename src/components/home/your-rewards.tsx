"use client";

import React, { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@/components/connect-button";
import { Coins, CheckCircle, Clock, RotateCw, AlertCircle } from "lucide-react";

export function YourRewards() {
  const { authenticated, getAccessToken, user } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = wallets[0] || (user?.wallet?.address ? { address: user.wallet.address } : null);

  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!activeWallet?.address) return;
    setIsLoading(true);
    setErrorMsg(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`/api/user-stats?address=${activeWallet.address}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.success) {
        setStats(data);
      } else {
        setErrorMsg(data.error || "Failed to load reward stats");
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      setErrorMsg(e.name === "AbortError" ? "Network timeout. Tap retry." : "Could not load stats");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeWallet?.address) {
      fetchStats();
    }
  }, [activeWallet?.address]);

  const handleClaim = async () => {
    if (!authenticated || isClaiming) return;
    setIsClaiming(true);
    setClaimStatus(null);
    setErrorMsg(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      else if (activeWallet?.address) headers["x-dev-wallet"] = activeWallet.address;

      const res = await fetch("/api/claim", { method: "POST", headers, signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Claim failed");
      }

      setClaimStatus(`Claim of ${data.amountEth} ETH sent! TX: ${data.txHash.slice(0, 8)}...`);
      fetchStats();
    } catch (err: any) {
      clearTimeout(timeoutId);
      setErrorMsg(err.name === "AbortError" ? "Claim request timed out. Please retry." : err?.message || "Failed to process claim.");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <section className="w-full py-12 px-4 sm:px-6 max-w-5xl mx-auto">
      <Surface
        tone="white"
        radius="xl"
        className="p-6 sm:p-10 bg-white border-[3px] border-[#0B0B14] shadow-[0_6px_0_#0B0B14] flex flex-col gap-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#0B0B14]/10 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFE66B] border-2 border-[#0B0B14] rounded-full text-xs font-mono font-bold text-[#0B0B14] mb-2">
              <Coins className="w-3.5 h-3.5 text-[#0B0B14]" />
              <span>Wallet Ledger</span>
            </div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B0B14]">
              Your Rewards
            </h2>
          </div>

          {authenticated && stats && stats.totalClaimableEth >= stats.minClaimThresholdEth && (
            <Button
              variant="pink"
              size="md"
              isLoading={isClaiming}
              onClick={handleClaim}
              className="px-6 font-black text-sm"
            >
              Claim {stats.totalClaimableEth} ETH
            </Button>
          )}
        </div>

        {/* Not connected state: Friendly prompt, never a spinner */}
        {!authenticated ? (
          <div className="flex flex-col items-center justify-center p-8 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-[24px] text-center gap-3">
            <h3 className="font-display font-extrabold text-xl text-[#0B0B14]">
              Connect to view your earnings
            </h3>
            <p className="text-xs text-[#0B0B14]/70 max-w-sm">
              Your flips, daily accrued rewards, and claimable treasury balances will appear here once your wallet is connected.
            </p>
            <div className="mt-2">
              <ConnectButton size="md" label="Connect Wallet" />
            </div>
          </div>
        ) : (
          /* Connected: Real totals grid */
          <div className="flex flex-col gap-4">
            {errorMsg && (
              <div className="p-3 bg-[#FFF0F5] border-2 border-[#FE2D88] rounded-[16px] flex items-center justify-between text-xs font-mono text-[#0B0B14]">
                <span className="text-[#C2185B] font-bold">{errorMsg}</span>
                <button
                  type="button"
                  onClick={fetchStats}
                  className="px-2.5 py-1 bg-[#FE2D88] text-white font-bold rounded-lg flex items-center gap-1 active:scale-95"
                >
                  <RotateCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                  <span>Retry</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Flips Today */}
              <div className="p-4 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-[20px] shadow-[0_3px_0_#0B0B14]">
                <span className="text-[11px] font-mono uppercase text-[#0B0B14]/60 block mb-1">
                  Flips Today
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-[#0B0B14]">
                  {stats?.flipsToday ?? 0}
                </span>
                <span className="text-[11px] font-mono text-[#0B0B14]/60 block mt-1">
                  Max {stats?.maxFlipsPerDay ?? 10} / day
                </span>
              </div>

              {/* Pending Accrued */}
              <div className="p-4 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-[20px] shadow-[0_3px_0_#0B0B14]">
                <span className="text-[11px] font-mono uppercase text-[#0B0B14]/60 block mb-1">
                  Pending Accrued
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-[#0C73FE]">
                  {stats?.totalAccruedEth ?? 0}
                </span>
                <span className="text-[11px] font-mono text-[#0B0B14]/60 block mt-1">
                  Processing payouts
                </span>
              </div>

              {/* Claimable Balance */}
              <div className="p-4 bg-[#FFE66B]/25 border-2 border-[#0B0B14] rounded-[20px] shadow-[0_3px_0_#0B0B14]">
                <span className="text-[11px] font-mono uppercase text-[#0B0B14]/60 block mb-1">
                  Claimable Now
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-[#FE2D88]">
                  {stats?.totalClaimableEth ?? 0}
                </span>
                <span className="text-[11px] font-mono text-[#0B0B14]/60 block mt-1">
                  Min threshold {stats?.minClaimThresholdEth ?? 0.001} ETH
                </span>
              </div>

              {/* Total Paid Out */}
              <div className="p-4 bg-[#16A34A]/10 border-2 border-[#0B0B14] rounded-[20px] shadow-[0_3px_0_#0B0B14]">
                <span className="text-[11px] font-mono uppercase text-[#0B0B14]/60 block mb-1">
                  Total Paid
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-[#16A34A]">
                  {stats?.totalPaidEth ?? 0}
                </span>
                <span className="text-[11px] font-mono text-[#0B0B14]/60 block mt-1">
                  ETH transferred
                </span>
              </div>
            </div>
          </div>
        )}

        {claimStatus && (
          <div className="p-3 bg-[#16A34A]/15 border-2 border-[#16A34A] text-[#16A34A] rounded-[16px] text-xs font-mono font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{claimStatus}</span>
          </div>
        )}
      </Surface>
    </section>
  );
}
