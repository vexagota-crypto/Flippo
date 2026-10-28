/**
 * Flippo Design Tokens
 * Sampled from brand assets: logo.png and coin.png
 * Proportions: ~65% Ice/White, 15% Ink, 12% Candy Pink, 8% Electric Blue
 */

export const colors = {
  // Canvas & Surfaces
  ice50: "#F4FAFF",
  ice100: "#E3F1FF",
  sky200: "#BFE0FF",
  white: "#FFFFFF",
  
  // Ink (Outlines, Text, Shadows)
  ink: "#0B0B14",

  // Brand Accents
  candyPink: "#FE2D88",
  pinkDark: "#C2185B", // Accessible pink text on light surfaces (passes 4.5:1)
  pink200: "#FFC2DA",
  electricBlue: "#0C73FE",
  deepBlue: "#0A2BB5",
  deepBlueDark: "#051A7A",

  // Metallic & Sparkle
  silver: "#DDE6F2",
  silverRim: "#C5CACE",
  sun: "#FFE66B",

  // Functional
  success: "#16A34A",
  error: "#E5484D",
} as const;

export const radii = {
  sm: "14px",
  md: "20px",
  lg: "28px",
  xl: "36px",
  full: "9999px",
} as const;

export const shadows = {
  card: "0 5px 0 #0B0B14",
  button: "0 4px 0 #0B0B14",
  buttonActive: "0 1px 0 #0B0B14",
  buttonHover: "0 6px 0 #0B0B14",
  dropdown: "0 8px 0 #0B0B14",
} as const;

export const outlines = {
  ink: "3px solid #0B0B14",
  inkThin: "2px solid #0B0B14",
} as const;
