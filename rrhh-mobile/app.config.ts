import "dotenv/config";
import type { ExpoConfig } from "@expo/config-types";

const defineConfig = (): ExpoConfig => ({
  name: "RRHH Mobile",
  slug: "rrhh-mobile",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "rrhhmobile",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    backgroundColor: "#030712"
  },
  ios: {
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#030712"
    },
    package: "com.rrhh.mobile"
  },
  web: {
    bundler: "metro"
  },
  experiments: {
    typedRoutes: true
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api",
    eas: {
      projectId: "00000000-0000-0000-0000-000000000000"
    }
  }
});

export default defineConfig;
