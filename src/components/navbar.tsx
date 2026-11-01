"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ConnectButton } from "./connect-button";
import { env } from "@/lib/env";
import { robinhoodChain } from "@/lib/chains";
import { Z_INDEX } from "@/styles/z-index";
import {
  Menu,
  X,
  Copy,
  ExternalLink,
  LogOut,
  Check,
  ChevronDown,
  ChevronRight,
  Coins,
  Trophy,
  History,
  BookOpen,
  Gamepad2,
  Sparkles,
} from "lucide-react";

const NAV_LINKS = [
  { name: "Play", href: "/", icon: Gamepad2 },
  { name: "Rewards", href: "/rewards", icon: Sparkles },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { name: "History", href: "/history", icon: History },
  { name: "How it works", href: "/how-it-works", icon: BookOpen },
];

export function Navbar() {
  const pathname = usePathname();
  const { logout, authenticated, ready, user } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = wallets[0] || (user?.wallet?.address ? { address: user.wallet.address } : null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [caCopied, setCaCopied] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [userTier, setUserTier] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dev tap debugger for ?debug=1
  const [debugLog, setDebugLog] = useState<string | null>(null);
  const isDebug =
    process.env.NODE_ENV !== "production" &&
    typeof window !== "undefined" &&
    window.location.search.includes("debug=1");

  useEffect(() => {
    if (!isDebug) return;
    const handleTouch = (e: TouchEvent) => {
      const touch = e.touches[0] || e.changedTouches[0];
      if (touch) {
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const tag = el ? `${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).slice(0, 20)}` : ""}` : "null";
        setDebugLog(`Tap at (${Math.round(touch.clientX)}, ${Math.round(touch.clientY)}) on <${tag}>`);
      }
    };
    window.addEventListener("touchend", handleTouch, { passive: true });
    return () => window.removeEventListener("touchend", handleTouch);
  }, [isDebug]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  // Handle escape key and outside click
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setDropdownOpen(false);
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Scroll lock when mobile menu is open - safely cleans up
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Fetch token balance & tier when connected
  useEffect(() => {
    if (!activeWallet?.address) {
      setTokenBalance(null);
      setUserTier(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    fetch(`/api/user-stats?address=${activeWallet.address}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTokenBalance(data.tokenBalance);
          setUserTier(data.currentTier?.name || null);
        }
      })
      .catch(() => {})
      .finally(() => clearTimeout(timer));

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [activeWallet?.address]);

  const handleCopyAddress = () => {
    if (activeWallet?.address) {
      navigator.clipboard.writeText(activeWallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCa = () => {
    const ca = env.client.NEXT_PUBLIC_FLIPPO_TOKEN_ADDRESS;
    navigator.clipboard.writeText(ca === "COMING_SOON" ? "COMING SOON" : ca);
    setCaCopied(true);
    setTimeout(() => setCaCopied(false), 2000);
  };

  const truncatedAddress = activeWallet?.address
    ? `${activeWallet.address.slice(0, 5)}...${activeWallet.address.slice(-4)}`
    : "";

  const caDisplay =
    env.client.NEXT_PUBLIC_FLIPPO_TOKEN_ADDRESS === "COMING_SOON"
      ? "CA: Soon"
      : `CA: ${env.client.NEXT_PUBLIC_FLIPPO_TOKEN_ADDRESS.slice(0, 4)}...${env.client.NEXT_PUBLIC_FLIPPO_TOKEN_ADDRESS.slice(-4)}`;

  return (
    <>
      {/* DEV TAP DEBUG OVERLAY (Only behind ?debug=1 in development) */}
      {isDebug && debugLog && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-3 left-3 z-[100] bg-black/90 text-white font-mono text-[11px] p-2 rounded-lg border border-white/20 shadow-lg max-w-[280px] pointer-events-none"
        >
          {debugLog}
        </div>
      )}

      {/* DESKTOP NAVBAR */}
      <header className={`fixed top-4 left-0 right-0 ${Z_INDEX.nav} hidden md:flex justify-center px-4 pointer-events-none`}>
        <nav
          aria-label="Main Navigation"
          className="pointer-events-auto flex items-center justify-between gap-3 lg:gap-4 px-3.5 py-2 bg-[#E3F1FF]/95 backdrop-blur-md border-[3px] border-[#0B0B14] shadow-[0_5px_0_#0B0B14] rounded-full h-[60px] max-w-[1040px] w-full"
        >
          {/* Left: Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 lg:gap-2.5 pl-1 lg:pl-2 group select-none cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 rounded-full bg-white border-2 border-[#0B0B14] flex items-center justify-center overflow-hidden shadow-[0_2px_0_#0B0B14] group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/assets/logo.png"
                alt="Flippo"
                width={36}
                height={36}
                priority
                className="object-contain"
              />
            </div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-[#0B0B14] lowercase leading-none whitespace-nowrap">
              flippo
            </span>
          </Link>

          {/* Center Links (Play, Rewards, Leaderboard, History, How it works) */}
          <div className="flex items-center gap-0.5 lg:gap-1 bg-white/80 p-1 rounded-full border-2 border-[#0B0B14] shadow-[0_2px_0_#0B0B14] shrink-0 h-11">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 lg:px-4 py-1.5 rounded-full font-display font-bold text-xs transition-all select-none whitespace-nowrap shrink-0 leading-none flex items-center ${
                    isActive
                      ? "bg-[#FE2D88] text-white shadow-[0_2px_0_#0B0B14]"
                      : "text-[#0B0B14] hover:bg-[#E3F1FF]"
                  }`}
                >
                  <span className="whitespace-nowrap shrink-0">{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right: CA Chip + Connect Button */}
          <div className="flex items-center gap-2 relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={handleCopyCa}
              className="hidden xl:flex items-center gap-1.5 h-10 px-3.5 bg-white/80 hover:bg-white border-2 border-[#0B0B14] rounded-full text-xs font-mono font-bold text-[#0B0B14] shadow-[0_2px_0_#0B0B14] active:translate-y-0.5 transition-transform cursor-pointer whitespace-nowrap shrink-0"
              title="Copy Contract Address"
            >
              <span className="whitespace-nowrap shrink-0">{caDisplay}</span>
              {caCopied ? (
                <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 opacity-60 shrink-0" />
              )}
            </button>

            {!authenticated ? (
              <div className="shrink-0">
                <ConnectButton size="pill" variant="pink" />
              </div>
            ) : (
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 h-10 px-3.5 bg-white border-2 border-[#0B0B14] shadow-[0_3px_0_#0B0B14] rounded-full font-mono text-xs font-bold text-[#0B0B14] hover:bg-[#F4FAFF] active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse shrink-0" />
                  <span className="whitespace-nowrap">{truncatedAddress}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 p-2.5 bg-white border-[3px] border-[#0B0B14] rounded-[24px] shadow-[0_6px_0_#0B0B14] z-50 flex flex-col gap-1.5 text-sm font-display font-bold">
                    <div className="px-3 py-2 border-b-2 border-[#0B0B14]/10 flex flex-col">
                      <span className="text-[10px] font-mono text-[#0B0B14]/60 uppercase tracking-wider">
                        Robinhood Chain
                      </span>
                      <span className="font-mono text-xs text-[#0B0B14] break-all">
                        {activeWallet?.address}
                      </span>
                      {tokenBalance !== null && (
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#0B0B14]/5 text-xs">
                          <span className="text-[#0B0B14]/70">Holdings:</span>
                          <span className="font-mono font-bold text-[#0C73FE]">
                            {tokenBalance.toLocaleString()} $FLIPPO
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-[14px] hover:bg-[#E3F1FF] text-left text-xs text-[#0B0B14] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Copy className="w-4 h-4 text-[#0B0B14]" />
                        Copy Address
                      </span>
                      {copied && <Check className="w-3.5 h-3.5 text-[#16A34A]" />}
                    </button>

                    <a
                      href={`${env.client.NEXT_PUBLIC_RH_EXPLORER_URL}/address/${activeWallet?.address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-[14px] hover:bg-[#E3F1FF] text-left text-xs text-[#0B0B14] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-[#0C73FE]" />
                      View on Explorer
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-[14px] hover:bg-[#FFE2E5] text-left text-xs text-[#E5484D] transition-colors mt-1 border-t-2 border-[#0B0B14]/10 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* MOBILE NAVBAR: 56px height, width calc(100% - 24px), NO Connect button */}
      <header className={`fixed top-3 left-0 right-0 ${Z_INDEX.nav} flex md:hidden justify-center px-3 pointer-events-none`}>
        <nav
          aria-label="Mobile Navigation"
          className="pointer-events-auto flex items-center justify-between px-3.5 bg-[#E3F1FF]/95 backdrop-blur-md border-[3px] border-[#0B0B14] shadow-[0_4px_0_#0B0B14] rounded-full h-[56px] w-[calc(100%-24px)] max-w-lg"
        >
          {/* Logo & Wordmark */}
          <Link href="/" className="flex items-center gap-2 select-none active:scale-95 transition-transform">
            <div className="w-8 h-8 rounded-full bg-white border-2 border-[#0B0B14] flex items-center justify-center overflow-hidden shadow-[0_2px_0_#0B0B14]">
              <Image
                src="/assets/logo.png"
                alt="Flippo"
                width={32}
                height={32}
                priority
                className="object-contain"
              />
            </div>
            <span className="font-display font-black text-xl text-[#0B0B14] lowercase leading-none">
              flippo
            </span>
          </Link>

          {/* Right: 44px Hamburger button ONLY (No Connect button on mobile nav) */}
          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu-panel"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-white border-2 border-[#0B0B14] shadow-[0_3px_0_#0B0B14] active:translate-y-1 transition-all cursor-pointer"
            style={{ touchAction: "manipulation" }}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-[#0B0B14] pointer-events-none" />
            ) : (
              <Menu className="w-5 h-5 text-[#0B0B14] pointer-events-none" />
            )}
          </button>
        </nav>
      </header>

      {/* MOBILE SHEET MENU: Renders ONLY when open */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu-panel"
          className={`fixed inset-0 ${Z_INDEX.menu} md:hidden flex flex-col justify-end p-3`}
        >
          {/* Backdrop (Tapping closes menu) */}
          <button
            type="button"
            aria-label="Close menu backdrop"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/45 backdrop-blur-xs w-full h-full border-none cursor-default"
          />

          {/* Rounded 32px Sheet */}
          <div
            className="relative z-10 w-full max-h-[85vh] overflow-y-auto p-5 bg-[#E3F1FF] border-[3px] border-[#0B0B14] shadow-[0_8px_0_#0B0B14] rounded-[32px] flex flex-col gap-4 animate-in slide-in-from-bottom-6 duration-200"
            style={{ touchAction: "manipulation" }}
          >
            {/* Header: Title + Close Button */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#0B0B14]/15">
              <div className="flex items-center gap-2">
                <Image
                  src="/assets/logo.png"
                  alt="Flippo"
                  width={28}
                  height={28}
                  className="object-contain"
                />
                <span className="font-display font-black text-xl text-[#0B0B14] lowercase">
                  flippo
                </span>
              </div>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 rounded-full bg-white border-2 border-[#0B0B14] flex items-center justify-center shadow-[0_2px_0_#0B0B14] active:translate-y-0.5 cursor-pointer"
              >
                <X className="w-4 h-4 text-[#0B0B14]" />
              </button>
            </div>

            {/* 1. Network Chip */}
            <div className="flex items-center justify-between px-3.5 py-2 bg-white/80 rounded-2xl border-2 border-[#0B0B14] shadow-[0_2px_0_#0B0B14]">
              <span className="font-mono text-xs font-bold text-[#0B0B14]/70">
                Network:
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-black text-[#0C73FE]">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                {robinhoodChain.name} ({robinhoodChain.id})
              </span>
            </div>

            {/* 2. Wallet Status Area */}
            {authenticated && activeWallet ? (
              <div className="p-3.5 bg-white rounded-2xl border-2 border-[#0B0B14] shadow-[0_3px_0_#0B0B14] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
                    <span className="font-mono text-xs font-bold text-[#0B0B14]">
                      {truncatedAddress}
                    </span>
                  </div>
                  {userTier && (
                    <span className="px-2 py-0.5 bg-[#FFE66B] border border-[#0B0B14] rounded-full text-[10px] font-mono font-black uppercase text-[#0B0B14]">
                      {userTier}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#0B0B14]/10 text-xs">
                  <span className="font-mono text-[#0B0B14]/70">Holdings:</span>
                  <span className="font-mono font-black text-[#0C73FE]">
                    {tokenBalance !== null ? `${tokenBalance.toLocaleString()} $FLIPPO` : "..."}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white/70 rounded-2xl border-2 border-[#0B0B14] text-center">
                <span className="text-xs font-body font-semibold text-[#0B0B14]/80">
                  Connect your wallet to flip and claim ETH rewards
                </span>
              </div>
            )}

            {/* 3. Navigation Rows: 56px each with Lucide Icon and Arrow */}
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      setTimeout(() => setMobileMenuOpen(false), 50);
                    }}
                    className={`h-14 min-h-[56px] px-4 rounded-[20px] border-2 border-[#0B0B14] flex items-center justify-between font-display font-extrabold text-base transition-all active:translate-y-0.5 select-none ${
                      isActive
                        ? "bg-[#FE2D88] text-white shadow-[0_3px_0_#0B0B14]"
                        : "bg-white text-[#0B0B14] shadow-[0_3px_0_#0B0B14] hover:bg-[#F4FAFF]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-[#0C73FE]"}`} />
                      <span>{link.name}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isActive ? "text-white" : "text-[#0B0B14]/40"}`} />
                  </Link>
                );
              })}
            </div>

            {/* 4. $FLIPPO CA Copy Chip */}
            <button
              type="button"
              onClick={handleCopyCa}
              className="h-11 px-4 bg-white hover:bg-[#F4FAFF] border-2 border-[#0B0B14] rounded-full flex items-center justify-between text-xs font-mono font-bold text-[#0B0B14] shadow-[0_3px_0_#0B0B14] active:translate-y-0.5 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-[#0C73FE]" />
                {caDisplay}
              </span>
              {caCopied ? (
                <span className="text-[11px] font-bold text-[#16A34A] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Copied!
                </span>
              ) : (
                <Copy className="w-3.5 h-3.5 opacity-60" />
              )}
            </button>

            {/* 5. FULL-WIDTH Connect / Disconnect Wallet Button at Bottom */}
            <div className="pt-1">
              <ConnectButton
                size="lg"
                variant="pink"
                showDisconnect={true}
                className="w-full min-h-[56px] h-14 font-display font-black text-base rounded-[24px]"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
