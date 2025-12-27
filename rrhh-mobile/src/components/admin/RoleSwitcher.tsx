import { useMemo } from "react";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import { Text, XStack, YStack } from "tamagui";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/store/auth";
import { RefreshCw } from "@tamagui/lucide-icons";
import { isUserAdmin } from "@/utils/auth";

interface RoleSwitcherProps {
  target: "employee" | "admin";
}

export const RoleSwitcher = ({ target }: RoleSwitcherProps): JSX.Element | null => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = isUserAdmin(user);
  const shouldReduceMotion = useReducedMotion();

  const copy = useMemo(
    () =>
      target === "employee"
        ? {
            title: "Panel Administrativo",
            hint: "¿Necesitas ver tu vista de empleado?",
            cta: "Ir a modo empleado",
            href: "/(app)/(tabs)/home"
          }
        : {
            title: "Modo Colaborador",
            hint: "Accede al panel de gestión y administración.",
            cta: "Ir a panel Admin",
            href: "/(app)/(admin)/dashboard"
          },
    [target]
  );

  if (!isAdmin) {
    return null;
  }

  return (
    <Animated.View entering={shouldReduceMotion ? undefined : FadeInDown.duration(300)}>
      <YStack
        backgroundColor="$surface"
        borderRadius="$4"
        px="$4"
        py="$3"
        gap="$2"
        borderWidth={1}
        borderColor="$brandPrimary"
      >
        <XStack alignItems="center" gap="$2">
          <RefreshCw size={18} color="$brandPrimary" />
          <Text fontFamily="$heading" fontSize="$4" color="$text">
            {copy.title}
          </Text>
        </XStack>
        <XStack alignItems="center" justifyContent="space-between" gap="$3">
          <Text fontSize="$2" color="$muted" flex={1}>
            {copy.hint}
          </Text>
          <AnimatedButton
            size="$3"
            backgroundColor="$brandPrimary"
            color="$text"
            onPress={() => router.replace(copy.href as never)}
          >
            {copy.cta}
          </AnimatedButton>
        </XStack>
      </YStack>
    </Animated.View>
  );
};

