import React from "react";
import { clsx } from "clsx";

interface StickerProps {
  className?: string;
  size?: number;
}

export function SparkleSticker({ className, size = 32 }: StickerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("pointer-events-none select-none", className)}
      aria-hidden="true"
    >
      <path
        d="M16 2C16 10 22 16 30 16C22 16 16 22 16 30C16 22 10 16 2 16C10 16 16 10 16 2Z"
        fill="#FE2D88"
        stroke="#0B0B14"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="3" fill="#FFFFFF" />
    </svg>
  );
}

export function StarSticker({ className, size = 36 }: StickerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("pointer-events-none select-none", className)}
      aria-hidden="true"
    >
      <path
        d="M18 3L22 13L32 14L24 22L27 32L18 26L9 32L12 22L4 14L14 13L18 3Z"
        fill="#FFE66B"
        stroke="#0B0B14"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="14" r="2.5" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
}

export function HeartSticker({ className, size = 34 }: StickerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("pointer-events-none select-none", className)}
      aria-hidden="true"
    >
      <path
        d="M17 29S4 21 4 11C4 6 8 3 12 3C15 3 17 6 17 6C17 6 19 3 22 3C26 3 30 6 30 11C30 21 17 29 17 29Z"
        fill="#FE2D88"
        stroke="#0B0B14"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse cx="11" cy="9" rx="2.5" ry="1.5" fill="#FFFFFF" transform="rotate(-30 11 9)" />
    </svg>
  );
}

export function CrownSticker({ className, size = 36 }: StickerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("pointer-events-none select-none", className)}
      aria-hidden="true"
    >
      <path
        d="M4 26L6 10L13 18L18 6L23 18L30 10L32 26H4Z"
        fill="#FFE66B"
        stroke="#0B0B14"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect x="6" y="26" width="24" height="4" rx="2" fill="#FE2D88" stroke="#0B0B14" strokeWidth="2.5" />
      <circle cx="18" cy="6" r="2" fill="#0C73FE" />
      <circle cx="6" cy="10" r="1.5" fill="#FE2D88" />
      <circle cx="30" cy="10" r="1.5" fill="#FE2D88" />
    </svg>
  );
}

export function LightningSticker({ className, size = 36 }: StickerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("pointer-events-none select-none", className)}
      aria-hidden="true"
    >
      <path
        d="M20 3L7 19H17L14 33L29 15H19L20 3Z"
        fill="#FFE66B"
        stroke="#0B0B14"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M18 9L11 18H16L15 25L23 15H17L18 9Z" fill="#FFF59D" />
    </svg>
  );
}

export function MiniCoinSticker({ className, size = 32 }: StickerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("pointer-events-none select-none", className)}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="14" fill="#DDE6F2" stroke="#0B0B14" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="10" fill="#0C73FE" stroke="#0B0B14" strokeWidth="2" />
      <text
        x="16"
        y="20"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="12"
        fontWeight="900"
        fontFamily="sans-serif"
      >
        F
      </text>
    </svg>
  );
}
