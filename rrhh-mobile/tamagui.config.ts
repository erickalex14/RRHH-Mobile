import { createTamagui, createTokens } from "tamagui";
import { shorthands } from "@tamagui/shorthands";
import { themes, tokens as baseTokens } from "@tamagui/themes";
import { createInterFont } from "@tamagui/font-inter";
import { animations } from "@tamagui/animations-react-native";

const tokens = createTokens({
  ...baseTokens,
  color: {
    ...baseTokens.color,
    brandBg: "#020617",
    brandBgLight: "#f8fafc",
    brandPrimary: "#2563eb",
    brandSecondary: "#f97316",
    surface: "#0f172a",
    muted: "#1f2937",
    border: "#1e293b",
    text: "#f8fafc",
    textDark: "#0f172a",
    success: "#22c55e",
    warning: "#facc15",
    danger: "#ef4444"
  },
  space: {
    ...baseTokens.space,
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 32,
    8: 40
  },
  size: {
    ...baseTokens.size,
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 28,
    7: 36,
    8: 48
  },
  radius: {
    ...baseTokens.radius,
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 20,
    round: 999
  }
});

const headingFont = createInterFont({
  family: "Inter",
  weight: "700",
  size: {
    4: 16,
    5: 20,
    6: 24,
    7: 30
  }
});

const bodyFont = createInterFont({
  family: "Inter",
  weight: "400",
  size: {
    3: 14,
    4: 16,
    5: 18
  }
});

const darkTheme = {
  ...themes.dark,
  background: tokens.color.brandBg,
  color: tokens.color.text,
  surface: tokens.color.surface,
  borderColor: tokens.color.border,
  muted: tokens.color.muted
};

const lightTheme = {
  ...themes.light,
  background: tokens.color.brandBgLight,
  color: tokens.color.textDark,
  surface: "#ffffff",
  borderColor: "#e2e8f0",
  muted: "#e5e7eb"
};

const config = createTamagui({
  defaultTheme: "dark",
  tokens,
  themes: {
    ...themes,
    dark: darkTheme,
    light: lightTheme
  },
  fonts: {
    heading: headingFont,
    body: bodyFont
  },
  shorthands,
  animations
});

export type AppConfig = typeof config;
export default config;
