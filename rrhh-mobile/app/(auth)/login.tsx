import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/store/auth";
import { useShallow } from "zustand/react/shallow";
import {
  AnimatePresence,
  Input,
  Paragraph,
  Separator,
  SizableText,
  Spinner,
  Text,
  XStack,
  YStack
} from "tamagui";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming
} from "react-native-reanimated";

const AnimatedCard = Animated.createAnimatedComponent(YStack);

export default function LoginScreen(): JSX.Element {
  const router = useRouter();
  const { status, error, login, clearError } = useAuthStore(
    useShallow((state) => ({
      status: state.status,
      error: state.error,
      login: state.login,
      clearError: state.clearError
    }))
  );
  const isAdmin = useAuthStore((state) => state.user?.employeeDetail?.role?.admin ?? false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [cardVisible, setCardVisible] = useState(false);

  const heroProgress = useSharedValue(0);
  const submitPulse = useSharedValue(0);

  const isLoading = status === "loading";
  const activeError = localError ?? error;

  useEffect(() => {
    setCardVisible(true);
    heroProgress.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.exp)
    });
  }, [heroProgress]);

  useEffect(() => {
    if (status === "authenticated") {
      setCardVisible(false);
      const timer = setTimeout(() => {
        const destination = isAdmin
          ? "/(app)/(admin)/dashboard"
          : "/(app)/(tabs)/home";
        router.replace(destination);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isAdmin, router, status]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroProgress.value,
    transform: [
      {
        translateY: interpolate(heroProgress.value, [0, 1], [24, 0])
      }
    ]
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(submitPulse.value, [0, 1], [1, 0.98])
      }
    ],
    shadowOpacity: interpolate(submitPulse.value, [0, 1], [0.35, 0.45])
  }));

  const handleInputChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
      (value: string) => {
        setter(value);
        setLocalError(null);
        clearError();
      },
    [clearError]
  );

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setLocalError("Completa correo y contraseña");
      return;
    }

    submitPulse.value = withSequence(
      withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 220, easing: Easing.out(Easing.exp) })
    );

    try {
      await login({ email: email.trim(), password: password.trim() });
    } catch (err) {
      if (err instanceof Error) {
        setLocalError(err.message);
      }
    }
  }, [email, password, login, submitPulse]);

  const helperText = useMemo(
    () =>
      activeError ??
      "Usa tus credenciales corporativas para generar un token Sanctum.",
    [activeError]
  );

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <YStack flex={1} justifyContent="center" gap="$6">
        <Animated.View style={heroStyle}>
          <Text fontFamily="$heading" fontSize="$7" color="$text">
            Bienvenido a RRHH
          </Text>
          <SizableText size="$5" color="$text" opacity={0.75} mt="$2">
            Gestiona asistencia, documentos y solicitudes desde un solo lugar.
          </SizableText>
          <XStack
            mt="$4"
            px="$3"
            py="$2"
            alignItems="center"
            gap="$2"
            borderRadius="$4"
            backgroundColor="$muted"
            opacity={0.9}
          >
            <Text color="$text" fontFamily="$body" fontSize="$3">
              Sesiones seguras vía Sanctum
            </Text>
          </XStack>
        </Animated.View>

        <AnimatePresence>
          {cardVisible && (
            <AnimatedCard
              key="login-card"
              backgroundColor="$surface"
              borderRadius="$4"
              px="$4"
              py="$5"
              gap="$4"
              elevation={4}
              enterStyle={{ opacity: 0, y: 24 }}
              exitStyle={{ opacity: 0, y: -12 }}
              shadowColor="rgba(15,23,42,0.35)"
              style={cardStyle}
            >
              <Text fontFamily="$heading" fontSize="$6" color="$text">
                Inicia sesión
              </Text>
              <Paragraph size="$3" color={activeError ? "$danger" : "$text"}>
                {helperText}
              </Paragraph>
              <YStack gap="$3">
                <Input
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="correo@empresa.com"
                  backgroundColor="$brandBg"
                  color="$text"
                  borderRadius="$3"
                  size="$5"
                  value={email}
                  onChangeText={handleInputChange(setEmail)}
                />
                <Input
                  secureTextEntry
                  placeholder="••••••••"
                  backgroundColor="$brandBg"
                  color="$text"
                  borderRadius="$3"
                  size="$5"
                  value={password}
                  onChangeText={handleInputChange(setPassword)}
                />
              </YStack>
              <Separator backgroundColor="$border" />
              <AnimatedButton
                mt="$1"
                disabled={isLoading}
                onPress={handleLogin}
                opacity={isLoading ? 0.85 : 1}
              >
                {isLoading ? (
                  <XStack gap="$2" alignItems="center" justifyContent="center">
                    <Spinner color="$text" size="small" />
                    <Text color="$text" fontWeight="600">
                      Validando...
                    </Text>
                  </XStack>
                ) : (
                  "Continuar"
                )}
              </AnimatedButton>
            </AnimatedCard>
          )}
        </AnimatePresence>
      </YStack>
    </Screen>
  );
}

