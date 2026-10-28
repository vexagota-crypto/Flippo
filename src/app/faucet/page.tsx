"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { useWallets } from "@privy-io/react-auth";
import { Sparkles, CheckCircle, AlertCircle, Droplets } from "lucide-react";

export default function FaucetPage() {
  const { wallets } = useWallets();
  const activeWallet = wallets[0];

  const [targetAddress, setTargetAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const effectiveAddress = targetAddress || activeWallet?.address || "";

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveAddress) return;

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: effectiveAddress }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Faucet claim failed");
      }

      setSuccessMsg(data.message);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to claim faucet tokens");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#F4FAFF] text-[#0B0B14]">
      <Navbar />

      <div className="pt-28 pb-16 px-4 sm:px-6 max-w-xl mx-auto w-full flex flex-col gap-8">
        <div className="text-center">
          <div className="inline-block transform rotate-1 mb-2">
            <span className="px-3.5 py-1 bg-[#FFE66B] text-[#0B0B14] font-mono text-xs font-black rounded-full border-2 border-[#0B0B14] shadow-[0_2px_0_#0B0B14]">
              testnet only
            </span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-[#0B0B14] tracking-tight">
            $FLIPPO Faucet
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#0B0B14]/80">
            Claim test $FLIPPO tokens to unlock higher multiplier tiers and test coin flips.
          </p>
        </div>

        <Surface
          tone="white"
          radius="xl"
          className="p-6 sm:p-8 bg-white border-[3px] border-[#0B0B14] shadow-[0_6px_0_#0B0B14] flex flex-col gap-5"
        >
          <div className="flex items-center gap-2 border-b-2 border-[#0B0B14]/10 pb-3">
            <Droplets className="w-5 h-5 text-[#0C73FE]" />
            <h3 className="font-display font-black text-lg text-[#0B0B14]">
              Claim 10,000 Test $FLIPPO
            </h3>
          </div>

          <form onSubmit={handleClaim} className="flex flex-col gap-4">
            <div>
              <label className="font-mono text-xs font-bold text-[#0B0B14] block mb-1.5">
                Recipient Wallet Address (Robinhood Chain)
              </label>
              <input
                type="text"
                placeholder={activeWallet?.address || "0x..."}
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                className="w-full h-12 px-4 rounded-[14px] border-2 border-[#0B0B14] bg-[#F4FAFF] font-mono text-xs sm:text-sm text-[#0B0B14] focus:outline-none focus:border-[#0C73FE]"
              />
              {activeWallet?.address && !targetAddress && (
                <span className="text-[10px] font-mono text-[#0B0B14]/60 block mt-1">
                  Using connected wallet: {activeWallet.address.slice(0, 10)}...
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant="pink"
              size="lg"
              isLoading={loading}
              disabled={!effectiveAddress || loading}
              className="w-full font-black text-sm"
            >
              Drip 10,000 $FLIPPO
            </Button>
          </form>

          {successMsg && (
            <div className="p-3 bg-[#16A34A]/10 border-2 border-[#16A34A] text-[#16A34A] rounded-[14px] text-xs font-mono font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-[#E5484D]/10 border-2 border-[#E5484D] text-[#E5484D] rounded-[14px] text-xs font-mono font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </Surface>
      </div>

      <Footer />
    </main>
  );
}
