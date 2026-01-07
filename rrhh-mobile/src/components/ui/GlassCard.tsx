import { LinearGradient } from "expo-linear-gradient";
import { memo, type ComponentProps } from "react";
import { Platform } from "react-native";
import { YStack } from "tamagui";

type GlassCardProps = ComponentProps<typeof YStack> & { glow?: boolean };

export const GlassCard = memo(({ children, glow = true, ...props }: GlassCardProps) => {
  return (
    <YStack position="relative" overflow="hidden" borderRadius={props.borderRadius ?? "$5"}>
      {glow ? (
        <LinearGradient
          colors={["rgba(59,130,246,0.25)", "rgba(236,72,153,0.16)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            top: -120,
            left: -120,
            width: "220%",
            height: "220%",
            opacity: 0.9,
            transform: [{ rotate: "-8deg" }]
          }}
        />
      ) : null}

      <YStack
        {...props}
        px={props.px ?? "$4"}
        py={props.py ?? "$4"}
        gap={props.gap ?? "$3"}
        bg={props.bg ?? "rgba(255,255,255,0.06)"}
        borderColor={props.borderColor ?? "rgba(255,255,255,0.12)"}
        borderWidth={props.borderWidth ?? 1}
        borderRadius={props.borderRadius ?? "$5"}
        {...(Platform.OS === "web"
          ? { style: [{ boxShadow: "0 14px 32px rgba(0,0,0,0.35)", backdropFilter: "blur(14px)" }, props.style] }
          : {
              shadowColor: "rgba(0,0,0,0.45)",
              shadowOffset: { width: 0, height: 14 },
              shadowOpacity: 0.35,
              shadowRadius: 18,
              elevation: 6
            })}
      >
        {children}
      </YStack>
    </YStack>
  );
});

GlassCard.displayName = "GlassCard";
