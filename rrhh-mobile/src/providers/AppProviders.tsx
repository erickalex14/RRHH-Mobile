import { PropsWithChildren, useEffect, useMemo } from "react";
import { TamaguiProvider, Theme } from "tamagui";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import tamaguiConfig from "../../tamagui.config";
import { AuthProvider } from "@/providers/AuthProvider";
import { ConfirmProvider } from "@/providers/ConfirmProvider";
import { useThemeStore } from "@/store/theme";

const queryClient = new QueryClient();

export const AppProviders = ({ children }: PropsWithChildren): JSX.Element => {
  const scheme = useColorScheme();
  const { theme, ready, bootstrap } = useThemeStore((state) => ({
    theme: state.theme,
    ready: state.ready,
    bootstrap: state.bootstrap
  }));

  useEffect(() => {
    void bootstrap(scheme);
  }, [bootstrap, scheme]);

  const memoizedTheme = useMemo(() => theme, [theme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <TamaguiProvider config={tamaguiConfig} defaultTheme={memoizedTheme}>
            <Theme name={memoizedTheme}>
              <AuthProvider>
                <ConfirmProvider>{ready ? children : null}</ConfirmProvider>
              </AuthProvider>
            </Theme>
          </TamaguiProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
