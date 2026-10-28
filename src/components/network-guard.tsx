"use client";

import React from "react";
import { useWallets } from "@privy-io/react-auth";
import { robinhoodChain } from "@/lib/chains";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function NetworkGuard() {
  const { wallets } = useWallets();
  const activeWallet = wallets[0];

  if (!activeWallet) return null;

  const currentChainId = activeWallet.chainId ? parseInt(activeWallet.chainId.replace("eip155:", ""), 10) : null;
  const isWrongNetwork = currentChainId !== null && currentChainId !== robinhoodChain.id;

  if (!isWrongNetwork) return null;

  const handleSwitchNetwork = async () => {
    try {
      await activeWallet.switchChain(robinhoodChain.id);
    } catch (err) {
      console.error("Failed to switch network:", err);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 md:p-6 flex justify-center animate-in slide-in-from-bottom duration-200">
      <Surface
        tone="white"
        radius="xl"
        className="max-w-md w-full p-5 bg-white border-[3px] border-[#0B0B14] shadow-[0_8px_0_#0B0B14] flex flex-col gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FFE66B] border-2 border-[#0B0B14] flex items-center justify-center text-[#0B0B14] shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-extrabold text-[#0B0B14] text-base leading-tight">
              Wrong Network Detected
            </h4>
            <p className="text-xs text-[#0B0B14]/80">
              Flippo runs exclusively on <span className="font-bold text-[#0C73FE]">Robinhood Chain</span> (ID: {robinhoodChain.id}).
            </p>
          </div>
        </div>

        <Button
          variant="pink"
          size="md"
          onClick={handleSwitchNetwork}
          className="w-full text-sm font-extrabold"
        >
          Switch to Robinhood Chain
        </Button>
      </Surface>
    </div>
  );
}
