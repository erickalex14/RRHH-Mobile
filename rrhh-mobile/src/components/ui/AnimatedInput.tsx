import { forwardRef, useCallback } from "react";
import { Input, InputProps, Label, YStack } from "tamagui";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { TextInput } from "react-native";
import { motion, timingConfig } from "@/theme/motion";

export interface AnimatedInputProps extends InputProps {
  label?: string;
  helperText?: string;
}

export const AnimatedInput = forwardRef<TextInput, AnimatedInputProps>(
  ({ label, helperText, onFocus, onBlur, ...props }, ref) => {
    const focusValue = useSharedValue(0);
    const shouldReduceMotion = useReducedMotion();

    const handleFocus = useCallback<Required<InputProps>["onFocus"]>(
      (event) => {
        focusValue.value = shouldReduceMotion
          ? 1
          : withTiming(1, { ...timingConfig(motion.duration.quick), easing: Easing.inOut(Easing.cubic) });
        onFocus?.(event);
      },
      [focusValue, onFocus, shouldReduceMotion]
    );

    const handleBlur = useCallback<Required<InputProps>["onBlur"]>(
      (event) => {
        focusValue.value = shouldReduceMotion
          ? 0
          : withTiming(0, { ...timingConfig(motion.duration.quick), easing: Easing.inOut(Easing.cubic) });
        onBlur?.(event);
      },
      [focusValue, onBlur, shouldReduceMotion]
    );

    const containerStyle = useAnimatedStyle(() => {
      const borderColor = interpolateColor(focusValue.value, [0, 1], ["#1f2937", "#2563eb"]);
      if (shouldReduceMotion) {
        return { borderColor };
      }
      return {
        borderColor,
        shadowOpacity: focusValue.value ? 0.4 : 0,
        transform: [{ scale: focusValue.value ? 1.01 : 1 }]
      };
    }, [shouldReduceMotion]);

    return (
      <YStack gap="$1">
        {label ? (
          <Label color="$text" size="$3" opacity={0.8}>
            {label}
          </Label>
        ) : null}
        <Animated.View
          style={[{
            borderWidth: 1,
            borderRadius: 16,
            backgroundColor: "rgba(15,23,42,0.25)",
            paddingHorizontal: 4
          }, containerStyle]}
        >
          <Input
            ref={ref as never}
            borderWidth={0}
            backgroundColor="transparent"
            color="$text"
            {...props}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </Animated.View>
        {helperText ? (
          <Animated.Text style={{ color: "#94a3b8", fontSize: 12 }}>{helperText}</Animated.Text>
        ) : null}
      </YStack>
    );
  }
);

AnimatedInput.displayName = "AnimatedInput";

