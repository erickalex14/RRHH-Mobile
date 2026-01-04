import { Screen } from "@/components/ui/Screen";
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

  // Condiciones lógicas (Booleanos simples)
  const isEntradaDisabled = Boolean(currentSession?.start_time) || startMutation.isPending;
  const isAlmuerzoDisabled = !currentSession?.start_time || Boolean(currentSession?.lunch_start) || Boolean(currentSession?.end_time) || lunchStartMutation.isPending;
  const isFinAlmuerzoDisabled = !currentSession?.lunch_start || Boolean(currentSession?.lunch_end) || Boolean(currentSession?.end_time) || lunchEndMutation.isPending;
  const isSalidaDisabled = !currentSession?.start_time || Boolean(currentSession?.end_time) || endMutation.isPending;

  // ESTA ES LA MAGIA:
  // Función que decide si ejecutar la acción o no.
  // Si está "bloqueado", simplemente no hace nada (return), pero el botón sigue viéndose azul.
  const handlePress = (action: () => void, isDisabled: boolean) => {
    if (isDisabled) return; 
    action();
  };

  // Estilo común OBLIGATORIO para todos
  const commonButtonProps = {
    width: "48%",         // Ocupar casi la mitad
    height: "$8",         // Altura fija grande
    backgroundColor: "#2563EB", // AZUL SIEMPRE
    borderRadius: "$6",
    justifyContent: "center",
    alignItems: "center",
    pressStyle: { scale: 0.95 },
    animation: "bouncy",
    disabled: false,      // <--- TRUCO: NUNCA LE DECIMOS QUE ESTÁ DESHABILITADO
    iconAfter: false,
    borderWidth: 0,
    color: "white",
    fontWeight: "bold",
    fontSize: "$4"
  } as const;

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
                <Text color="$text" opacity={0.6}>Entrada</Text>
                <Text color="$text" fontSize="$6">
                  {formatHour(currentSession?.start_time)}
                </Text>
              </YStack>
              <YStack alignItems="center">
                <Text color="$text" opacity={0.6}>Almuerzo</Text>
                <Text color="$text" fontSize="$6">
                  {formatHour(currentSession?.lunch_start)} / {formatHour(currentSession?.lunch_end)}
                </Text>
              </YStack>
              <YStack alignItems="flex-end">
                <Text color="$text" opacity={0.6}>Salida</Text>
                <Text color="$text" fontSize="$6">
                  {formatHour(currentSession?.end_time)}
                </Text>
              </YStack>
            </XStack>
          </YStack>
        </AnimatePresence>

        {/* CONTENEDOR DE BOTONES */}
        <YStack gap="$3" width="100%" paddingHorizontal="$2">
          <SizableText size="$4" color="$text" opacity={0.75} marginBottom="$2">
            Control de jornada
          </SizableText>
          
          {/* FILA 1 */}
          <XStack width="100%" justifyContent="space-between" marginBottom="$3">
            {/* BOTÓN 1: ENTRADA */}
            <Button
              {...commonButtonProps}
              opacity={isEntradaDisabled ? 0.5 : 1} // Solo cambiamos la transparencia manual
              onPress={() => handlePress(() => startMutation.mutate(), isEntradaDisabled)}
              icon={startMutation.isPending ? <Spinner color="white" /> : <LogIn size={24} color="white" />}
            >
              Entrada
            </Button>

            {/* BOTÓN 2: ALMUERZO */}
            <Button
              {...commonButtonProps}
              opacity={isAlmuerzoDisabled ? 0.5 : 1}
              onPress={() => handlePress(() => lunchStartMutation.mutate(), isAlmuerzoDisabled)}
              icon={lunchStartMutation.isPending ? <Spinner color="white" /> : <Coffee size={24} color="white" />}
            >
              Almuerzo
            </Button>
          </XStack>

          {/* FILA 2 */}
          <XStack width="100%" justifyContent="space-between">
            {/* BOTÓN 3: FIN ALMUERZO */}
            <Button
              {...commonButtonProps}
              opacity={isFinAlmuerzoDisabled ? 0.5 : 1}
              onPress={() => handlePress(() => lunchEndMutation.mutate(), isFinAlmuerzoDisabled)}
              icon={lunchEndMutation.isPending ? <Spinner color="white" /> : <Briefcase size={24} color="white" />}
            >
              Fin Almuerzo
            </Button>

            {/* BOTÓN 4: SALIDA */}
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

        {anyLoading ? (
          <XStack mt="$4" alignItems="center" gap="$2" justifyContent="center">
            <Spinner size="small" color="$text" />
            <Text color="$text" fontSize="$2" opacity={0.7}>Sincronizando...</Text>
          </XStack>
        ) : null}
      </YStack>
    </Screen>
  );
}