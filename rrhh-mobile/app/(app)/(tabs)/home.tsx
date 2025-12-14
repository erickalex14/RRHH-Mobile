import { Screen } from "@/components/ui/Screen";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RoleSwitcher } from "@/components/admin/RoleSwitcher";
import { employeeService } from "@/services/employeeService";
import { useAuthStore } from "@/store/auth";
import { formatDateLabel, formatHour } from "@/utils/datetime";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useMemo } from "react";
import {
  AnimatePresence,
  Paragraph,
  SizableText,
  Spinner,
  Text,
  XStack,
  YStack
} from "tamagui";
import Animated, { FadeInDown, FadeOutUp, Layout } from "react-native-reanimated";

const stageLabel: Record<string, string> = {
  idle: "Pendiente de registro",
  started: "Jornada en curso",
  lunch: "Almuerzo en proceso",
  resumed: "Jornada reiniciada",
  finished: "Jornada finalizada"
};

export default function HomeScreen(): JSX.Element {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const attendanceQuery = useQuery({
    queryKey: ["attendance"],
    queryFn: employeeService.getAttendance
  });

  const currentSession = attendanceQuery.data?.data?.[0];

  const stage = useMemo(() => {
    if (!currentSession) return "idle";
    if (currentSession?.end_time) return "finished";
    if (currentSession?.lunch_end) return "resumed";
    if (currentSession?.lunch_start) return "lunch";
    if (currentSession?.start_time) return "started";
    return "idle";
  }, [currentSession]);

  const invalidateAttendance = () => queryClient.invalidateQueries({ queryKey: ["attendance"] });

  const startMutation = useMutation({
    mutationFn: employeeService.startWork,
    onSuccess: invalidateAttendance
  });
  const lunchStartMutation = useMutation({
    mutationFn: employeeService.startLunch,
    onSuccess: invalidateAttendance
  });
  const lunchEndMutation = useMutation({
    mutationFn: employeeService.endLunch,
    onSuccess: invalidateAttendance
  });
  const endMutation = useMutation({
    mutationFn: employeeService.endWork,
    onSuccess: invalidateAttendance
  });

  const anyLoading = attendanceQuery.isFetching;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <YStack gap="$4" flex={1}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text fontSize="$6" color="$text">
            Hola, {user?.first_name}
          </Text>
          <Paragraph color="$text" opacity={0.7}>
            {user?.employeeDetail?.department?.name} · {user?.employeeDetail?.role?.name}
          </Paragraph>
        </Animated.View>

        <RoleSwitcher target="admin" />

        <AnimatePresence exitBeforeEnter>
          <YStack
            key={stage}
            backgroundColor="$surface"
            borderRadius="$4"
            px="$4"
            py="$5"
            gap="$3"
            enterStyle={{ opacity: 0, scale: 0.95 }}
            exitStyle={{ opacity: 0, scale: 1.02 }}
          >
            <Text fontFamily="$heading" fontSize="$6" color="$text">
              {stageLabel[stage]}
            </Text>
            <StatusBadge
              label={formatDateLabel(currentSession?.work_date ?? new Date().toISOString())}
              color="#2563eb"
            />
            <XStack justifyContent="space-between">
              <YStack>
                <Text color="$text" opacity={0.6}>
                  Entrada
                </Text>
                <Text color="$text" fontSize="$6">
                  {formatHour(currentSession?.start_time)}
                </Text>
              </YStack>
              <YStack alignItems="center">
                <Text color="$text" opacity={0.6}>
                  Almuerzo
                </Text>
                <Text color="$text" fontSize="$6">
                  {formatHour(currentSession?.lunch_start)} / {formatHour(currentSession?.lunch_end)}
                </Text>
              </YStack>
              <YStack alignItems="flex-end">
                <Text color="$text" opacity={0.6}>
                  Salida
                </Text>
                <Text color="$text" fontSize="$6">
                  {formatHour(currentSession?.end_time)}
                </Text>
              </YStack>
            </XStack>
          </YStack>
        </AnimatePresence>

        <YStack gap="$3">
          <SizableText size="$4" color="$text" opacity={0.75}>
            Control de jornada
          </SizableText>
          <Animated.View layout={Layout.springify()}>
            <XStack gap="$3" flexWrap="wrap">
              <AnimatedButton
                flex={1}
                disabled={Boolean(currentSession?.start_time) || startMutation.isPending}
                onPress={() => startMutation.mutate()}
              >
                {startMutation.isPending ? <Spinner color="$text" /> : "Registrar entrada"}
              </AnimatedButton>
              <AnimatedButton
                flex={1}
                disabled={!currentSession?.start_time || Boolean(currentSession?.lunch_start) || lunchStartMutation.isPending}
                backgroundColor="$brandSecondary"
                onPress={() => lunchStartMutation.mutate()}
              >
                {lunchStartMutation.isPending ? <Spinner color="$text" /> : "Iniciar almuerzo"}
              </AnimatedButton>
            </XStack>
          </Animated.View>
          <Animated.View layout={Layout.springify()}>
            <XStack gap="$3" flexWrap="wrap">
              <AnimatedButton
                flex={1}
                disabled={!currentSession?.lunch_start || Boolean(currentSession?.lunch_end) || lunchEndMutation.isPending}
                onPress={() => lunchEndMutation.mutate()}
              >
                {lunchEndMutation.isPending ? <Spinner color="$text" /> : "Terminar almuerzo"}
              </AnimatedButton>
              <AnimatedButton
                flex={1}
                disabled={!currentSession?.start_time || Boolean(currentSession?.end_time) || endMutation.isPending}
                backgroundColor="$success"
                onPress={() => endMutation.mutate()}
              >
                {endMutation.isPending ? <Spinner color="$text" /> : "Registrar salida"}
              </AnimatedButton>
            </XStack>
          </Animated.View>
        </YStack>

        {anyLoading ? (
          <XStack mt="$4" alignItems="center" gap="$2">
            <Spinner color="$text" />
            <Text color="$text">Sincronizando con el servidor...</Text>
          </XStack>
        ) : null}
      </YStack>
    </Screen>
  );
}

