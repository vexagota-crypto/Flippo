"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "./ui/button";
import { Surface } from "./ui/surface";
import { env } from "@/lib/env";
import {
  Menu,
  X,
  Copy,
  ExternalLink,
  LogOut,
  Check,
  ChevronDown,
} from "lucide-react";

const NAV_LINKS = [
  { name: "Play", href: "/" },
  { name: "Rewards", href: "/rewards" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "History", href: "/history" },
  { name: "Faucet", href: "/faucet" },
];

export function Navbar() {
  const pathname = usePathname();
  const { login, logout, authenticated, ready, user } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = wallets[0] || (user?.wallet?.address ? { address: user.wallet.address } : null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [caCopied, setCaCopied] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  // Handle escape key and outside click for mobile menu and dropdown
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

  // Scroll lock when mobile menu is open
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

  // Fetch token balance when connected
  useEffect(() => {
    if (activeWallet?.address) {
      fetch(`/api/user-stats?address=${activeWallet.address}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setTokenBalance(data.tokenBalance);
          }
        })
        .catch(() => {});
    } else {
      setTokenBalance(null);
    }
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
      ? "CA coming soon"
      : `CA: ${env.client.NEXT_PUBLIC_FLIPPO_TOKEN_ADDRESS.slice(0, 4)}...${env.client.NEXT_PUBLIC_FLIPPO_TOKEN_ADDRESS.slice(-4)}`;

  return (
    <>
      {/* DESKTOP NAVBAR */}
      <header className="fixed top-4 left-0 right-0 z-40 hidden md:flex justify-center px-4 pointer-events-none">
        <nav
          aria-label="Main Navigation"
          className="pointer-events-auto flex items-center justify-between gap-3 px-3 py-2 bg-[#E3F1FF]/90 backdrop-blur-md border-[3px] border-[#0B0B14] shadow-[0_5px_0_#0B0B14] rounded-full h-[60px] max-w-[760px] w-full"
        >
          {/* Left: Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 pl-2 group select-none cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-white border-2 border-[#0B0B14] flex items-center justify-center overflow-hidden shadow-[0_2px_0_#0B0B14] group-hover:scale-105 transition-transform">
              <Image
                src="/assets/logo.png"
                alt="Flippo logo"
                width={36}
                height={36}
                priority
                className="object-contain"
              />
            </div>
            <span className="font-display font-extrabold text-2xl tracking-tighter text-[#0B0B14] lowercase leading-none">
              flippo
            </span>
          </Link>

          {/* Center: Sliding Nav Pills */}
          <div className="flex items-center gap-1 bg-[#F4FAFF] p-1 rounded-full border-2 border-[#0B0B14]">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-1 text-xs font-display font-extrabold transition-colors duration-150 rounded-full select-none cursor-pointer ${
                    isActive ? "text-white" : "text-[#0B0B14] hover:text-[#0C73FE]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-[#0B0B14] rounded-full shadow-[0_2px_0_#0B0B14]"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right: Connect or Wallet Chip */}
          <div className="relative" ref={dropdownRef}>
            {!ready ? (
              <Button variant="pink" size="sm" isLoading className="rounded-full px-4">
                Loading...
              </Button>
            ) : !authenticated ? (
              <Button
                variant="pink"
                size="sm"
                onClick={() => login()}
                className="rounded-full px-4 text-xs font-black shadow-[0_3px_0_#0B0B14]"
              >
                Connect Wallet
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                {/* $FLIPPO Balance Pill */}
                {tokenBalance !== null && (
                  <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-[#0B0B14] rounded-full text-xs font-mono font-bold text-[#0B0B14] shadow-[0_2px_0_#0B0B14]">
                    <span className="text-[#0C73FE]">
                      {tokenBalance.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#0B0B14]/60">$FLIPPO</span>
                  </div>
                )}

                {/* Connected Wallet Button */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#FE2D88] text-[#0B0B14] font-mono text-xs font-bold border-2 border-[#0B0B14] rounded-full shadow-[0_3px_0_#0B0B14] hover:translate-y-[-1px] active:translate-y-[2px] transition-transform cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                  <span>{truncatedAddress}</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            )}

            {/* Wallet Dropdown Menu */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 p-2 bg-white border-[3px] border-[#0B0B14] rounded-[20px] shadow-[0_6px_0_#0B0B14] z-50 flex flex-col gap-1 text-sm font-display font-bold"
                >
                  <div className="px-3 py-2 border-b-2 border-[#0B0B14]/10 mb-1">
                    <span className="text-[10px] font-mono uppercase text-[#0B0B14]/60 block">
                      Connected Wallet
                    </span>
                    <span className="font-mono text-xs font-bold text-[#0B0B14] truncate block">
                      {activeWallet?.address}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-[14px] hover:bg-[#E3F1FF] text-left text-xs text-[#0B0B14] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Copy className="w-4 h-4 text-[#0C73FE]" />
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </header>

      {/* MOBILE NAVBAR */}
      <header className="fixed top-3 left-0 right-0 z-40 flex md:hidden justify-center px-3 pointer-events-none">
        <nav
          aria-label="Mobile Navigation"
          className="pointer-events-auto flex items-center justify-between px-3 bg-[#E3F1FF]/95 backdrop-blur-md border-[3px] border-[#0B0B14] shadow-[0_4px_0_#0B0B14] rounded-full h-[56px] w-full"
        >
          {/* Logo & Wordmark */}
          <Link href="/" className="flex items-center gap-2 select-none">
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
            <span className="font-display font-extrabold text-xl text-[#0B0B14] lowercase leading-none">
              flippo
            </span>
          </Link>

          {/* Right: Connect + 44px Hamburger */}
          <div className="flex items-center gap-2">
            {!authenticated ? (
              <Button
                variant="pink"
                size="sm"
                onClick={() => login()}
                className="rounded-full px-3 text-xs h-9"
              >
                Connect
              </Button>
            ) : (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FE2D88] text-[#0B0B14] font-mono text-xs font-bold border-2 border-[#0B0B14] rounded-full shadow-[0_2px_0_#0B0B14]"
              >
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                <span>{truncatedAddress}</span>
              </button>
            )}

            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileMenuOpen(true)}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white border-2 border-[#0B0B14] shadow-[0_3px_0_#0B0B14] active:translate-y-1 transition-transform cursor-pointer"
            >
              <Menu className="w-5 h-5 text-[#0B0B14]" />
            </button>
          </div>
        </nav>
      </header>

      {/* MOBILE SHEET MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Rounded 32px Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="absolute inset-x-3 bottom-4 p-5 bg-white border-[3px] border-[#0B0B14] shadow-[0_8px_0_#0B0B14] rounded-[32px] flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#0B0B14]/10">
                <div className="flex items-center gap-2">
                  <Image
                    src="/assets/logo.png"
                    alt="Flippo"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                  <span className="font-display font-extrabold text-xl text-[#0B0B14]">
                    flippo menu
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#E3F1FF] border-2 border-[#0B0B14] active:scale-95 cursor-pointer"
                >
                  <X className="w-5 h-5 text-[#0B0B14]" />
                </button>
              </div>

              {/* 56px Navigation Rows */}
              <div className="flex flex-col gap-2">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`h-14 px-4 flex items-center justify-between rounded-[20px] border-2 border-[#0B0B14] font-display font-extrabold text-base transition-transform active:translate-y-1 ${
                        isActive
                          ? "bg-[#0B0B14] text-white shadow-[0_3px_0_#FE2D88]"
                          : "bg-[#F4FAFF] text-[#0B0B14] shadow-[0_3px_0_#0B0B14]"
                      }`}
                    >
                      <span>{link.name}</span>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-[#FE2D88]" />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* CA Chip */}
              <button
                type="button"
                onClick={handleCopyCa}
                className="h-11 px-3 bg-[#E3F1FF] border-2 border-[#0B0B14] rounded-full flex items-center justify-between text-xs font-mono font-bold text-[#0B0B14] shadow-[0_2px_0_#0B0B14] cursor-pointer"
              >
                <span>{caDisplay}</span>
                <span className="flex items-center gap-1 text-[11px] text-[#0C73FE]">
                  {caCopied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                  {caCopied ? "Copied" : "Copy"}
                </span>
              </button>

              {/* Full Width Connect / Disconnect */}
              {!authenticated ? (
                <Button
                  variant="pink"
                  size="lg"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    login();
                  }}
                  className="w-full text-base font-black"
                >
                  Connect Wallet
                </Button>
              ) : (
                <div className="flex flex-col gap-2 pt-2 border-t-2 border-[#0B0B14]/10">
                  <div className="text-xs font-mono text-[#0B0B14]/70 truncate">
                    Wallet: {activeWallet?.address}
                  </div>
                  <Button
                    variant="white"
                    size="md"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-[#E5484D] border-2"
                  >
                    Disconnect
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
