import { Stack, Redirect } from "expo-router";
import { Spinner, YStack } from "tamagui";
import { useAuthStore } from "@/store/auth";

export default function AppLayout(): JSX.Element {
  const status = useAuthStore((state) => state.status);

  if (status === "checking") {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$brandBg">
        <Spinner size="large" color="$brandPrimary" />
      </YStack>
    );
  }

  if (status !== "authenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade_from_bottom" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
    </Stack>
  );
}

