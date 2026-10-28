"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { env } from "@/lib/env";
import { Copy, Check, ArrowUpRight } from "lucide-react";

export function Footer() {
  const [caCopied, setCaCopied] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleCopyCa = () => {
    const ca = env.client.NEXT_PUBLIC_FLIPPO_TOKEN_ADDRESS;
    navigator.clipboard.writeText(ca === "COMING_SOON" ? "COMING SOON" : ca);
    setCaCopied(true);
    setTimeout(() => setCaCopied(false), 2000);
  };

  const caDisplay =
    env.client.NEXT_PUBLIC_FLIPPO_TOKEN_ADDRESS === "COMING_SOON"
      ? "CA coming soon"
      : `CA: ${env.client.NEXT_PUBLIC_FLIPPO_TOKEN_ADDRESS.slice(0, 6)}...${env.client.NEXT_PUBLIC_FLIPPO_TOKEN_ADDRESS.slice(-4)}`;

  return (
    <footer className="w-full px-3 sm:px-6 pt-10 pb-6 max-w-7xl mx-auto">
      {/* HUGE ROUNDED CONTAINER */}
      <div className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] border-[3px] border-[#0B0B14] shadow-[0_8px_0_#0B0B14] bg-gradient-to-br from-[#051A7A] via-[#0A2BB5] to-[#0C73FE] text-white p-6 sm:p-12 flex flex-col gap-10">
        {/* TOP ROW: Logo, CA Copy Chip, Small Cream Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white border-2 border-[#0B0B14] flex items-center justify-center shadow-[0_2px_0_#0B0B14] overflow-hidden">
              <Image
                src="/assets/logo.png"
                alt="Flippo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="font-display font-black text-2xl tracking-tight text-white lowercase">
              flippo
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* CA Copy Chip */}
            <button
              type="button"
              onClick={handleCopyCa}
              className="h-10 px-4 bg-white/10 hover:bg-white/20 border-2 border-white/40 rounded-full flex items-center gap-2 text-xs font-mono font-bold text-white transition-colors cursor-pointer"
            >
              <span>{caDisplay}</span>
              {caCopied ? (
                <Check className="w-3.5 h-3.5 text-[#FFE66B]" />
              ) : (
                <Copy className="w-3.5 h-3.5 opacity-80" />
              )}
            </button>

            {/* Small Cream Button */}
            <a
              href={env.client.NEXT_PUBLIC_DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="h-10 px-4 bg-[#FFE66B] hover:bg-[#ffea85] text-[#0B0B14] border-2 border-[#0B0B14] rounded-full font-display font-extrabold text-xs shadow-[0_3px_0_#0B0B14] flex items-center gap-1.5 transition-transform active:translate-y-0.5"
            >
              <span>Docs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* MULTI-COLUMN LINK GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          {/* Column 1: Play */}
          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-[11px] font-black uppercase tracking-wider text-[#BFE0FF]">
              Play
            </span>
            <Link href="/" className="hover:text-[#FFE66B] transition-colors">
              Flip Coin
            </Link>
            <Link href="/rewards" className="hover:text-[#FFE66B] transition-colors">
              Multiplier Tiers
            </Link>
            <Link href="/leaderboard" className="hover:text-[#FFE66B] transition-colors">
              Hall of Flips
            </Link>
            <Link href="/faucet" className="hover:text-[#FFE66B] transition-colors">
              Testnet Faucet
            </Link>
          </div>

          {/* Column 2: Rewards */}
          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-[11px] font-black uppercase tracking-wider text-[#BFE0FF]">
              Rewards
            </span>
            <Link href="/rewards" className="hover:text-[#FFE66B] transition-colors">
              Tier Breakdown
            </Link>
            <Link href="/history" className="hover:text-[#FFE66B] transition-colors">
              Claim Ledger
            </Link>
            <Link href="/history" className="hover:text-[#FFE66B] transition-colors">
              Verify Fairness
            </Link>
          </div>

          {/* Column 3: Community */}
          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-[11px] font-black uppercase tracking-wider text-[#BFE0FF]">
              Community
            </span>
            <a
              href={env.client.NEXT_PUBLIC_TWITTER_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#FFE66B] transition-colors flex items-center gap-1"
            >
              <span>Twitter / X</span>
              <ArrowUpRight className="w-3 h-3 opacity-60" />
            </a>
            <a
              href={env.client.NEXT_PUBLIC_TELEGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#FFE66B] transition-colors flex items-center gap-1"
            >
              <span>Telegram</span>
              <ArrowUpRight className="w-3 h-3 opacity-60" />
            </a>
            <a
              href={env.client.NEXT_PUBLIC_RH_EXPLORER_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#FFE66B] transition-colors flex items-center gap-1"
            >
              <span>Robinhood Explorer</span>
              <ArrowUpRight className="w-3 h-3 opacity-60" />
            </a>
          </div>

          {/* Column 4: Legal & System */}
          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-[11px] font-black uppercase tracking-wider text-[#BFE0FF]">
              Protocol
            </span>
            <Link href="/terms" className="hover:text-[#FFE66B] transition-colors">
              Terms of Play
            </Link>
            <Link href="/privacy" className="hover:text-[#FFE66B] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/admin" className="hover:text-[#FFE66B] transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>

        {/* FULL-WIDTH WHITE ROUNDED BAR LINKING TO GAME */}
        <Link
          href="/"
          className="w-full py-4 px-6 bg-white hover:bg-[#F4FAFF] text-[#0B0B14] border-[3px] border-[#0B0B14] shadow-[0_5px_0_#0B0B14] rounded-[24px] text-center font-display font-black text-xl sm:text-2xl tracking-tight transition-transform active:translate-y-1 block select-none cursor-pointer"
        >
          FLIP THE COIN 🪙
        </Link>

        {/* GIANT WORDMARK WITH PEEKING COIN STICKER */}
        <div className="relative w-full flex justify-center items-end select-none pt-4 pb-0 -mb-6 sm:-mb-12 overflow-hidden">
          {/* Peeking Coin Sticker */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 -translate-y-2 z-10 w-16 h-16 sm:w-24 sm:h-24">
            <Image
              src="/assets/coin-heads.png"
              alt="Peeking coin"
              width={96}
              height={96}
              className="object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] animate-float-1"
            />
          </div>

          <div className="font-wordmark text-[17vw] leading-[0.75] font-black text-white/95 tracking-tighter uppercase pointer-events-none select-none text-center truncate">
            flippo
          </div>
        </div>

        {/* BOTTOM ROW: (c) year, Disclaimer, Privacy, Terms */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-white/70 pt-6 border-t border-white/20">
          <span>&copy; {currentYear} Flippo Protocol. All rights reserved.</span>
          <span className="text-center font-bold text-[#FFE66B]">
            Rewards are not guaranteed &bull; Play responsibly
          </span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
