import { forwardRef, useCallback } from "react";
import { Input, InputProps, Label, YStack } from "tamagui";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { TextInput } from "react-native";

export interface AnimatedInputProps extends InputProps {
  label?: string;
  helperText?: string;
}

export const AnimatedInput = forwardRef<TextInput, AnimatedInputProps>(
  ({ label, helperText, onFocus, onBlur, ...props }, ref) => {
    const focusValue = useSharedValue(0);

    const handleFocus = useCallback<Required<InputProps>["onFocus"]>(
      (event) => {
        focusValue.value = withTiming(1, { duration: 180 });
        onFocus?.(event);
      },
      [focusValue, onFocus]
    );

    const handleBlur = useCallback<Required<InputProps>["onBlur"]>(
      (event) => {
        focusValue.value = withTiming(0, { duration: 180 });
        onBlur?.(event);
      },
      [focusValue, onBlur]
    );

    const containerStyle = useAnimatedStyle(() => ({
      borderColor: interpolateColor(focusValue.value, [0, 1], ["#1f2937", "#2563eb"]),
      shadowOpacity: focusValue.value ? 0.5 : 0,
      transform: [{ scale: focusValue.value ? 1.01 : 1 }]
    }));

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
            bg="transparent"
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
