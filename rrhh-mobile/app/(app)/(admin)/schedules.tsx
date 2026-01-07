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
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminService, SchedulePayload } from "@/services/adminService";
import { useConfirm } from "@/hooks/useConfirm";
import { Schedule } from "@/types/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { LinearGradient } from "expo-linear-gradient";
import { Clock, Sun, Moon, Edit3, Trash2, Utensils } from "@tamagui/lucide-icons";
import {
  AnimatePresence,
  Paragraph,
  ScrollView,
  Separator,
  Switch,
  Text,
  XStack,
  YStack,
  H2,
  Input,
  Button
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


const formatTimeFromDate = (date: Date): string => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const ensurePayloadTime = (value: string): string => {
  if (!value) return value;
  return value.length === 5 ? `${value}:00` : value;
};

const toDateValue = (value: string): Date => {
  const now = new Date();
  const [hours, minutes] = value.split(":").map((chunk) => Number(chunk));
  now.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return now;
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
      <GlassCard
        animation="fadeIn"
        enterStyle={{ opacity: 0, scale: 0.95 }}
        p="$4"
        mb="$4"
        borderColor="$blue8"
      >
        <Text color="$blue10" fontSize="$5" fontWeight="600" mb="$2" textAlign="center">
          {timeFieldCopy[activeField].label}
        </Text>
        <XStack justifyContent="center" mb="$3">
          <DateTimePicker
            testID="ios-time-picker"
            value={form[activeField] ? toDateValue(form[activeField]) : toDateValue("09:00")}
            mode="time"
            display="spinner"
            themeVariant="dark"
            is24Hour
            onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
              if (event.type === "dismissed") return;
              if (selectedDate) {
                handleTimeSelection(activeField, selectedDate);
              }
            }}
            style={{ height: 120, width: "100%" }}
          />
        </XStack>
        <Button
          backgroundColor="$blue8"
          color="white"
          onPress={closePicker}
        >
          Confirmar
        </Button>
      </GlassCard>
    );
  };

  const helperText = editingSchedule
    ? `Editando ${editingSchedule.name}`
    : "Define un nuevo horario laboral";

  return (
    <Screen>
      <AdminNavbar title="Horarios" />
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={{ position: 'absolute', width: '100%', height: '100%', zIndex: -1 }}
      />
      
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <YStack p="$4" space="$4">
          <GlassCard p="$5">
            <YStack space="$2">
              <H2 color="white" fontSize="$7" fontWeight="bold">
                 {editingSchedule ? "Editar horario" : "Nuevo horario"}
              </H2>
              <Text color="$gray10" fontSize="$3.5">
                {helperText}
              </Text>
            </YStack>
          </GlassCard>

          <AnimatePresence>
             {feedback && (
              <GlassCard
                animation="fadeIn"
                borderColor={feedback.type === 'success' ? '$green8' : '$red8'}
                p="$3"
              >
                <XStack space="$3" alignItems="center">
                  <Text color={feedback.type === 'success' ? '$green8' : '$red8'} fontSize="$3.5">
                    {feedback.message}
                  </Text>
                </XStack>
              </GlassCard>
            )}
            
            {showValidationHint && validationMessage && (
               <GlassCard
                animation="fadeIn"
                borderColor="$orange8"
                p="$3"
              >
                <XStack space="$3" alignItems="center">
                  <Text color="$orange10" fontSize="$3.5">
                    {validationMessage}
                  </Text>
                </XStack>
              </GlassCard>
            )}
          </AnimatePresence>

          <GlassCard p="$5" space="$4">
            <AnimatedInput
              label="Nombre del Horario"
              value={form.name}
              onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
              placeholder="Ej. Jornada Completa"
            />

             {/* Time Fields Grid */}
            <YStack space="$4">
              <XStack space="$2" alignItems="center" mb="$1">
                <Clock size={16} color="#60a5fa" />
                <Text color="$blue9" fontWeight="600">Configuración de Tiempos</Text>
              </XStack>
              
              <XStack flexWrap="wrap" gap="$3">
                {timeFields.map((field) => (
                  <YStack key={field} width="48%" space="$1">
                    <Text color="$gray9" fontSize="$3" mb="$1">
                      {timeFieldCopy[field].label}
                    </Text>
                    <Button
                      onPress={() => handleTimePicker(field)}
                      backgroundColor="rgba(0,0,0,0.3)"
                      borderColor="$gray7"
                      borderWidth={1}
                      height={50}
                      justifyContent="flex-start"
                      icon={<Clock size={16} color="#94a3b8" />}
                    >
                      <Text color="white" fontSize="$3.5">
                        {form[field] ? normalizeIncomingTime(form[field]) : "--:--"}
                      </Text>
                    </Button>
                  </YStack>
                ))}
              </XStack>
              
              {renderIOSPicker()}
            </YStack>

            <Separator borderColor="$gray8" my="$2" />

             <XStack space="$4" alignItems="center" justifyContent="space-between" py="$2">
              <XStack space="$2" alignItems="center">
                <Sun size={20} color="#94a3b8" />
                <YStack>
                  <Text color="white" fontSize="$4" fontWeight="600">Estado Activo</Text>
                  <Text color="$gray10" fontSize="$2.5">Habilitar este horario</Text>
                </YStack>
              </XStack>
              <Switch
                size="$3"
                checked={form.active}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, active: Boolean(checked) }))}
              >
                <Switch.Thumb animation="quick" backgroundColor="white" />
              </Switch>
            </XStack>

            <XStack space="$3" mt="$4">
              {editingSchedule && (
                <AnimatedButton
                  flex={1}
                  onPress={handleCancelEdit}
                  backgroundColor="rgba(239, 68, 68, 0.2)"
                >
                  Cancelar
                </AnimatedButton>
              )}
              <AnimatedButton
                flex={2}
                onPress={handleSubmit}
                disabled={isMutating || !formIsValid}
              >
                {isMutating ? "Guardando..." : editingSchedule ? "Actualizar" : "Crear"}
              </AnimatedButton>
            </XStack>
          </GlassCard>

          <YStack space="$4" pb="$10">
            <XStack justifyContent="space-between" alignItems="center">
              <H2 color="white" fontSize="$6">Horarios Registrados</H2>
             <Button
                size="$3"
                circular
                backgroundColor="rgba(255,255,255,0.1)" 
                onPress={() => refetch()}
                icon={<Edit3 size={16} color="white" />} 
              />
            </XStack>

            {isLoading || isFetching ? (
              <YStack space="$3">
                {[1, 2, 3].map((i) => (
                  <ListSkeleton key={i} />
                ))}
              </YStack>
            ) : isError ? (
               <GlassCard p="$4" borderColor="$red8">
                  <Text color="$red10">Error al cargar horarios</Text>
               </GlassCard>
            ) : schedules.length === 0 ? (
               <GlassCard p="$4">
                  <Text color="white">Aún no registras horarios.</Text>
               </GlassCard>
            ) : (
              <YStack space="$3">
                {schedules.map((schedule, index) => (
                  <GlassCard
                    key={schedule.schedule_id}
                    animation="lazy"
                    enterStyle={{ opacity: 0, translateY: 20 }}
                    p="$0"
                    overflow="hidden"
                  >
                    <YStack p="$4" space="$3">
                      <XStack justifyContent="space-between" alignItems="center">
                        <XStack space="$3" alignItems="center">
                          <LinearGradient
                            colors={['#3b82f6', '#2563eb']}
                            style={{ padding: 8, borderRadius: 10 }}
                          >
                            <Clock size={20} color="white" />
                          </LinearGradient>
                          <YStack>
                            <Text color="white" fontSize="$4" fontWeight="Bold">
                              {schedule.name}
                            </Text>
                            <StatusBadge status={schedule.active ? "active" : "inactive"} />
                          </YStack>
                        </XStack>
                        
                        <XStack space="$2">
                          <Button
                            size="$3"
                            circular
                            backgroundColor="rgba(255,255,255,0.1)"
                            onPress={() => handleSelectSchedule(schedule)}
                            icon={<Edit3 size={16} color="white" />}
                          />
                          <Button
                            size="$3"
                            circular
                            backgroundColor="rgba(239, 68, 68, 0.2)"
                            onPress={() => handleDeleteSchedule(schedule)}
                            icon={<Trash2 size={16} color="$red9" />}
                          />
                        </XStack>
                      </XStack>

                      <Separator borderColor="rgba(255,255,255,0.1)" />

                      <XStack justifyContent="space-between" flexWrap="wrap" gap="$2">
                        <YStack width="48%" bg="rgba(0,0,0,0.2)" p="$2" borderRadius="$3">
                          <Text color="$gray10" fontSize="$2" mb="$1">Jornada</Text>
                          <XStack alignItems="center" space="$2">
                            <Sun size={12} color="#fbbf24" />
                            <Text color="white" fontSize="$3">
                              {normalizeIncomingTime(schedule.start_time)} - {normalizeIncomingTime(schedule.end_time)}
                            </Text>
                          </XStack>
                        </YStack>
                        
                        <YStack width="48%" bg="rgba(0,0,0,0.2)" p="$2" borderRadius="$3">
                          <Text color="$gray10" fontSize="$2" mb="$1">Almuerzo</Text>
                          <XStack alignItems="center" space="$2">
                            <Utensils size={12} color="#f87171" />
                            <Text color="white" fontSize="$3">
                              {normalizeIncomingTime(schedule.lunch_start)} - {normalizeIncomingTime(schedule.lunch_end)}
                            </Text>
                          </XStack>
                        </YStack>
                      </XStack>
                    </YStack>
                  </GlassCard>
                ))}
            </YStack>
            )}
          </YStack>
        </YStack>
      </ScrollView>
    </Screen>
  );
}

