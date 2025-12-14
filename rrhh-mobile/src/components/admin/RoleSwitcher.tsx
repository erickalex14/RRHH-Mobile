import { useMemo } from "react";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import { Paragraph, Text, XStack } from "tamagui";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/store/auth";

interface RoleSwitcherProps {
  target: "employee" | "admin";
}

export const RoleSwitcher = ({ target }: RoleSwitcherProps): JSX.Element | null => {
  const router = useRouter();
  const isAdmin = useAuthStore((state) => state.user?.employeeDetail?.role?.admin ?? false);
  const shouldReduceMotion = useReducedMotion();

  if (!isAdmin) {
    return null;
  }

  const copy = useMemo(
    () =>
      target === "employee"
        ? {
            title: "Modo administrativo",
            hint: "Necesitas revisar la app como colaborador?",
            cta: "Ir a modo empleado",
            href: "/(app)/(tabs)/home"
          }
        : {
            title: "Modo colaborador",
            hint: "Vuelve al panel de gestión para aprobar solicitudes.",
            cta: "Regresar a Admin",
            href: "/(app)/(admin)/dashboard"
          },
    [target]
  );

  return (
    <Animated.View entering={shouldReduceMotion ? undefined : FadeInDown.duration(300)}>
      <XStack
        backgroundColor="$surface"
        borderRadius="$4"
        px="$4"
        py="$3"
        alignItems="center"
        justifyContent="space-between"
        gap="$3"
      >
        <XStack flex={1} gap="$2" alignItems="center">
          <Text fontFamily="$heading" fontSize="$4" color="$text">
            {copy.title}
          </Text>
          <Paragraph size="$2" color="$muted" flexShrink={1}>
            {copy.hint}
          </Paragraph>
        </XStack>
        <AnimatedButton
          size="$3"
          backgroundColor="$brandPrimary"
          color="$text"
          onPress={() => router.push(copy.href as never)}
        >
          {copy.cta}
        </AnimatedButton>
      </XStack>
    </Animated.View>
  );
};

