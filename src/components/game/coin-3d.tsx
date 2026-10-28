"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

interface Coin3DProps {
  isFlipping: boolean;
  result: "heads" | "tails" | null;
  className?: string;
}

export function Coin3D({ isFlipping, result, className = "" }: Coin3DProps) {
  const shouldReduceMotion = useReducedMotion();
  const [rotationY, setRotationY] = useState(0);
  const [isSquashing, setIsSquashing] = useState(false);

  // When a flip is triggered, compute rotation target
  useEffect(() => {
    if (isFlipping) {
      // 5 full rotations (1800deg) + final face offset
      const baseSpins = 1800;
      const targetOffset = result === "tails" ? 180 : 0;
      setRotationY((prev) => prev + baseSpins + targetOffset);
    }
  }, [isFlipping, result]);

  // Handle squash effect on landing
  useEffect(() => {
    if (!isFlipping && result) {
      setIsSquashing(true);
      const timer = setTimeout(() => setIsSquashing(false), 220);
      return () => clearTimeout(timer);
    }
  }, [isFlipping, result]);

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
      style={{ perspective: "1200px" }}
    >
      {/* 3D COIN ELEMENT */}
      <motion.div
        className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 cursor-pointer"
        style={{
          transformStyle: "preserve-3d",
        }}
        animate={
          shouldReduceMotion
            ? {
                opacity: isFlipping ? 0.3 : 1,
              }
            : isFlipping
            ? {
                y: [0, -85, -100, -85, 0],
                rotateY: rotationY,
                scale: [1, 1.05, 1.08, 1.02, 1],
                transition: {
                  duration: 1.4,
                  ease: [0.15, 0.85, 0.35, 1], // Decelerating cubic bezier
                },
              }
            : isSquashing
            ? {
                y: 0,
                scaleX: 1.08,
                scaleY: 0.92,
                transition: { duration: 0.12, ease: "easeOut" },
              }
            : {
                y: [0, -10, 0],
                rotateY: result === "tails" ? 180 : 0,
                scaleX: 1,
                scaleY: 1,
                transition: {
                  y: {
                    repeat: Infinity,
                    duration: 3.5,
                    ease: "easeInOut",
                  },
                },
              }
        }
      >
        {/* HEADS FACE (coin.png / coin-heads.png) */}
        <div
          className="absolute inset-0 w-full h-full rounded-full overflow-hidden backface-hidden flex items-center justify-center drop-shadow-xl"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
          }}
        >
          <Image
            src="/assets/coin-heads.png"
            alt="Flippo Coin Heads"
            fill
            sizes="(max-width: 640px) 192px, (max-width: 768px) 256px, 288px"
            priority
            className="object-contain filter drop-shadow-[0_8px_16px_rgba(11,11,20,0.18)]"
          />
        </div>

        {/* TAILS FACE (coin-tails.png) */}
        <div
          className="absolute inset-0 w-full h-full rounded-full overflow-hidden backface-hidden flex items-center justify-center drop-shadow-xl"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <Image
            src="/assets/coin-tails.png"
            alt="Flippo Coin Tails"
            fill
            sizes="(max-width: 640px) 192px, (max-width: 768px) 256px, 288px"
            priority
            className="object-contain filter drop-shadow-[0_8px_16px_rgba(11,11,20,0.18)]"
          />
        </div>
      </motion.div>

      {/* DYNAMIC SHADOW BENEATH COIN */}
      <motion.div
        className="w-36 sm:w-48 md:w-56 h-6 sm:h-8 rounded-[100%] bg-[#0B0B14]/15 filter blur-md mt-4"
        animate={
          isFlipping
            ? {
                scale: [1, 0.45, 0.35, 0.5, 1.15, 1],
                opacity: [0.25, 0.1, 0.08, 0.15, 0.35, 0.25],
                transition: { duration: 1.4, ease: "easeInOut" },
              }
            : {
                scale: [1, 0.88, 1],
                opacity: [0.22, 0.15, 0.22],
                transition: {
                  repeat: Infinity,
                  duration: 3.5,
                  ease: "easeInOut",
                },
              }
        }
      />
    </div>
  );
}
