import { memo } from "react";
import Animated, { FadeInDown, FadeOutUp, useReducedMotion } from "react-native-reanimated";
import { Paragraph, Text, XStack, YStack } from "tamagui";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

const palette = {
  info: { bg: "rgba(59,130,246,0.2)", text: "#bfdbfe" },
  success: { bg: "rgba(34,197,94,0.2)", text: "#bbf7d0" },
  error: { bg: "rgba(248,113,113,0.2)", text: "#fecaca" }
} as const;

export interface AnimatedNoticeProps {
  title?: string;
  message: string;
  variant?: keyof typeof palette;
  actionLabel?: string;
  onAction?: () => void;
}

export const AnimatedNotice = memo(({ title, message, variant = "info", actionLabel, onAction }: AnimatedNoticeProps) => {
  const colors = palette[variant];
  const shouldReduceMotion = useReducedMotion();

  return (
    <Animated.View
      entering={shouldReduceMotion ? undefined : FadeInDown.duration(280)}
      exiting={shouldReduceMotion ? undefined : FadeOutUp.duration(220)}
    >
      <YStack
        gap="$2"
        px="$4"
        py="$3"
        borderRadius="$6"
        backgroundColor={colors.bg}
        borderColor={colors.text}
        borderWidth={1}
      >
        {title ? (
          <Text fontFamily="$heading" fontSize="$5" color={colors.text}>
            {title}
          </Text>
        ) : null}
        <Paragraph color={colors.text} fontSize="$3">
          {message}
        </Paragraph>
        {actionLabel && onAction ? (
          <XStack justifyContent="flex-end">
            <AnimatedButton
              size="$3"
              backgroundColor="transparent"
              borderWidth={1}
              borderColor={colors.text}
              color={colors.text}
              onPress={onAction}
            >
              {actionLabel}
            </AnimatedButton>
          </XStack>
        ) : null}
      </YStack>
    </Animated.View>
  );
});

AnimatedNotice.displayName = "AnimatedNotice";

