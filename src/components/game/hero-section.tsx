"use client";

import React, { useState } from "react";
import { Coin3D } from "./coin-3d";
import { PlayPanel } from "./play-panel";
import {
  SparkleSticker,
  StarSticker,
  HeartSticker,
  CrownSticker,
  LightningSticker,
  MiniCoinSticker,
} from "@/components/ui/stickers";

export function HeroSection() {
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipResult, setFlipResult] = useState<"heads" | "tails" | null>(null);

  const handleFlipStart = () => {
    setIsFlipping(true);
    setFlipResult(null);
  };

  const handleFlipComplete = (result: "heads" | "tails") => {
    setIsFlipping(false);
    setFlipResult(result);
  };

  return (
    <section className="relative w-full pt-24 pb-14 px-4 sm:px-6 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#F4FAFF] via-[#EAF4FE] to-[#F4FAFF]">
      {/* SOFT SKY WASH ACCENT (NO GRIDLINES, NO WAVY LINES) */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[550px] bg-gradient-to-tr from-[#BFE0FF]/45 to-[#FFC2DA]/30 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* FLOATING SVG STICKERS (INK OUTLINES, POINTER EVENTS NONE, MAX 6 DESKTOP, 3 MOBILE) */}
      <div className="absolute inset-0 max-w-5xl mx-auto pointer-events-none -z-0 overflow-hidden" aria-hidden="true">
        {/* Top Left Sparkle (Desktop & Mobile) */}
        <div className="absolute top-28 left-4 sm:left-12 animate-float-1">
          <SparkleSticker size={36} />
        </div>

        {/* Top Right Star (Desktop & Mobile) */}
        <div className="absolute top-24 right-4 sm:right-14 animate-float-2">
          <StarSticker size={42} />
        </div>

        {/* Mid Left Crown (Desktop only) */}
        <div className="hidden sm:block absolute top-72 left-8 animate-float-3">
          <CrownSticker size={40} />
        </div>

        {/* Mid Right Lightning (Desktop only) */}
        <div className="hidden sm:block absolute top-80 right-10 animate-float-1">
          <LightningSticker size={38} />
        </div>

        {/* Bottom Left Mini Coin (Desktop & Mobile) */}
        <div className="absolute bottom-28 left-6 sm:left-16 animate-float-2">
          <MiniCoinSticker size={34} />
        </div>

        {/* Bottom Right Heart (Desktop only) */}
        <div className="hidden sm:block absolute bottom-36 right-8 animate-float-3">
          <HeartSticker size={36} />
        </div>
      </div>

      {/* HEADER CONTENT */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto z-10 mb-6">
        {/* Tilted Tag */}
        <div className="inline-block transform -rotate-2 hover:rotate-0 transition-transform mb-3">
          <span className="px-3.5 py-1 bg-[#FFE66B] text-[#0B0B14] font-mono text-xs font-black tracking-tight rounded-full border-2 border-[#0B0B14] shadow-[0_2px_0_#0B0B14] select-none">
            flip. earn. repeat.
          </span>
        </div>

        {/* Giant Headline */}
        <h1 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl text-[#0B0B14] tracking-tight leading-[1.08] select-none">
          Flip the coin.
          <br />
          <span>Earn the </span>
          <span className="inline-block relative px-3 py-0.5 mx-1 bg-[#FE2D88] text-white rounded-[14px] border-2 border-[#0B0B14] shadow-[0_3px_0_#0B0B14] -rotate-1">
            <span className="font-accent italic text-3xl sm:text-5xl md:text-6xl font-normal tracking-wide">
              ETH.
            </span>
          </span>
        </h1>

        <p className="mt-3.5 text-sm sm:text-base text-[#0B0B14]/80 max-w-md mx-auto font-body font-medium">
          Robinhood Chain&apos;s provably fair coin arcade. Hold $FLIPPO to multiply every flip reward up to 5x.
        </p>
      </div>

      {/* CENTERPIECE 3D COIN */}
      <div className="w-full flex justify-center items-center z-10 my-2">
        <Coin3D isFlipping={isFlipping} result={flipResult} />
      </div>

      {/* PLAY PANEL */}
      <div className="w-full flex justify-center z-10 mt-2 px-2">
        <PlayPanel
          onFlipStart={handleFlipStart}
          onFlipComplete={handleFlipComplete}
          isFlipping={isFlipping}
        />
      </div>
    </section>
  );
}
