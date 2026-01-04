import { useMemo } from "react";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import { Text, XStack, YStack, Button } from "tamagui"; 
import { useAuthStore } from "@/store/auth";
import { RefreshCw, Shield, Briefcase } from "@tamagui/lucide-icons";
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
            href: "/(app)/(tabs)/home",
            icon: <Briefcase size={16} color="white" />, 
          }
        : {
            title: "Modo Colaborador",
            hint: "Accede al panel de gestión.",
            cta: "Ir a panel Admin",
            href: "/(app)/(admin)/dashboard",
            icon: <Shield size={16} color="white" />, 
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
        borderColor="$brandPrimary" // Regresamos al borde original que tenías
      >
        {/* Título e Icono de refrescar */}
        <XStack alignItems="center" gap="$2">
          <RefreshCw size={18} color="$brandPrimary" />
          <Text fontFamily="$heading" fontSize="$4" color="$text">
            {copy.title}
          </Text>
        </XStack>

        {/* Fila Horizontal: Texto a la izquierda | Botón a la derecha */}
        <XStack alignItems="center" justifyContent="space-between" gap="$3">
          <Text fontSize="$2" color="$muted" flex={1}>
            {copy.hint}
          </Text>

          {/* Botón Mejorado pero del tamaño original ($3) */}
          <Button
            size="$3" // Tamaño compacto original
            backgroundColor="#2563EB" // Azul moderno
            borderRadius="$4"
            icon={copy.icon}
            onPress={() => router.replace(copy.href as never)}
            
            // Animaciones
            animation="bouncy" 
            pressStyle={{ scale: 0.9, opacity: 0.8 }} 
            hoverStyle={{ scale: 1.05 }}
            
            color="white"
            paddingHorizontal="$3" // Ajuste para que el texto quepa bien
          >
            {copy.cta}
          </Button>
        </XStack>
      </YStack>
    </Animated.View>
  );
};