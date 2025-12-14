import { PropsWithChildren } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { YStack, useThemeName } from "tamagui";

export const Screen = ({ children }: PropsWithChildren): JSX.Element => {
  const themeName = useThemeName();
  const backgroundToken = themeName?.includes("light") ? "$brandBgLight" : "$brandBg";

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: themeName?.includes("light") ? "#f8fafc" : "#020617"
      }}
    >
      <YStack flex={1} backgroundColor={backgroundToken} px="$4" py="$5" gap="$4">
        {children}
      </YStack>
    </SafeAreaView>
  );
};

