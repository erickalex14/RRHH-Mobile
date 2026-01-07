import { createTamagui, createTokens } from "tamagui";
import { shorthands } from "@tamagui/shorthands";
import { themes, tokens as baseTokens } from "@tamagui/themes";
import { createInterFont } from "@tamagui/font-inter";
import { createAnimations } from "@tamagui/animations-react-native";

type TamaguiAnimations = NonNullable<Parameters<typeof createTamagui>[0]["animations"]>;

const animations = createAnimations({
  bouncy: {
    type: "spring",
    damping: 10,
    mass: 0.9,
    stiffness: 150
  },
  lazy: {
    type: "spring",
    damping: 20,
    mass: 1,
    stiffness: 60
  },
  quick: {
    type: "spring",
    damping: 20,
    mass: 1.2,
    stiffness: 250
  }
}) as TamaguiAnimations;

const tokens = createTokens({
  ...baseTokens,
  color: {
    ...baseTokens.color,
    brandBg: "#020617",
    brandBgLight: "#f8fafc",
    brandPrimary: "#2563eb",
    brandSecondary: "#f97316",
    surface: "#0f172a",
    muted: "#94a3b8",
    border: "#24304a",
    text: "#e7ecff",
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
  face: {
    400: { normal: "Inter" },
    500: { normal: "InterMedium" },
    600: { normal: "InterSemiBold" },
    700: { normal: "InterBold" }
  },
  weight: {
    4: "600",
    5: "700",
    6: "700",
    7: "700"
  },
  size: {
    4: 18,
    5: 22,
    6: 26,
    7: 32
  },
  letterSpacing: {
    4: -0.2,
    5: -0.2,
    6: -0.25,
    7: -0.3
  }
});

const bodyFont = createInterFont({
  family: "Inter",
  face: {
    400: { normal: "Inter" },
    500: { normal: "InterMedium" },
    600: { normal: "InterSemiBold" }
  },
  weight: {
    3: "400",
    4: "500",
    5: "600"
  },
  size: {
    3: 14,
    4: 16,
    5: 18
  }
});

const media = {
  xs: { maxWidth: 420 },
  sm: { maxWidth: 768 },
  md: { maxWidth: 1024 },
  lg: { maxWidth: 1280 },
  xl: { maxWidth: 1536 },
  short: { maxHeight: 820 },
  tall: { minHeight: 820 },
  hoverNone: { hover: "none" as const },
  pointerCoarse: { pointer: "coarse" as const }
} as const;

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
  media,
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
