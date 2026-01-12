import { Screen } from "@/components/ui/Screen";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RoleSwitcher } from "@/components/admin/RoleSwitcher";
import { employeeService } from "@/services/employeeService";
import { useAuthStore } from "@/store/auth";
import { formatDateLabel, formatHour } from "@/utils/datetime";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useMemo } from "react";
import { format } from "date-fns";
import {
  AnimatePresence,
  Paragraph,
  SizableText,
  Spinner,
  Text,
  XStack,
  YStack,
  Button
} from "tamagui";
import { LogIn, LogOut, Coffee, Briefcase } from "@tamagui/lucide-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

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

  const sortedSessions = useMemo(() => {
    const sessions = attendanceQuery.data?.data ?? [];
    return [...sessions].sort((a, b) => {
      const dA = a.work_date ?? "";
      const dB = b.work_date ?? "";
      if (dA !== dB) return dB.localeCompare(dA);
      return (b.start_time ?? "").localeCompare(a.start_time ?? "");
    });
  }, [attendanceQuery.data?.data]);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const activeToday = sortedSessions.find((s) => s.work_date === todayStr && !s.end_time);
  const currentSession = activeToday ?? sortedSessions[0];

  const activeOpenSession = useMemo(() => sortedSessions.find((s) => !s.end_time), [sortedSessions]);
  const sessionForActions = activeOpenSession ?? currentSession ?? null;

  const invalidateAttendance = () =>
    queryClient.invalidateQueries({ queryKey: ["attendance"] });

  const stage = useMemo(() => {
    const session = sessionForActions;
    if (!session) return "idle";
    if (session.end_time) return "finished";
    if (session.lunch_end) return "resumed";
    if (session.lunch_start) return "lunch";
    if (session.start_time) return "started";
    return "idle";
  }, [sessionForActions]);

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

  const isEntradaDisabled = Boolean(sessionForActions?.start_time) || startMutation.isPending;
  const isAlmuerzoDisabled = !sessionForActions?.start_time || Boolean(sessionForActions?.lunch_start) || Boolean(sessionForActions?.end_time) || lunchStartMutation.isPending;
  const isFinAlmuerzoDisabled = !sessionForActions?.lunch_start || Boolean(sessionForActions?.lunch_end) || Boolean(sessionForActions?.end_time) || lunchEndMutation.isPending;
  const isSalidaDisabled = !sessionForActions?.start_time || Boolean(sessionForActions?.end_time) || endMutation.isPending;
  // Si está "bloqueado", simplemente no hace nada (return), pero el botón sigue viéndose azul.
  const handlePress = (action: () => void, isDisabled: boolean) => {
    if (isDisabled) return; 
    action();
  };

  // Estilo común OBLIGATORIO para todos
  const commonButtonProps = {
    width: "48%",
    height: "$8",
    backgroundColor: "#1d4ed8",
    borderRadius: "$6",
    justifyContent: "center",
    alignItems: "center",
    pressStyle: { scale: 0.95 },
    animation: "bouncy",
    disabled: false,
    iconAfter: false,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "rgba(37,99,235,0.35)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
    color: "white",
    fontWeight: "bold",
    fontSize: "$4"
  } as const;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <YStack gap="$5" flex={1}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text fontSize="$6" color="$text" fontFamily="$heading">
            Hola, {user?.first_name}
          </Text>
          <Paragraph color="$text" opacity={0.7}>
            {user?.employeeDetail?.department?.name} · {user?.employeeDetail?.role?.name}
          </Paragraph>
        </Animated.View>

        <RoleSwitcher target="admin" />

        <AnimatePresence exitBeforeEnter>
          <GlassCard key={stage} enterStyle={{ opacity: 0, scale: 0.95 }} exitStyle={{ opacity: 0, scale: 1.02 }}>
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontFamily="$heading" fontSize="$6" color="$text">
                {stageLabel[stage]}
              </Text>
              <StatusBadge
                label={formatDateLabel((sessionForActions ?? currentSession)?.work_date ?? new Date().toISOString())}
                color="#2563eb"
              />
            </XStack>
            <XStack justifyContent="space-between" mt="$2">
              <YStack>
                <Text color="$text" opacity={0.6}>Entrada</Text>
                <Text color="$text" fontSize="$6">
                  {formatHour((sessionForActions ?? currentSession)?.start_time)}
                </Text>
              </YStack>
              <YStack alignItems="center">
                <Text color="$text" opacity={0.6}>Almuerzo</Text>
                <Text color="$text" fontSize="$6">
                  {formatHour((sessionForActions ?? currentSession)?.lunch_start)} / {formatHour((sessionForActions ?? currentSession)?.lunch_end)}
                </Text>
              </YStack>
              <YStack alignItems="flex-end">
                <Text color="$text" opacity={0.6}>Salida</Text>
                <Text color="$text" fontSize="$6">
                  {formatHour((sessionForActions ?? currentSession)?.end_time)}
                </Text>
              </YStack>
            </XStack>
          </GlassCard>
        </AnimatePresence>

        <GlassCard gap="$4">
          <XStack alignItems="center" justifyContent="space-between">
            <SizableText size="$4" color="$text" opacity={0.85}>
              Control de jornada
            </SizableText>
            {anyLoading ? (
              <XStack alignItems="center" gap="$2">
                <Spinner size="small" color="$text" />
                <Text color="$text" opacity={0.7}>
                  Sincronizando
                </Text>
              </XStack>
            ) : null}
          </XStack>

          <YStack gap="$3" width="100%">
            <XStack width="100%" justifyContent="space-between">
              <Button
                {...commonButtonProps}
                opacity={isEntradaDisabled ? 0.5 : 1}
                onPress={() => handlePress(() => startMutation.mutate(), isEntradaDisabled)}
                icon={startMutation.isPending ? <Spinner color="white" /> : <LogIn size={24} color="white" />}
              >
                Entrada
              </Button>

              <Button
                {...commonButtonProps}
                opacity={isAlmuerzoDisabled ? 0.5 : 1}
                onPress={() => handlePress(() => lunchStartMutation.mutate(), isAlmuerzoDisabled)}
                icon={lunchStartMutation.isPending ? <Spinner color="white" /> : <Coffee size={24} color="white" />}
              >
                Almuerzo
              </Button>
            </XStack>

            <XStack width="100%" justifyContent="space-between">
              <Button
                {...commonButtonProps}
                opacity={isFinAlmuerzoDisabled ? 0.5 : 1}
                onPress={() => handlePress(() => lunchEndMutation.mutate(), isFinAlmuerzoDisabled)}
                icon={lunchEndMutation.isPending ? <Spinner color="white" /> : <Briefcase size={24} color="white" />}
              >
                Fin Almuerzo
              </Button>

              <Button
                {...commonButtonProps}
                opacity={isSalidaDisabled ? 0.5 : 1}
                onPress={() => handlePress(() => endMutation.mutate(), isSalidaDisabled)}
                icon={endMutation.isPending ? <Spinner color="white" /> : <LogOut size={24} color="white" />}
              >
                Salida
              </Button>
            </XStack>
          </YStack>
        </GlassCard>
      </YStack>
    </Screen>
  );
}