import { LinearGradient } from "expo-linear-gradient";
import { PropsWithChildren } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { YStack, useThemeName } from "tamagui";

export const Screen = ({ children }: PropsWithChildren): JSX.Element => {
  const themeName = useThemeName();
  const isLightTheme = typeof themeName === "string" && themeName.includes("light");
  const backgroundToken = isLightTheme ? "$brandBgLight" : "$brandBg";

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: isLightTheme ? "#f8fafc" : "#020617"
      }}
    >
      <YStack flex={1} backgroundColor={backgroundToken} px="$4" py="$5" gap="$4" position="relative" overflow="hidden">
        <LinearGradient
          colors={isLightTheme ? ["#dbeafe", "transparent"] : ["rgba(59,130,246,0.25)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", top: -80, left: -80, right: -80, bottom: -80, opacity: 0.75 }}
        />
        <LinearGradient
          colors={isLightTheme ? ["rgba(236,72,153,0.12)", "transparent"] : ["rgba(236,72,153,0.18)", "transparent"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: "absolute", top: -60, left: -60, right: -60, bottom: -60, opacity: 0.7, transform: [{ rotate: "-6deg" }] }}
        />
        {children}
      </YStack>
    </SafeAreaView>
  );
};

