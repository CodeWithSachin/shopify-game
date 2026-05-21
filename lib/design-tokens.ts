/**
 * Spykar design tokens.
 *
 * NOTE: These hex values are inferred from typical Spykar branding (denim
 * heritage brand, red/charcoal/white identity). Confirm against spykar.com
 * or the brand team before launch.
 */
export const tokens = {
  color: {
    red: "#E4002B", // primary CTA / score / impact
    ink: "#0A0A0A", // foreground, headlines
    indigo: "#1B2845", // denim accent, secondary surfaces
    cream: "#F7F5F0", // off-white background
    paper: "#FFFFFF", // card surface
    stone: "#6B6B6B", // muted text
    success: "#2E7D32",
    warning: "#E08B00",
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 20,
    pill: 999,
  },
  font: {
    sans: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
} as const;

export type Tokens = typeof tokens;
