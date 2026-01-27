import { memo, useCallback, useEffect, type ComponentProps } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming
} from "react-native-reanimated";
import type { GestureResponderEvent } from "react-native";
import { Button } from "tamagui";
import { motion, timingConfig } from "@/theme/motion";

const AnimatedTamaguiButton = Animated.createAnimatedComponent(Button);

type BaseButtonProps = ComponentProps<typeof Button>;
type Status = "default" | "success" | "danger";

export type AnimatedButtonProps = BaseButtonProps & {
  status?: Status;
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
};

const statusPalette: Record<Status, string> = {
  default: "$brandPrimary",
  success: "$success",
  danger: "$danger"
};

export const AnimatedButton = memo(({ children, status = "default", onPressIn, onPressOut, size = "$5", paddingVertical = "$3", paddingHorizontal = "$4", fontSize = "$5", ...props }: AnimatedButtonProps & { size?: any; paddingVertical?: any; paddingHorizontal?: any; fontSize?: any }) => {
  const shouldReduceMotion = useReducedMotion();
  const pressProgress = useSharedValue(0);
  const pulseProgress = useSharedValue(0);

  useEffect(() => {
    if (status === "success" && !shouldReduceMotion) {
      pulseProgress.value = 0;
      pulseProgress.value = withSequence(
        withTiming(1, { duration: motion.duration.quick, easing: motion.easing }),
        withTiming(0, { duration: motion.duration.relaxed, easing: motion.easing })
      );
    }
  }, [pulseProgress, shouldReduceMotion, status]);

  const animatePress = useCallback(
    (value: number) => {
      pressProgress.value = shouldReduceMotion ? value : withTiming(value, {
        ...timingConfig(motion.duration.quick),
        easing: Easing.inOut(Easing.quad)
      });
    },
    [pressProgress, shouldReduceMotion]
  );

  type PressHandler = (event: GestureResponderEvent) => void;

  const handlePressIn = useCallback<PressHandler>(
    (event) => {
      if (!shouldReduceMotion) {
        animatePress(1);
      }
      onPressIn?.(event);
    },
    [animatePress, onPressIn, shouldReduceMotion]
  );

  const handlePressOut = useCallback<PressHandler>(
    (event) => {
      if (!shouldReduceMotion) {
        animatePress(0);
      }
      onPressOut?.(event);
    },
    [animatePress, onPressOut, shouldReduceMotion]
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return {};
    }
    const scale = 1 - pressProgress.value * 0.04 + pulseProgress.value * 0.02;
    const opacity = 1 - pressProgress.value * 0.08;
    return {
      transform: [{ scale }],
      opacity
    };
  }, [shouldReduceMotion]);

  return (
    <AnimatedTamaguiButton
      {...props}
      style={[
        {
          paddingVertical,
          paddingHorizontal,
          fontSize,
        },
        props.style,
        animatedStyle,
      ]}
      size={size}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      backgroundColor={props.bg ?? statusPalette[status]}
      color={props.color ?? "$text"}
      borderRadius={props.borderRadius ?? "$4"}
    >
      {children}
    </AnimatedTamaguiButton>
  );
});

AnimatedButton.displayName = "AnimatedButton";

