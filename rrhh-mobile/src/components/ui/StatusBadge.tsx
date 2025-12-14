import { XStack, Text } from "tamagui";
import { ReactNode } from "react";

interface StatusBadgeProps {
  label: string;
  color?: string;
  icon?: ReactNode;
}

export const StatusBadge = ({ label, color = "#2563eb", icon }: StatusBadgeProps): JSX.Element => (
  <XStack
    backgroundColor={color}
    px="$3"
    py="$1"
    borderRadius="$4"
    alignItems="center"
    gap="$1"
  >
    {icon}
    <Text color="#fff" fontSize={12} fontWeight="600">
      {label}
    </Text>
  </XStack>
);

