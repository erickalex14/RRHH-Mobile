import { useMemo } from "react";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import { Text, XStack, YStack, Button, useTheme } from "tamagui"; 
import { useAuthStore } from "@/store/auth";
import { RefreshCw, Shield, Briefcase, ArrowRight } from "@tamagui/lucide-icons";
import { isUserAdmin } from "@/utils/auth";
import { LinearGradient } from "expo-linear-gradient";

interface RoleSwitcherProps {
  target: "employee" | "admin";
}

export const RoleSwitcher = ({ target }: RoleSwitcherProps): JSX.Element | null => {
  const router = useRouter();
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = isUserAdmin(user);
  const shouldReduceMotion = useReducedMotion();

  const copy = useMemo(
    () =>
      target === "employee"
        ? {
            title: "Vista administrativa",
            hint: "Cambiar a modo colaborador",
            href: "/(app)/(tabs)/home", 
          }
        : {
            title: "Vista de colaborador",
            hint: "Volver al panel admin",
            href: "/(app)/(admin)/dashboard", 
          },
    [target]
  );

  if (!isAdmin) {
    return null;
  }

  return (
    <Animated.View entering={shouldReduceMotion ? undefined : FadeInDown.duration(300)}>
      <XStack
        overflow="hidden"
        borderRadius="$6"
        paddingVertical="$3"
        paddingHorizontal="$4"
        position="relative"
        alignItems="center"
        justifyContent="space-between"
        backgroundColor="$background"
        borderWidth={1}
        borderColor="$borderColor"
        marginTop="$2"
        elevation={2}
        shadowColor="$shadowColor"
        shadowRadius={4}
        shadowOffset={{ height: 2, width: 0 }}
        shadowOpacity={0.05}
      >
        {/* Decorative Gradient Background */}
        <LinearGradient
            colors={['rgba(37,99,235,0.08)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            }}
        />

        <XStack gap="$3" alignItems="center" flex={1}>
            <YStack 
                backgroundColor="$blue3" 
                padding="$2" 
                borderRadius="$4"
                alignItems="center"
                justifyContent="center"
            >
                <RefreshCw size={16} color="$blue10" />
            </YStack>
            <YStack>
                <Text fontSize={14} fontWeight="700" color="$color">
                    {copy.title}
                </Text>
                <Text fontSize={11} color="$color" opacity={0.6}>
                    {copy.hint}
                </Text>
            </YStack>
        </XStack>
        
        <Button
            size="$2.5"
            circular
            backgroundColor="$blue10"
            icon={<ArrowRight size={14} color="white" />}
            onPress={() => router.replace(copy.href as never)}
            chromeless
            scale={0.9}
            pressStyle={{ scale: 0.8 }}
        />
      </XStack>
    </Animated.View>
  );
};
