import { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedStyle } from "react-native-reanimated";

interface SkeletonProps {
  width?: ViewStyle["width"];
  height?: ViewStyle["height"];
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton = ({ width = "100%", height = 16, borderRadius = 12, style }: SkeletonProps): JSX.Element => {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const baseStyle: ViewStyle = {
    width,
    height,
    borderRadius,
    backgroundColor: "#1f2937"
  };

  return <Animated.View style={[baseStyle, style, animatedStyle]} />;
};
