import { useEffect } from "react";
import { ViewStyle } from "react-native";
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedStyle } from "react-native-reanimated";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton = ({ width = "100%", height = 16, borderRadius = 12, style }: SkeletonProps): JSX.Element => {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#1f2937"
        },
        style,
        animatedStyle
      ]}
    />
  );
};
