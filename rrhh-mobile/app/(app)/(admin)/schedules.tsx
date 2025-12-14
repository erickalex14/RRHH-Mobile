import { useCallback, useMemo, useState } from "react";
import { Platform } from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent
} from "@react-native-community/datetimepicker";
import { Stack } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { InteractiveCard } from "@/components/ui/InteractiveCard";
import { RoleSwitcher } from "@/components/admin/RoleSwitcher";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminService, SchedulePayload } from "@/services/adminService";
import { useConfirm } from "@/hooks/useConfirm";
import { Schedule } from "@/types/api";
import {
  AnimatePresence,
  Paragraph,
  ScrollView,
  Separator,
  Switch,
  Text,
  XStack,
  YStack
} from "tamagui";

type TimeField = "start_time" | "end_time" | "lunch_start" | "lunch_end";

type FeedbackState = { type: "success" | "error"; message: string } | null;

type PickerState = {
  field: TimeField | null;
  visible: boolean;
};

const emptyForm: SchedulePayload = {
  name: "",
  start_time: "",
  end_time: "",
  lunch_start: "",
  lunch_end: "",
  active: true
};

const timeFieldCopy: Record<TimeField, { label: string; helper: string }> = {
  start_time: {
    label: "Inicio de jornada",
    helper: "Hora en la que inicia el turno"
  },
  end_time: {
    label: "Fin de jornada",
    helper: "Hora en la que termina el turno"
  },
  lunch_start: {
    label: "Inicio de almuerzo",
    helper: "Debe estar dentro del horario laboral"
  },
  lunch_end: {
    label: "Fin de almuerzo",
    helper: "Debe ser posterior al inicio de almuerzo"
  }
};

const timeFields: TimeField[] = ["start_time", "end_time", "lunch_start", "lunch_end"];

const pad = (value: number): string => String(value).padStart(2, "0");

const normalizeIncomingTime = (value?: string | null): string => {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.length >= 5) {
    return trimmed.slice(0, 5);
  }
  return trimmed;
};

const toDateValue = (value: string): Date => {
  const now = new Date();
  const [hours, minutes] = value.split(":").map((chunk) => Number(chunk));
  now.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return now;
};

const formatTimeFromDate = (date: Date): string => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const ensurePayloadTime = (value: string): string => {
  if (!value) return value;
  return value.length === 5 ? `${value}:00` : value;
};

const toMinutes = (value: string): number | null => {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map((chunk) => Number(chunk));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
};

