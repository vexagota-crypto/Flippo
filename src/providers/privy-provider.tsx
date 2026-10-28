"use client";

import React, { useEffect, useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { robinhoodChain } from "@/lib/chains";
import { env } from "@/lib/env";

export function AppPrivyProvider({ children }: { children: React.ReactNode }) {
  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if page is running in a secure context (https or localhost)
      if (window.isSecureContext === false && window.location.hostname !== "localhost") {
        setIsSecure(false);
      }
    }
  }, []);

  return (
    <PrivyProvider
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
        supportedChains: [robinhoodChain],
        walletConnectCloudProjectId: env.client.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      }}
    >
      {!isSecure && (
        <div className="bg-[#E5484D] text-white px-4 py-2 text-center text-xs font-bold font-mono tracking-tight fixed top-0 left-0 right-0 z-50">
          ⚠️ Insecure context detected. Mobile wallets require HTTPS or a tunnel (e.g. ngrok/cloudflared) to connect.
        </div>
      )}
      {children}
    </PrivyProvider>
  );
}
