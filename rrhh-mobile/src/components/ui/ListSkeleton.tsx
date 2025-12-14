import { memo, useMemo } from "react";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import { YStack } from "tamagui";
import { Skeleton } from "@/components/ui/Skeleton";

interface ListSkeletonProps {
  items?: number;
  height?: number;
  radius?: number;
  gap?: number;
}

export const ListSkeleton = memo(({ items = 3, height = 72, radius = 22, gap = 12 }: ListSkeletonProps) => {
  const placeholders = useMemo(() => Array.from({ length: items }), [items]);
  const shouldReduceMotion = useReducedMotion();

  return (
    <YStack gap={gap}>
      {placeholders.map((_, index) => (
        <Animated.View
          key={`skeleton-${index}`}
          entering={shouldReduceMotion ? undefined : FadeInDown.delay(index * 60)}
        >
          <Skeleton height={height} borderRadius={radius} />
        </Animated.View>
      ))}
    </YStack>
  );
});

ListSkeleton.displayName = "ListSkeleton";
