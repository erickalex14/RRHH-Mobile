import { Platform, type ColorSchemeName } from "react-native";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

export type ThemeMode = "light" | "dark";

const THEME_KEY = "app-theme";
const isWeb = Platform.OS === "web";

const loadStoredTheme = async (): Promise<ThemeMode | null> => {
  try {
    if (isWeb) {
      const value = localStorage.getItem(THEME_KEY);
      return value === "light" || value === "dark" ? value : null;
    }
    const value = await SecureStore.getItemAsync(THEME_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch (error) {
    return null;
  }
};

const persistTheme = async (theme: ThemeMode): Promise<void> => {
  try {
    if (isWeb) {
      localStorage.setItem(THEME_KEY, theme);
      return;
    }
    await SecureStore.setItemAsync(THEME_KEY, theme);
  } catch (error) {
    // ignore persistence errors
  }
};

interface ThemeState {
  theme: ThemeMode;
  ready: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  bootstrap: (systemScheme: ColorSchemeName | null | undefined) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "dark",
  ready: false,
  setTheme: (theme) => {
    set({ theme, ready: true });
    void persistTheme(theme);
  },
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    set({ theme: next, ready: true });
    void persistTheme(next);
  },
  bootstrap: async (systemScheme) => {
    if (get().ready) return;
    const stored = await loadStoredTheme();
    if (stored) {
      set({ theme: stored, ready: true });
      return;
    }
    if (systemScheme === "light" || systemScheme === "dark") {
      set({ theme: systemScheme, ready: true });
      return;
    }
    set({ theme: "dark", ready: true });
  }
}));
