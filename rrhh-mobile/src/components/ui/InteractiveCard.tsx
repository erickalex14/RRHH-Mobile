import { PropsWithChildren, useCallback } from "react";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import { YStack, YStackProps } from "tamagui";
import { springConfig } from "@/theme/motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type InteractiveCardProps = YStackProps & PropsWithChildren<{ onPress?: () => void }>;

export const InteractiveCard = ({ children, onPress, ...stackProps }: InteractiveCardProps) => {
  const scale = useSharedValue(1);
  const shouldReduceMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(
    () => (
      shouldReduceMotion
        ? {}
        : {
            transform: [{ scale: scale.value }]
          }
    ),
    [shouldReduceMotion]
  );

  const handlePressIn = useCallback(() => {
    if (shouldReduceMotion) return;
    scale.value = withSpring(0.97, springConfig);
  }, [scale, shouldReduceMotion]);

  const handlePressOut = useCallback(() => {
    if (shouldReduceMotion) return;
    scale.value = withSpring(1, springConfig);
  }, [scale, shouldReduceMotion]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[{ width: "100%" }, animatedStyle]}
    >
      <YStack
        borderWidth={1}
        borderColor="$borderColor"
        backgroundColor="$color2"
        borderRadius="$6"
        padding="$4"
        gap="$2"
        hoverStyle={{ borderColor: "$color8", translateY: -2 }}
        pressStyle={{ backgroundColor: "$color3" }}
        {...stackProps}
      >
        {children}
      </YStack>
    </AnimatedPressable>
  );
};
