"use client";

import React, { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { Coins, CheckCircle, Clock, ShieldCheck, AlertCircle } from "lucide-react";

export function YourRewards() {
  const { login, authenticated, getAccessToken, user } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = wallets[0] || (user?.wallet?.address ? { address: user.wallet.address } : null);

  const [stats, setStats] = useState<any>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!activeWallet?.address) return;
    try {
      const res = await fetch(`/api/user-stats?address=${activeWallet.address}`);
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (e) {
      console.error(e);
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

    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      else if (activeWallet?.address) headers["x-dev-wallet"] = activeWallet.address;

      const res = await fetch("/api/claim", { method: "POST", headers });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Claim failed");
      }

      setClaimStatus(`Claim of ${data.amountEth} ETH sent! TX: ${data.txHash.slice(0, 8)}...`);
      fetchStats();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to process claim.");
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
            <Button
              variant="pink"
              size="md"
              onClick={() => login()}
              className="mt-2 text-xs font-black px-6"
            >
              Connect Wallet
            </Button>
          </div>
        ) : (
          /* Connected: Real totals grid */
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

            {/* Accrued / Pending */}
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
        )}

        {claimStatus && (
          <div className="p-3 bg-[#16A34A]/15 border-2 border-[#16A34A] text-[#16A34A] rounded-[16px] text-xs font-mono font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{claimStatus}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-[#E5484D]/15 border-2 border-[#E5484D] text-[#E5484D] rounded-[16px] text-xs font-mono font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </Surface>
    </section>
  );
}
