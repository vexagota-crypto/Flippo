import type { Metadata, Viewport } from "next";
import { bricolage, instrumentSerif, inter, geistMono, archivo } from "@/styles/fonts";
import { AppPrivyProvider } from "@/providers/privy-provider";
import { NetworkGuard } from "@/components/network-guard";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#F4FAFF",
};

export const metadata: Metadata = {
  title: "Flippo ($FLIPPO) — Flip the coin. Earn the ETH.",
  description:
    "A playful, premium web3 coin flip game on Robinhood Chain. Connect your wallet, flip the coin, and earn ETH rewards multiplied by your $FLIPPO holdings.",
  icons: {
    icon: "/assets/logo.png",
    apple: "/assets/logo.png",
  },
  openGraph: {
    title: "Flippo ($FLIPPO) — Flip the coin. Earn the ETH.",
    description: "Connect your wallet, flip the coin, earn ETH rewards. Robinhood Chain.",
    images: [{ url: "/assets/logo.png", width: 1024, height: 1024, alt: "Flippo Coin" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${instrumentSerif.variable} ${inter.variable} ${geistMono.variable} ${archivo.variable}`}
    >
      <body className="min-h-screen bg-[#F4FAFF] text-[#0B0B14] font-body antialiased selection:bg-[#FE2D88] selection:text-white flex flex-col">
        <AppPrivyProvider>
          {children}
          <NetworkGuard />
        </AppPrivyProvider>
      </body>
    </html>
  );
}
