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
  // Backend expects H:i (e.g. 09:00), so we ensure we don't send seconds
  return value.length > 5 ? value.substring(0, 5) : value;
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

  const renderTimePicker = (): JSX.Element | null => {
    if (!pickerState.visible || !pickerState.field) {
      return null;
    }
    const activeField = pickerState.field;
    
    return (
      <Animated.View entering={FadeInDown.duration(250)} style={{ marginBottom: 16 }}>
        <GlassCard
          p="$4"
          borderColor="$blue8"
        >
          <Text color="$blue10" fontSize="$5" fontWeight="600" mb="$2" textAlign="center">
            {timeFieldCopy[activeField].label}
          </Text>
          <XStack justifyContent="center" mb="$3" alignItems="center">
            {Platform.OS === 'web' ? (
                <input
                    type="time"
                    value={form[activeField] || "09:00"}
                    style={{
                        padding: '10px',
                        fontSize: '18px',
                        borderRadius: '8px',
                        border: '1px solid #475569',
                        backgroundColor: '#1e293b',
                        color: 'white',
                        width: '100%',
                        outline: 'none'
                    }}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                           const [h, m] = val.split(':');
                           const date = new Date();
                           date.setHours(Number(h));
                           date.setMinutes(Number(m));
                           handleTimeSelection(activeField, date);
                        }
                    }}
                />
            ) : (
                <DateTimePicker
                testID="time-picker"
                value={form[activeField] ? toDateValue(form[activeField]) : toDateValue("09:00")}
                mode="time"
                display={Platform.OS === 'ios' ? "spinner" : "default"}
                themeVariant="dark"
                is24Hour
                onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                    if (event.type === "dismissed") return;
                    if (selectedDate) {
                    handleTimeSelection(activeField, selectedDate);
                    }
                }}
                style={{ height: Platform.OS === 'ios' ? 120 : 50, width: "100%" }}
                />
            )}
          </XStack>
          <Button
            backgroundColor="$blue8"
            color="white"
            onPress={closePicker}
          >
            Confirmar
          </Button>
        </GlassCard>
      </Animated.View>
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
              <Animated.View entering={FadeInDown} exiting={FadeInDown} style={{ marginBottom: 8 }}>
                <GlassCard
                  borderColor={feedback.type === 'success' ? '$green8' : '$red8'}
                  p="$3"
                >
                  <XStack space="$3" alignItems="center">
                    <Text color={feedback.type === 'success' ? '$green8' : '$red8'} fontSize="$3.5">
                      {feedback.message}
                    </Text>
                  </XStack>
                </GlassCard>
              </Animated.View>
            )}
            
            {showValidationHint && validationMessage && (
               <Animated.View entering={FadeInDown} exiting={FadeInDown} style={{ marginBottom: 8 }}>
                 <GlassCard
                  borderColor="$orange8"
                  p="$3"
                >
                  <XStack space="$3" alignItems="center">
                    <Text color="$orange10" fontSize="$3.5">
                      {validationMessage}
                    </Text>
                  </XStack>
                </GlassCard>
               </Animated.View>
            )}
          </AnimatePresence>


          <GlassCard p="$6" space="$5" borderRadius="$6" shadowColor="rgba(0,0,0,0.4)" shadowOffset="0px 4px" shadowRadius={16}>
            <AnimatedInput
              label={<Text fontFamily="HeadingFont" fontSize="$5" color="white">Nombre del Horario</Text>}
              value={form.name}
              onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
              placeholder="Ej. Jornada Completa"
              inputStyle={{ fontFamily: 'HeadingFont', fontSize: 18, color: 'white' }}
            />

            {/* Time Fields Grid */}
            <YStack space="$5">
              <XStack space="$3" alignItems="center" mb="$2">
                <Clock size={20} color="#60a5fa" />
                <Text fontFamily="HeadingFont" color="$blue9" fontSize="$4" fontWeight="700">Configuración de Tiempos</Text>
              </XStack>

              <XStack flexWrap="wrap" gap="$4">
                {timeFields.map((field) => (
                  <GlassCard
                    key={field}
                    width="48%"
                    p="$5"
                    borderRadius="$8"
                    backgroundColor="rgba(40,50,80,0.55)"
                    style={{ backdropFilter: 'blur(12px)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)' }}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <YStack alignItems="center" justifyContent="center" space="$3" height={120}>
                      <Text fontFamily="HeadingFont" color="#e0e7ef" fontSize={15} textAlign="center" style={{ lineHeight: 20, paddingHorizontal: 4, fontWeight: '600' }}>
                        {timeFieldCopy[field].label}
                      </Text>
                      <AnimatedButton
                        onPress={() => handleTimePicker(field)}
                        backgroundColor="rgba(59,130,246,0.18)"
                        borderColor="rgba(255,255,255,0.12)"
                        borderWidth={1}
                        height={36}
                        minWidth={80}
                        maxWidth={110}
                        justifyContent="center"
                        alignItems="center"
                        icon={<Clock size={16} color="#e0e7ef" />}
                        borderRadius="$6"
                        px="$2"
                        style={{ marginTop: 6 }}
                      >
                        <Text fontFamily="HeadingFont" color="#e0e7ef" fontSize={15} textAlign="center" style={{ lineHeight: 20 }}>
                          {form[field] ? normalizeIncomingTime(form[field]) : "--:--"}
                        </Text>
                      </AnimatedButton>
                    </YStack>
                  </GlassCard>
                ))}
              </XStack>

              {renderTimePicker()}
            </YStack>

            <Separator borderColor="$gray8" my="$3" />

            <XStack space="$5" alignItems="center" justifyContent="space-between" py="$3">
              <XStack space="$3" alignItems="center">
                <Sun size={24} color="#94a3b8" />
                <YStack>
                  <Text fontFamily="HeadingFont" color="white" fontSize="$4.5" fontWeight="700">Estado Activo</Text>
                  <Text color="$gray10" fontSize="$3">Habilitar este horario</Text>
                </YStack>
              </XStack>
              <GlassCard p={0} backgroundColor="rgba(255,255,255,0.08)" borderRadius="$4">
                <Switch
                  size="$4"
                  checked={form.active}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, active: Boolean(checked) }))}
                  bg="transparent"
                >
                  <Switch.Thumb animation="quick" backgroundColor="white" />
                </Switch>
              </GlassCard>
            </XStack>

            <XStack space="$4" mt="$5">
              {editingSchedule && (
                <AnimatedButton
                  flex={1}
                  onPress={handleCancelEdit}
                  backgroundColor="rgba(239, 68, 68, 0.2)"
                  borderRadius="$4"
                  fontFamily="HeadingFont"
                  fontSize={18}
                  py="$3"
                >
                  Cancelar
                </AnimatedButton>
              )}
              <AnimatedButton
                flex={2}
                onPress={handleSubmit}
                disabled={isMutating || !formIsValid}
                backgroundColor="rgba(59,130,246,0.2)"
                borderRadius="$4"
                fontFamily="HeadingFont"
                fontSize={18}
                py="$3"
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
              <YStack space="$4">
                {[1, 2, 3].map((i) => (
                  <ListSkeleton key={i} />
                ))}
              </YStack>
            ) : isError ? (
               <GlassCard p="$5" borderColor="$red8" borderRadius="$5">
                  <Text fontFamily="HeadingFont" color="$red10" fontSize="$4">Error al cargar horarios</Text>
               </GlassCard>
            ) : schedules.length === 0 ? (
               <GlassCard p="$5" borderRadius="$5">
                  <Text fontFamily="HeadingFont" color="white" fontSize="$4">Aún no registras horarios.</Text>
               </GlassCard>
            ) : (
              <YStack space="$4">
                {schedules.map((schedule, index) => (
                  <GlassCard
                    key={schedule.schedule_id}
                    animation="lazy"
                    enterStyle={{ opacity: 0, translateY: 20 }}
                    p="$0"
                    overflow="hidden"
                    borderRadius="$6"
                    backgroundColor="rgba(30,41,59,0.7)"
                    shadowColor="rgba(0,0,0,0.4)"
                    shadowOffset="0px 4px"
                    shadowRadius={16}
                  >
                    <YStack p="$5" space="$4">
                      <XStack justifyContent="space-between" alignItems="center">
                        <XStack space="$4" alignItems="center">
                          <LinearGradient
                            colors={['#3b82f6', '#2563eb']}
                            style={{ padding: 10, borderRadius: 14 }}
                          >
                            <Clock size={22} color="white" />
                          </LinearGradient>
                          <YStack>
                            <Text fontFamily="HeadingFont" color="white" fontSize="$5" fontWeight="700" style={{ textDecorationLine: 'underline', textUnderlineOffset: 4 }}>
                              {schedule.name}
                            </Text>
                            <StatusBadge status={schedule.active ? "active" : "inactive"} />
                          </YStack>
                        </XStack>

                        <XStack space="$3">
                          <AnimatedButton
                            size="$4"
                            circular
                            backgroundColor="rgba(255,255,255,0.12)"
                            onPress={() => handleSelectSchedule(schedule)}
                            icon={<Edit3 size={18} color="white" />}
                            borderRadius="$4"
                          />
                          <AnimatedButton
                            size="$4"
                            circular
                            backgroundColor="rgba(239, 68, 68, 0.18)"
                            onPress={() => handleDeleteSchedule(schedule)}
                            icon={<Trash2 size={18} color="$red9" />}
                            borderRadius="$4"
                          />
                        </XStack>
                      </XStack>

                      <Separator borderColor="rgba(255,255,255,0.12)" />

                      <XStack justifyContent="space-between" flexWrap="wrap" gap="$3">
                        <GlassCard width="48%" p="$4" borderRadius="$4" backgroundColor="rgba(59,130,246,0.12)" justifyContent="center" alignItems="center">
                          <YStack alignItems="center" justifyContent="center" space="$2" height={90}>
                            <Text fontFamily="HeadingFont" color="white" fontSize={16} textAlign="center" style={{ lineHeight: 20, paddingHorizontal: 2 }}>Jornada</Text>
                            <XStack alignItems="center" space="$3">
                              <Sun size={14} color="#fbbf24" />
                              <Text fontFamily="HeadingFont" color="white" fontSize={17} textAlign="center" style={{ lineHeight: 22 }}>
                                {normalizeIncomingTime(schedule.start_time)} - {normalizeIncomingTime(schedule.end_time)}
                              </Text>
                            </XStack>
                          </YStack>
                        </GlassCard>

                        <GlassCard width="48%" p="$4" borderRadius="$4" backgroundColor="rgba(239,68,68,0.10)" justifyContent="center" alignItems="center">
                          <YStack alignItems="center" justifyContent="center" space="$2" height={90}>
                            <Text fontFamily="HeadingFont" color="white" fontSize={16} textAlign="center" style={{ lineHeight: 20, paddingHorizontal: 2 }}>Almuerzo</Text>
                            <XStack alignItems="center" space="$3">
                              <Utensils size={14} color="#f87171" />
                              <Text fontFamily="HeadingFont" color="white" fontSize={17} textAlign="center" style={{ lineHeight: 22 }}>
                                {normalizeIncomingTime(schedule.lunch_start)} - {normalizeIncomingTime(schedule.lunch_end)}
                              </Text>
                            </XStack>
                          </YStack>
                        </GlassCard>
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