export default function AdminSchedulesScreen(): JSX.Element {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SchedulePayload>(emptyForm);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [pickerState, setPickerState] = useState<PickerState>({ field: null, visible: false });
  const [showValidationHint, setShowValidationHint] = useState(false);
  const confirm = useConfirm();

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
    error: schedulesError
  } = useQuery({
    queryKey: ["admin", "schedules"],
    queryFn: adminService.getSchedules
  });

  const schedules = data?.data ?? [];

  const closeFeedback = useCallback(() => {
    setTimeout(() => setFeedback(null), 2400);
  }, []);

  const showFeedbackMessage = useCallback((type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    closeFeedback();
  }, [closeFeedback]);

  const invalidateSchedules = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin", "schedules"] });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (payload: SchedulePayload) => adminService.createSchedule(payload),
    onSuccess: () => {
      setForm(emptyForm);
      setEditingSchedule(null);
      showFeedbackMessage("success", "Horario creado correctamente");
      invalidateSchedules();
      setShowValidationHint(false);
    },
    onError: () => showFeedbackMessage("error", "No se pudo crear el horario")
  });

  const updateMutation = useMutation({
    mutationFn: ({ scheduleId, payload }: { scheduleId: number; payload: SchedulePayload }) =>
      adminService.updateSchedule(scheduleId, payload),
    onSuccess: () => {
      setForm(emptyForm);
      setEditingSchedule(null);
      showFeedbackMessage("success", "Horario actualizado");
      invalidateSchedules();
      setShowValidationHint(false);
    },
    onError: () => showFeedbackMessage("error", "No se pudo actualizar el horario")
  });

  const deleteMutation = useMutation({
    mutationFn: (scheduleId: number) => adminService.deleteSchedule(scheduleId),
    onSuccess: () => {
      showFeedbackMessage("success", "Horario eliminado");
      invalidateSchedules();
      if (editingSchedule && editingSchedule.schedule_id === deleteMutation.variables) {
        setEditingSchedule(null);
        setForm(emptyForm);
      }
    },
    onError: () => showFeedbackMessage("error", "No se pudo eliminar el horario")
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const handleTimeSelection = useCallback((field: TimeField, date?: Date) => {
    if (!date) return;
    const formatted = formatTimeFromDate(date);
    setForm((prev) => ({ ...prev, [field]: formatted }));
  }, []);

  const handleTimePicker = useCallback((field: TimeField) => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        mode: "time",
        is24Hour: true,
        value: form[field] ? toDateValue(form[field]) : toDateValue("09:00"),
        onChange: (_event: DateTimePickerEvent, selectedDate?: Date) => {
          if (selectedDate) {
            handleTimeSelection(field, selectedDate);
          }
        }
      });
      return;
    }
    setPickerState({ field, visible: true });
  }, [form, handleTimeSelection]);

  const closePicker = useCallback(() => {
    setPickerState({ field: null, visible: false });
  }, []);

  const validationMessage = useMemo(() => {
    if (!form.name.trim()) {
      return "El nombre del horario es obligatorio.";
    }
    const requiredFieldsFilled = timeFields.every((field) => form[field].trim().length > 0);
    if (!requiredFieldsFilled) {
      return "Selecciona todas las horas requeridas.";
    }
    const startMinutes = toMinutes(form.start_time);
    const endMinutes = toMinutes(form.end_time);
    const lunchStartMinutes = toMinutes(form.lunch_start);
    const lunchEndMinutes = toMinutes(form.lunch_end);
    if (
      startMinutes === null ||
      endMinutes === null ||
      lunchStartMinutes === null ||
      lunchEndMinutes === null
    ) {
      return "Las horas seleccionadas no son válidas.";
    }
    if (startMinutes >= endMinutes) {
      return "La jornada debe terminar después de la hora de inicio.";
    }
    if (lunchStartMinutes >= lunchEndMinutes) {
      return "El almuerzo debe iniciar antes de finalizar.";
    }
    if (lunchStartMinutes < startMinutes || lunchEndMinutes > endMinutes) {
      return "El almuerzo debe estar dentro del horario laboral.";
    }
    return null;
  }, [form]);

  const formIsValid = validationMessage === null;

  const payload = useMemo<SchedulePayload | null>(() => {
    if (!formIsValid) {
      return null;
    }
    return {
      name: form.name.trim(),
      start_time: ensurePayloadTime(form.start_time),
      end_time: ensurePayloadTime(form.end_time),
      lunch_start: ensurePayloadTime(form.lunch_start),
      lunch_end: ensurePayloadTime(form.lunch_end),
      active: form.active
    };
  }, [form, formIsValid]);

  const handleSubmit = useCallback(() => {
    setShowValidationHint(true);
    if (!payload) return;
    if (editingSchedule) {
      updateMutation.mutate({ scheduleId: editingSchedule.schedule_id, payload });
      return;
    }
    createMutation.mutate(payload);
  }, [createMutation, editingSchedule, payload, updateMutation]);

  const handleSelectSchedule = useCallback((schedule: Schedule) => {
    setEditingSchedule(schedule);
    setForm({
      name: schedule.name ?? "",
      start_time: normalizeIncomingTime(schedule.start_time),
      end_time: normalizeIncomingTime(schedule.end_time),
      lunch_start: normalizeIncomingTime(schedule.lunch_start),
      lunch_end: normalizeIncomingTime(schedule.lunch_end),
      active: Boolean(schedule.active)
    });
    setShowValidationHint(false);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingSchedule(null);
    setForm(emptyForm);
    setShowValidationHint(false);
  }, []);

  const handleDeleteSchedule = useCallback(
    async (schedule: Schedule) => {
      const accepted = await confirm({
        title: "Eliminar horario",
        message: `Esta acción no se puede deshacer. ¿Deseas eliminar ${schedule.name}?`,
        confirmLabel: "Eliminar",
        destructive: true
      });
      if (!accepted) {
        return;
      }
      deleteMutation.mutate(schedule.schedule_id);
    },
    [confirm, deleteMutation]
  );

  const renderIOSPicker = (): JSX.Element | null => {
    if (Platform.OS !== "ios" || !pickerState.visible || !pickerState.field) {
      return null;
    }
    const activeField = pickerState.field;
    return (
      <YStack gap="$2" backgroundColor="$color2" p="$3" borderRadius="$5">
        <Text fontWeight="600" color="$text">
          Selecciona {timeFieldCopy[activeField].label.toLowerCase()}
        </Text>
        <DateTimePicker
          value={form[activeField] ? toDateValue(form[activeField]) : toDateValue("09:00")}
          mode="time"
          display="spinner"
          is24Hour
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            if (event.type === "dismissed") return;
            if (selectedDate) {
              handleTimeSelection(activeField, selectedDate);
            }
          }}
        />
        <AnimatedButton onPress={closePicker}>Cerrar</AnimatedButton>
      </YStack>
    );
  };

  const helperText = editingSchedule
    ? `Editando ${editingSchedule.name}`
    : "Define un nuevo horario laboral";

  const deleteIsPending = deleteMutation.isPending;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 64 }}>
        <YStack gap="$5">
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$7" color="$text">
              Horarios
            </Text>
            <Paragraph color="$muted">
              Configura turnos reutilizables para asignarlos al personal.
            </Paragraph>
          </YStack>

          <RoleSwitcher target="employee" />

          <YStack gap="$3" backgroundColor="$brandBg" p="$4" borderRadius="$6">
            <Text fontFamily="$heading" fontSize="$5" color="$text">
              {editingSchedule ? "Editar horario" : "Nuevo horario"}
            </Text>
            <Paragraph color="$muted">{helperText}</Paragraph>

            <AnimatedInput
              label="Nombre"
              placeholder="Turno matutino"
              value={form.name}
              onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
            />

            <YStack gap="$3">
              {timeFields.map((field) => (
                <YStack key={field} gap="$1">
                  <Text fontWeight="600" color="$text">
                    {timeFieldCopy[field].label}
                  </Text>
                  <Paragraph color="$muted" fontSize="$2">
                    {timeFieldCopy[field].helper}
                  </Paragraph>
                  <AnimatedButton
                    backgroundColor="$color3"
                    color="$text"
                    onPress={() => handleTimePicker(field)}
                  >
                    {form[field] ? `${form[field]} h` : "Seleccionar hora"}
                  </AnimatedButton>
                </YStack>
              ))}
            </YStack>

            <XStack alignItems="center" justifyContent="space-between" mt="$1">
              <YStack gap="$1">
                <Text fontWeight="600" color="$text">
                  Activo
                </Text>
                <Paragraph color="$muted" fontSize="$2">
                  Usa el switch para habilitar o pausar el horario.
                </Paragraph>
              </YStack>
              <Switch
                size="$3"
                checked={form.active}
                onCheckedChange={(value) => setForm((prev) => ({ ...prev, active: Boolean(value) }))}
              >
                <Switch.Thumb animation="quick" />
              </Switch>
            </XStack>

            {showValidationHint && validationMessage ? (
              <AnimatedNotice variant="warning" message={validationMessage} />
            ) : null}

            {renderIOSPicker()}

            <XStack gap="$3" mt="$2">
              {editingSchedule ? (
                <AnimatedButton
                  flex={1}
                  backgroundColor="$color4"
                  color="$text"
                  disabled={isMutating}
                  onPress={handleCancelEdit}
                >
                  Cancelar
                </AnimatedButton>
              ) : null}
              <AnimatedButton
                flex={1}
                disabled={!formIsValid || isMutating}
                onPress={handleSubmit}
              >
                {editingSchedule ? "Guardar cambios" : "Crear"}
              </AnimatedButton>
            </XStack>
          </YStack>

          <XStack gap="$3">
            <AnimatedButton
              flex={1}
              backgroundColor="$color4"
              color="$text"
              disabled={isLoading || isFetching}
              onPress={() => refetch()}
            >
              {isFetching ? "Actualizando..." : "Actualizar"}
            </AnimatedButton>
          </XStack>

          <YStack gap="$3">
            <Text fontFamily="$heading" fontSize="$5" color="$text">
              Horarios registrados
            </Text>
            {isLoading || isFetching ? (
              <ListSkeleton items={4} height={140} />
            ) : isError ? (
              <AnimatedNotice
                variant="error"
                title="No pudimos cargar los horarios"
                message={schedulesError instanceof Error ? schedulesError.message : undefined}
                actionLabel="Reintentar"
                onAction={() => refetch()}
              />
            ) : schedules.length === 0 ? (
              <AnimatedNotice variant="info" message="Aún no registras horarios." />
            ) : (
              <Animated.FlatList<Schedule>
                data={schedules}
                keyExtractor={(item) => String(item.schedule_id)}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <Separator backgroundColor="$color4" />}
                renderItem={({ item, index }) => (
                  <Animated.View entering={FadeInDown.delay(index * 85)}>
                    <InteractiveCard onPress={() => handleSelectSchedule(item)}>
                      <YStack gap="$2">
                        <XStack justifyContent="space-between" alignItems="center">
                          <Text fontWeight="600" fontSize="$4" color="$text">
                            {item.name}
                          </Text>
                          <StatusBadge
                            label={item.active ? "Activo" : "Inactivo"}
                            color={item.active ? "#059669" : "#9ca3af"}
                          />
                        </XStack>
                        <Paragraph color="$muted">
                          Jornada: {normalizeIncomingTime(item.start_time)} - {normalizeIncomingTime(item.end_time)}
                        </Paragraph>
                        <Paragraph color="$muted">
                          Almuerzo: {normalizeIncomingTime(item.lunch_start)} - {normalizeIncomingTime(item.lunch_end)}
                        </Paragraph>
                        <XStack gap="$2" mt="$2">
                          <AnimatedButton
                            flex={1}
                            backgroundColor="$color4"
                            color="$text"
                            onPress={() => handleSelectSchedule(item)}
                          >
                            Editar
                          </AnimatedButton>
                          <AnimatedButton
                            flex={1}
                            backgroundColor="$danger"
                            color="#fff"
                            disabled={deleteIsPending}
                            onPress={() => handleDeleteSchedule(item)}
                          >
                            Eliminar
                          </AnimatedButton>
                        </XStack>
                      </YStack>
                    </InteractiveCard>
                  </Animated.View>
                )}
              />
            )}
          </YStack>

          <AnimatePresence>
            {feedback ? (
              <AnimatedNotice
                variant={feedback.type}
                message={feedback.message}
                actionLabel="Cerrar"
                onAction={() => setFeedback(null)}
              />
            ) : null}
          </AnimatePresence>
        </YStack>
      </ScrollView>
    </Screen>
  );
}

