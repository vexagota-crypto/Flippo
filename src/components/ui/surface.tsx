import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type SurfaceTone =
  | "white"
  | "ice"
  | "sky"
  | "pink"
  | "electric-blue"
  | "deep-blue"
  | "ink"
  | "silver";

export type SurfaceRadius = "sm" | "md" | "lg" | "xl" | "full";

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: SurfaceTone;
  radius?: SurfaceRadius;
  withBorder?: boolean;
  withShadow?: boolean;
  className?: string;
  children: React.ReactNode;
}

const toneStyles: Record<SurfaceTone, string> = {
  white: "bg-white text-[#0B0B14]",
  ice: "bg-[#E3F1FF] text-[#0B0B14]",
  sky: "bg-[#BFE0FF] text-[#0B0B14]",
  pink: "bg-[#FE2D88] text-[#0B0B14]",
  "electric-blue": "bg-[#0C73FE] text-white",
  "deep-blue": "bg-[#0A2BB5] text-white",
  ink: "bg-[#0B0B14] text-white",
  silver: "bg-[#DDE6F2] text-[#0B0B14]",
};

const radiusStyles: Record<SurfaceRadius, string> = {
  sm: "rounded-[14px]",
  md: "rounded-[20px]",
  lg: "rounded-[28px]",
  xl: "rounded-[36px]",
  full: "rounded-full",
};

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  (
    {
      tone = "white",
      radius = "lg",
      withBorder = true,
      withShadow = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          clsx(
            toneStyles[tone],
            radiusStyles[radius],
            withBorder && "border-[3px] border-[#0B0B14]",
            withShadow && "shadow-[0_5px_0_#0B0B14]",
            "transition-all duration-150",
            className
          )
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Surface.displayName = "Surface";
