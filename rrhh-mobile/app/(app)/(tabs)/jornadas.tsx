import React from "react";
import { Screen } from "@/components/ui/Screen";
import { employeeService } from "@/services/employeeService";
import { formatDateLabel, formatHour } from "@/utils/datetime";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable } from "react-native";
import { Paragraph, SizableText, Spinner, Text, XStack, YStack } from "tamagui";
import Animated, { FadeInDown, FadeOutUp, Layout } from "react-native-reanimated";

export default function JornadasScreen(): JSX.Element {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["attendance"],
    queryFn: employeeService.getAttendance
  });

  const sessions = useMemo(() => data?.data ?? [], [data?.data]);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <YStack gap="$4" flex={1}>
        <Text fontFamily="$heading" fontSize="$6" color="$text">
          Historial de jornadas
        </Text>
        {isLoading ? (
          <XStack alignItems="center" gap="$2">
            <Spinner color="$text" />
            <Text color="$text">Cargando registros...</Text>
          </XStack>
        ) : (
          <Animated.FlatList
            data={sessions}
            contentContainerStyle={{ gap: 16, paddingBottom: 40 }}
            keyExtractor={(item) => String(item.session_id)}
            refreshing={isRefetching}
            onRefresh={refetch}
            renderItem={({ item, index }) => {
              const expanded = expandedId === item.session_id;
              return (
                <AnimatedPressableCard
                  index={index}
                  expanded={expanded}
                  onPress={() => setExpandedId(expanded ? null : item.session_id)}
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <YStack>
                      <Text color="$text" fontSize="$4">
                        {formatDateLabel(item.work_date)}
                      </Text>
                      <Paragraph color="$text" opacity={0.7}>
                        {formatHour(item.start_time)} � {formatHour(item.end_time) === "--:--" ? "En curso" : formatHour(item.end_time)}
                      </Paragraph>
                    </YStack>
                    <Text color="$text" opacity={0.6}>
                      #{item.session_id}
                    </Text>
                  </XStack>
                  {expanded ? (
                    <Animated.View
                      entering={FadeInDown}
                      exiting={FadeOutUp}
                      style={{ marginTop: 12 }}
                    >
                      <YStack gap="$2">
                        <DetailRow label="Entrada" value={formatHour(item.start_time)} />
                        <DetailRow label="Salida almuerzo" value={formatHour(item.lunch_start)} />
                        <DetailRow label="Regreso" value={formatHour(item.lunch_end)} />
                        <DetailRow label="Salida" value={formatHour(item.end_time)} />
                      </YStack>
                    </Animated.View>
                  ) : null}
                </AnimatedPressableCard>
              );
            }}
          />
        )}
      </YStack>
    </Screen>
  );
}

interface PressableCardProps {
  children: React.ReactNode;
  index: number;
  expanded: boolean;
  onPress: () => void;
}

const AnimatedPressableCard = ({ children, index, expanded, onPress }: PressableCardProps): JSX.Element => (
  <Animated.View
    entering={FadeInDown.delay(index * 70)}
    layout={Layout.springify()}
    style={{ backgroundColor: "#0f172a", padding: 16, borderRadius: 24 }}
  >
    <Pressable onPress={onPress} style={{ opacity: expanded ? 1 : 0.9 }}>
      {children}
    </Pressable>
  </Animated.View>
);

const DetailRow = ({ label, value }: { label: string; value: string }): JSX.Element => (
  <XStack justifyContent="space-between">
    <Text color="$text" opacity={0.7}>
      {label}
    </Text>
    <Text color="$text">{value}</Text>
  </XStack>
);
