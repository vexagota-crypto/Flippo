"use client";

import React, { useEffect, useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { mainnet, sepolia, base, arbitrum, polygon, optimism } from "viem/chains";
import { robinhoodChain } from "@/lib/chains";
import { env } from "@/lib/env";
import { Z_INDEX } from "@/styles/z-index";
import { X, AlertTriangle } from "lucide-react";

// Universal polyfill for crypto.randomUUID in non-secure mobile browser contexts (e.g. Android Chrome over HTTP)
if (typeof window !== "undefined") {
  if (!window.crypto) {
    (window as any).crypto = {};
  }
  if (typeof window.crypto.randomUUID !== "function") {
    window.crypto.randomUUID = function () {
      if (typeof window.crypto.getRandomValues === "function") {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c: any) =>
          (
            +c ^
            (window.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
          ).toString(16)
        ) as `${string}-${string}-${string}-${string}-${string}`;
      }
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }) as `${string}-${string}-${string}-${string}-${string}`;
    };
  }
}

export function AppPrivyProvider({ children }: { children: React.ReactNode }) {
  const [isSecure, setIsSecure] = useState(true);
  const [showInsecureBanner, setShowInsecureBanner] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if page is running in a secure context (https or localhost)
      if (window.isSecureContext === false && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        setIsSecure(false);
      }
    }
  }, []);

  return (
    <div className="contents">
      {!isSecure && showInsecureBanner && (
        <div
          key="insecure-banner"
          role="alert"
          className="fixed bottom-3 left-3 right-3 p-3 bg-[#FFE66B] text-[#0B0B14] border-2 border-[#0B0B14] shadow-[0_4px_0_#0B0B14] rounded-[18px] text-xs font-mono font-bold flex items-center justify-between gap-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FE2D88] shrink-0" />
            <span>Insecure HTTP: Open over HTTPS or tunnel for wallet features.</span>
          </div>
          <button
            type="button"
            onClick={() => setShowInsecureBanner(false)}
            className="p-1 rounded-full bg-white border border-[#0B0B14] cursor-pointer hover:bg-[#F4FAFF] active:scale-95 shrink-0"
            aria-label="Dismiss warning"
          >
            <X className="w-3.5 h-3.5 text-[#0B0B14]" />
          </button>
        </div>
      )}
      <PrivyProvider
        key="privy-provider"
        appId={env.client.NEXT_PUBLIC_PRIVY_APP_ID}
        config={{
          appearance: {
            theme: "light",
            accentColor: "#FE2D88",
            logo: "/assets/logo.png",
            showWalletLoginFirst: true,
            walletList: [
              "metamask",
              "coinbase_wallet",
              "rainbow",
              "wallet_connect",
              "rabby_wallet",
            ],
          },
          loginMethods: ["wallet"],
          defaultChain: robinhoodChain,
          supportedChains: [robinhoodChain, mainnet, sepolia, base, arbitrum, polygon, optimism],
          embeddedWallets: {
            ethereum: {
              createOnLogin: "off",
            },
          },
          walletConnectCloudProjectId: env.client.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
        }}
      >
        {children}
      </PrivyProvider>
    </div>
  );
}
