import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type ButtonVariant =
  | "pink"
  | "gradient"
  | "blue"
  | "white"
  | "ink"
  | "ghost";

export type ButtonSize = "sm" | "md" | "lg" | "pill" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  pink: "bg-[#FE2D88] text-[#0B0B14] hover:bg-[#ff4396]",
  gradient: "bg-gradient-to-r from-[#FE2D88] to-[#0C73FE] text-white",
  blue: "bg-[#0C73FE] text-white hover:bg-[#2080ff]",
  white: "bg-white text-[#0B0B14] hover:bg-[#F4FAFF]",
  ink: "bg-[#0B0B14] text-white hover:bg-[#1a1a2e]",
  ghost: "bg-transparent text-[#0B0B14] border-transparent shadow-none hover:bg-black/5 active:translate-y-0",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs rounded-[14px]",
  md: "min-h-[44px] h-11 px-5 text-sm font-bold rounded-[20px]",
  lg: "min-h-[56px] h-14 px-8 text-lg font-extrabold rounded-[28px]",
  pill: "min-h-[44px] h-10 px-5 text-sm font-bold rounded-full",
  icon: "min-h-[44px] min-w-[44px] h-11 w-11 p-0 rounded-[14px] flex items-center justify-center",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "pink",
      size = "md",
      isLoading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isGhost = variant === "ghost";

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(
          clsx(
            "relative inline-flex items-center justify-center select-none font-display font-extrabold tracking-tight",
            !isGhost && "tactile-button cursor-pointer",
            isGhost && "cursor-pointer transition-colors duration-150",
            variantStyles[variant],
            sizeStyles[size],
            (disabled || isLoading) && "pointer-events-none opacity-60",
            className
          )
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
