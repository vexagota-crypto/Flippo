"use client";

import React, { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Wallet, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";

export interface ConnectButtonProps {
  className?: string;
  variant?: "pink" | "gradient" | "blue" | "white" | "ink" | "ghost";
  size?: "sm" | "md" | "lg" | "pill" | "icon";
  children?: React.ReactNode;
  label?: string;
  fullWidth?: boolean;
  showDisconnect?: boolean;
}

export function ConnectButton({
  className = "",
  variant = "pink",
  size = "md",
  children,
  label,
  fullWidth = false,
  showDisconnect = false,
}: ConnectButtonProps) {
  const { login, logout, authenticated, ready, user } = usePrivy();
  const { wallets } = useWallets();
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [showDeepLinks, setShowDeepLinks] = useState(false);

  const activeWallet = wallets[0] || (user?.wallet?.address ? { address: user.wallet.address } : null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsMobileDevice(isMobile);
    }
  }, []);

  const handleConnect = () => {
    setErrorMessage(null);

    // Insecure context check (e.g. HTTP on LAN IP)
    if (
      typeof window !== "undefined" &&
      window.isSecureContext === false &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      setErrorMessage("Open Flippo over HTTPS to connect a wallet (Web3 requires a secure context).");
      return;
    }

    try {
      if (typeof login === "function") {
        setIsConnecting(true);
        login();
      }
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      setErrorMessage(err?.message || "Failed to initialize wallet login.");
    } finally {
      setTimeout(() => setIsConnecting(false), 2000);
    }
  };

  // Connected state
  if (authenticated && activeWallet) {
    if (showDisconnect) {
      return (
        <button
          type="button"
          onClick={() => logout()}
          className={`h-12 w-full px-4 rounded-[20px] bg-[#FFE2E5] hover:bg-[#ffd1d6] text-[#E5484D] font-display font-extrabold text-sm border-2 border-[#0B0B14] shadow-[0_3px_0_#0B0B14] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer ${className}`}
        >
          <span>Disconnect Wallet</span>
        </button>
      );
    }

    const addr = activeWallet.address;
    const truncated = `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleConnect}
          className={`h-10 px-3.5 bg-white border-2 border-[#0B0B14] shadow-[0_2px_0_#0B0B14] rounded-full font-mono text-xs font-bold text-[#0B0B14] flex items-center gap-2 active:translate-y-0.5 transition-transform cursor-pointer ${className}`}
        >
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          <span>{truncated}</span>
        </button>
      </div>
    );
  }

  // Ready / Default state
  return (
    <div className={`flex flex-col gap-2 shrink-0 ${fullWidth ? "w-full" : "w-auto"}`}>
      <Button
        variant={variant}
        size={size}
        onClick={handleConnect}
        className={`whitespace-nowrap shrink-0 ${fullWidth ? "w-full " : ""}${className}`}
      >
        {isConnecting ? (
          <RefreshCw className="w-4 h-4 mr-2 animate-spin shrink-0" />
        ) : (
          <Wallet className="w-4 h-4 mr-2 shrink-0" />
        )}
        <span className="whitespace-nowrap">
          {isConnecting ? "Connecting..." : children || label || "Connect Wallet"}
        </span>
      </Button>

      {errorMessage && (
        <div className="p-2.5 rounded-[14px] bg-[#FFE2E5] border-2 border-[#E5484D] text-[#E5484D] text-xs font-mono font-medium flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span>{errorMessage}</span>
            {isMobileDevice && typeof window !== "undefined" && (
              <div className="flex flex-wrap gap-2 pt-1 border-t border-[#E5484D]/30 mt-1">
                <a
                  href={`https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-bold text-[11px] hover:text-[#0B0B14] flex items-center gap-1"
                >
                  Open in MetaMask <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={`https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-bold text-[11px] hover:text-[#0B0B14] flex items-center gap-1"
                >
                  Open in Coinbase <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
