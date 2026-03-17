export const themeConfig = {
  colors: {
    light: {
      background: "oklch(0.97 0.01 240)",
      foreground: "oklch(0.15 0.02 260)",
      primary: "oklch(0.55 0.2 250)",
      primaryForeground: "oklch(0.98 0 0)",
      card: "oklch(0.99 0.005 240)",
      cardForeground: "oklch(0.15 0.02 260)",
      muted: "oklch(0.93 0.01 240)",
      mutedForeground: "oklch(0.5 0.02 260)",
      accent: "oklch(0.93 0.02 240)",
      accentForeground: "oklch(0.25 0.02 260)",
      border: "oklch(0.88 0.02 240)",
      sidebar: "oklch(0.95 0.015 240)",
      sidebarForeground: "oklch(0.15 0.02 260)",
      sidebarAccent: "oklch(0.90 0.03 240)",
    },
    dark: {
      background: "oklch(0.15 0.02 260)",
      foreground: "oklch(0.93 0.01 240)",
      primary: "oklch(0.7 0.15 220)",
      primaryForeground: "oklch(0.15 0.02 260)",
      card: "oklch(0.2 0.02 260)",
      cardForeground: "oklch(0.93 0.01 240)",
      muted: "oklch(0.25 0.02 260)",
      mutedForeground: "oklch(0.65 0.02 240)",
      accent: "oklch(0.25 0.03 250)",
      accentForeground: "oklch(0.93 0.01 240)",
      border: "oklch(0.3 0.02 260)",
      sidebar: "oklch(0.18 0.02 260)",
      sidebarForeground: "oklch(0.93 0.01 240)",
      sidebarAccent: "oklch(0.25 0.03 250)",
    },
  },
  fonts: {
    sans: "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  radius: "0.625rem",
} as const;

export type ThemeConfig = typeof themeConfig;
