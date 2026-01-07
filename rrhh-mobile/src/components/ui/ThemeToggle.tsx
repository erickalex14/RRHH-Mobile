import { memo } from "react";
import { Moon, SunMedium } from "@tamagui/lucide-icons";
import { Button } from "tamagui";
import { useThemeStore } from "@/store/theme";

export const ThemeToggle = memo(() => {
  const { theme, toggleTheme } = useThemeStore((state) => ({
    theme: state.theme,
    toggleTheme: state.toggleTheme
  }));

  const isDark = theme === "dark";

  return (
    <Button
      size="$3"
      circular
      backgroundColor={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
      icon={isDark ? Moon : SunMedium}
      onPress={toggleTheme}
      aria-label="Alternar tema"
    />
  );
});

ThemeToggle.displayName = "ThemeToggle";
