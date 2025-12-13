import { PropsWithChildren, useMemo } from "react";
import { TamaguiProvider, Theme } from "tamagui";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import tamaguiConfig from "../../tamagui.config";
import { AuthProvider } from "@/providers/AuthProvider";

const queryClient = new QueryClient();

export const AppProviders = ({ children }: PropsWithChildren): JSX.Element => {
  const scheme = useColorScheme();
  const themeName = scheme === "light" ? "light" : "dark";
  const memoizedTheme = useMemo(() => themeName, [themeName]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <TamaguiProvider config={tamaguiConfig} defaultTheme={memoizedTheme}>
            <Theme name={memoizedTheme}>
              <AuthProvider>{children}</AuthProvider>
            </Theme>
          </TamaguiProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
