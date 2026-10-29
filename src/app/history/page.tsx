"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { useWallets } from "@privy-io/react-auth";
import { Z_INDEX } from "@/styles/z-index";
import { ShieldCheck, History as HistoryIcon, CheckCircle2, XCircle, X, RotateCw } from "lucide-react";

export default function HistoryPage() {
  const { wallets } = useWallets();
  const activeWallet = wallets[0];

  const [flips, setFlips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyingFlip, setVerifyingFlip] = useState<any>(null);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchHistory = () => {
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const url = activeWallet?.address
      ? `/api/history?address=${activeWallet.address}&limit=50`
      : `/api/history?limit=30`;

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(timeoutId);
        if (data.success) {
          setFlips(data.flips);
        } else {
          setError(data.error || "Failed to load flips");
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        setError(err.name === "AbortError" ? "Request timed out" : "Could not load flips");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, [activeWallet?.address]);

  const handleVerify = async (flip: any) => {
    setVerifyingFlip(flip);
    setIsVerifying(true);
    setVerifyResult(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch("/api/fairness/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          serverSeed: flip.serverSeed,
          seedHash: flip.seedHash,
          clientSeed: flip.clientSeed,
          nonce: flip.nonce,
          reportedResult: flip.result,
        }),
      });

      clearTimeout(timeoutId);
      const data = await res.json();
      setVerifyResult(data.verification);
    } catch (e) {
      clearTimeout(timeoutId);
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#F4FAFF] text-[#0B0B14]">
      <Navbar />

      <div className="pt-28 pb-16 px-4 sm:px-6 max-w-5xl mx-auto w-full flex flex-col gap-8">
        <div className="text-center max-w-xl mx-auto">
          <div className="inline-block transform -rotate-1 mb-2">
            <span className="px-3.5 py-1 bg-[#FFE66B] text-[#0B0B14] font-mono text-xs font-black rounded-full border-2 border-[#0B0B14] shadow-[0_2px_0_#0B0B14]">
              audit log
            </span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-[#0B0B14] tracking-tight">
            Flip History & Verification
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#0B0B14]/80">
            {activeWallet?.address
              ? `Showing flip history for ${activeWallet.address.slice(0, 6)}...${activeWallet.address.slice(-4)}`
              : "Showing recent protocol flips across all players."}
          </p>
        </div>

        <Surface
          tone="white"
          radius="xl"
          className="p-6 sm:p-8 bg-white border-[3px] border-[#0B0B14] shadow-[0_6px_0_#0B0B14] flex flex-col gap-6"
        >
          <div className="flex items-center justify-between border-b-2 border-[#0B0B14]/10 pb-4">
            <div className="flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-[#0C73FE]" />
              <h3 className="font-display font-extrabold text-xl text-[#0B0B14]">
                Recorded Flips
              </h3>
            </div>
            <span className="text-xs font-mono text-[#0B0B14]/60">
              {flips.length} flips
            </span>
          </div>

          {error && (
            <div className="p-3 bg-[#FFF0F5] border-2 border-[#FE2D88] rounded-[16px] flex items-center justify-between text-xs font-mono">
              <span className="text-[#C2185B] font-bold">{error}</span>
              <button
                type="button"
                onClick={fetchHistory}
                className="px-2.5 py-1 bg-[#FE2D88] text-white font-bold rounded-lg flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <RotateCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center font-mono text-xs text-[#0B0B14]/50">
              Loading flip history...
            </div>
          ) : flips.length === 0 ? (
            <div className="py-16 text-center font-mono text-xs text-[#0B0B14]/60 bg-[#F4FAFF] rounded-[20px] border-2 border-[#0B0B14]/10">
              No flips found. Play a game to record your first flip!
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {flips.map((flip) => {
                const dateStr = new Date(flip.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });
                return (
                  <div
                    key={flip.id}
                    className="p-4 bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-[18px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_2px_0_#0B0B14]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white border-2 border-[#0B0B14] flex items-center justify-center font-display font-black text-sm uppercase">
                        {flip.result === "heads" ? "H" : "T"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-extrabold text-sm text-[#0B0B14] uppercase">
                            Result: {flip.result}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              flip.calledCorrectly
                                ? "bg-[#16A34A] text-white"
                                : "bg-[#0B0B14]/10 text-[#0B0B14]"
                            }`}
                          >
                            Call: {flip.call}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#0B0B14]/60 block mt-0.5">
                          {dateStr} &bull; Nonce #{flip.nonce}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-[#0B0B14]/10">
                      <div className="text-left sm:text-right">
                        <span className="font-mono text-sm sm:text-base font-black text-[#FE2D88]">
                          +{flip.rewardEth} ETH
                        </span>
                        {flip.noRewardReason && (
                          <span className="text-[10px] font-mono text-[#E5484D] block">
                            {flip.noRewardReason}
                          </span>
                        )}
                      </div>

                      <Button
                        variant="white"
                        size="sm"
                        onClick={() => handleVerify(flip)}
                        className="text-[11px] font-mono font-bold px-3 py-1 h-8 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#0C73FE]" />
                        Verify
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Surface>
      </div>

      {/* VERIFICATION MODAL */}
      {verifyingFlip && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          style={{ zIndex: Z_INDEX.modal }}
        >
          <Surface
            tone="white"
            radius="xl"
            className="w-full max-w-lg p-6 bg-white border-[3px] border-[#0B0B14] shadow-[0_8px_0_#0B0B14] flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b-2 border-[#0B0B14]/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
                <h3 className="font-display font-black text-lg text-[#0B0B14]">
                  Provable Fairness Verification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVerifyingFlip(null)}
                className="w-8 h-8 rounded-full bg-[#E3F1FF] border-2 border-[#0B0B14] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 text-[#0B0B14]" />
              </button>
            </div>

            {isVerifying ? (
              <div className="py-8 text-center font-mono text-xs">
                Computing cryptographic verification...
              </div>
            ) : verifyResult ? (
              <div className="flex flex-col gap-3 font-mono text-xs">
                <div
                  className={`p-3 rounded-[14px] border-2 flex items-center gap-2 font-bold ${
                    verifyResult.isValid
                      ? "bg-[#16A34A]/10 border-[#16A34A] text-[#16A34A]"
                      : "bg-[#E5484D]/10 border-[#E5484D] text-[#E5484D]"
                  }`}
                >
                  {verifyResult.isValid ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 shrink-0" />
                  )}
                  <span>
                    {verifyResult.isValid
                      ? "Cryptographically Verified 100% Fair"
                      : "Verification Mismatch"}
                  </span>
                </div>

                <div className="bg-[#F4FAFF] p-3 rounded-[14px] border border-[#0B0B14]/20 flex flex-col gap-2">
                  <div>
                    <span className="text-[10px] text-[#0B0B14]/60 uppercase block">
                      Server Seed (Revealed):
                    </span>
                    <span className="text-[11px] font-bold text-[#0B0B14] break-all">
                      {verifyingFlip.serverSeed}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#0B0B14]/60 uppercase block">
                      Committed Seed Hash (SHA-256):
                    </span>
                    <span className="text-[11px] font-bold text-[#0B0B14] break-all">
                      {verifyingFlip.seedHash}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#0B0B14]/10">
                    <div>
                      <span className="text-[10px] text-[#0B0B14]/60 uppercase block">
                        Client Seed:
                      </span>
                      <span className="text-[11px] font-bold text-[#0B0B14]">
                        {verifyingFlip.clientSeed}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#0B0B14]/60 uppercase block">
                        Nonce / Result:
                      </span>
                      <span className="text-[11px] font-bold text-[#0B0B14] uppercase">
                        #{verifyingFlip.nonce} &bull; {verifyingFlip.result}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <Button
              variant="white"
              size="md"
              onClick={() => setVerifyingFlip(null)}
              className="w-full mt-2 cursor-pointer"
            >
              Close
            </Button>
          </Surface>
        </div>
      )}

      <Footer />
    </main>
  );
}
