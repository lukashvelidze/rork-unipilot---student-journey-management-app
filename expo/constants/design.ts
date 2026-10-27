/**
 * Tokens for the redesigned screens (Figma: Unipilot). Keep new screens on
 * these instead of ad-hoc hex values so they stay visually consistent.
 */
export const UI = {
  primary: "#FF6B6B",
  primarySoft: "#FFECEC",
  primaryRing: "#FFF4F4",
  success: "#2EC4B6",
  successSoft: "#E3F8F5",
  warning: "#F5A524",
  warningSoft: "#FFF5E0",
  danger: "#E5484D",
  text: "#1C1C2E",
  textSecondary: "#5E5E72",
  muted: "#8E8EA0",
  border: "#ECECF2",
  hairline: "#F1F1F5",
  background: "#F7F7FA",
  card: "#FFFFFF",
  track: "#E9E9EF",
  segment: "#EDEDF2",
} as const;

export const RADIUS = {
  card: 18,
  tile: 16,
  pill: 999,
} as const;

/** Soft card elevation used across the redesign. */
export const CARD_SHADOW = {
  shadowColor: "#1C1C2E",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 2,
} as const;

export const GUTTER = 24;
