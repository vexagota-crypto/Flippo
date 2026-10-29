"use client";

import React, { useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { robinhoodChain } from "@/lib/chains";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Z_INDEX } from "@/styles/z-index";

export function NetworkGuard() {
  const { wallets } = useWallets();
  const activeWallet = wallets[0];
  const [isSwitching, setIsSwitching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!activeWallet) return null;

  const currentChainId = activeWallet.chainId ? parseInt(activeWallet.chainId.replace("eip155:", ""), 10) : null;
  const isWrongNetwork = currentChainId !== null && currentChainId !== robinhoodChain.id;

  if (!isWrongNetwork) return null;

  const handleSwitchNetwork = async () => {
    setIsSwitching(true);
    setErrorMsg(null);
    try {
      await activeWallet.switchChain(robinhoodChain.id);
    } catch (err: any) {
      console.warn("Failed to switchChain directly, trying wallet_addEthereumChain:", err);
      try {
        const provider = await activeWallet.getEthereumProvider();
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${robinhoodChain.id.toString(16)}`,
              chainName: robinhoodChain.name,
              nativeCurrency: robinhoodChain.nativeCurrency,
              rpcUrls: [robinhoodChain.rpcUrls.default.http[0]],
              blockExplorerUrls: [robinhoodChain.blockExplorers.default.url],
            },
          ],
        });
        await activeWallet.switchChain(robinhoodChain.id);
      } catch (addErr: any) {
        console.error("Failed to add/switch network:", addErr);
        setErrorMsg(addErr?.message || "Please switch network in your wallet manually.");
      }
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className={`fixed inset-x-0 bottom-0 ${Z_INDEX.modal} p-4 md:p-6 flex justify-center animate-in slide-in-from-bottom duration-200 pointer-events-auto`}>
      <Surface
        tone="white"
        radius="xl"
        className="max-w-md w-full p-5 bg-white border-[3px] border-[#0B0B14] shadow-[0_8px_0_#0B0B14] flex flex-col gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FFE66B] border-2 border-[#0B0B14] flex items-center justify-center text-[#0B0B14] shrink-0 shadow-[0_2px_0_#0B0B14]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-extrabold text-[#0B0B14] text-base leading-tight">
              Wrong Network Detected
            </h4>
            <p className="text-xs text-[#0B0B14]/80">
              Flippo runs exclusively on <span className="font-bold text-[#0C73FE]">{robinhoodChain.name}</span> (ID: {robinhoodChain.id}).
            </p>
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs font-mono text-[#E5484D] bg-[#FFE2E5] p-2 rounded-lg border border-[#E5484D]/30">
            {errorMsg}
          </p>
        )}

        <Button
          variant="pink"
          size="md"
          isLoading={isSwitching}
          onClick={handleSwitchNetwork}
          className="w-full text-sm font-extrabold"
        >
          {isSwitching ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Switching...
            </span>
          ) : (
            `Switch to ${robinhoodChain.name}`
          )}
        </Button>
      </Surface>
    </div>
  );
}
