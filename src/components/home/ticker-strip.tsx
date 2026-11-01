"use client";

import React, { useEffect, useState } from "react";
import { Flame, Trophy, Users, Coins, Zap } from "lucide-react";

interface RecentFlipItem {
  id: string;
  walletAddress: string;
  call: string;
  result: string;
  tierMultiplier: number;
  rewardEth: number;
  calledCorrectly: number;
}

export function TickerStrip() {
  const [stats, setStats] = useState<{
    totalFlips: number;
    totalEthPaid: number;
    activePlayersToday: number;
    lastBigWin: { wallet: string; amount: number; time: number } | null;
  } | null>(null);
  const [recentFlips, setRecentFlips] = useState<RecentFlipItem[]>([]);

  const loadData = () => {
    fetch("/api/protocol-stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
        }
      })
      .catch(() => {});

    fetch("/api/history?limit=5")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.flips)) {
          setRecentFlips(data.flips);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const items = [
    {
      icon: <Coins className="w-4 h-4 text-[#FFE66B]" />,
      label: "TOTAL FLIPS",
      value: stats?.totalFlips !== undefined ? stats.totalFlips.toLocaleString() : "0",
    },
    {
      icon: <Trophy className="w-4 h-4 text-[#FE2D88]" />,
      label: "ETH PAID OUT",
      value: stats?.totalEthPaid !== undefined ? `${stats.totalEthPaid} ETH` : "0 ETH",
    },
    {
      icon: <Users className="w-4 h-4 text-[#0C73FE]" />,
      label: "ACTIVE PLAYERS TODAY",
      value: stats?.activePlayersToday !== undefined ? stats.activePlayersToday.toLocaleString() : "0",
    },
    ...(stats?.lastBigWin
      ? [
          {
            icon: <Flame className="w-4 h-4 text-[#FFE66B]" />,
            label: "LAST BIG WIN",
            value: `${stats.lastBigWin.amount} ETH by ${stats.lastBigWin.wallet.slice(0, 5)}...${stats.lastBigWin.wallet.slice(-4)}`,
          },
        ]
      : []),
    ...recentFlips.map((flip) => ({
      icon: <Zap className="w-4 h-4 text-[#16A34A]" />,
      label: `FLIP: ${flip.walletAddress.slice(0, 5)}...${flip.walletAddress.slice(-4)}`,
      value: `${flip.result.toUpperCase()} (${flip.tierMultiplier}x • +${flip.rewardEth} ETH)`,
    })),
  ];

  return (
    <div
      aria-label="Live protocol ticker"
      className="w-full bg-[#0B0B14] border-y-[3px] border-[#0B0B14] py-3 overflow-hidden select-none group"
    >
      <div className="flex w-max animate-ticker group-hover:[animation-play-state:paused]">
        {/* Render twice for continuous infinite seamless ticker loop */}
        {[...Array(2)].map((_, loopIdx) => (
          <div key={loopIdx} className="flex items-center gap-8 px-4 shrink-0">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5 font-mono text-xs sm:text-sm font-bold text-[#F4FAFF]">
                <span className="p-1 rounded-md bg-white/10 shrink-0">{item.icon}</span>
                <span className="text-[#F4FAFF]/70 tracking-wider text-[11px] uppercase">
                  {item.label}:
                </span>
                <span className="text-[#FFE66B] font-extrabold tabular-nums">
                  {item.value}
                </span>
                <span className="text-white/20 ml-4">•</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
