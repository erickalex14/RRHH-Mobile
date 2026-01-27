import { useCallback, useMemo, useState } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Stack } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { InteractiveCard } from "@/components/ui/InteractiveCard";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminService, EmployeeStatePayload } from "@/services/adminService";
import { useConfirm } from "@/hooks/useConfirm";
import { EmployeeState } from "@/types/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { LinearGradient } from "expo-linear-gradient";
import { Briefcase, Edit3, Trash2 } from "@tamagui/lucide-icons";
import { AnimatePresence, Paragraph, ScrollView, Separator, Switch, Text, XStack, YStack, H2, Input, Button } from "tamagui";

type FeedbackState = { type: "success" | "error"; message: string } | null;

type EmployeeStateForm = EmployeeStatePayload;

const emptyForm: EmployeeStateForm = {
  name: "",
  description: "",
  active: true
};

export default function AdminEmployeeStatesScreen(): JSX.Element {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EmployeeStateForm>(emptyForm);
  const [editingState, setEditingState] = useState<EmployeeState | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const { data, isLoading, isFetching, isError, refetch, error } = useQuery({
    queryKey: ["admin", "employee-states"],
    queryFn: adminService.getEmployeeStates
  });

  const employeeStates = data?.data ?? [];

  const invalidateStates = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin", "employee-states"] });
  }, [queryClient]);

  const closeFeedback = useCallback(() => {
    setTimeout(() => setFeedback(null), 2200);
  }, []);

  const showFeedback = useCallback((type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    closeFeedback();
  }, [closeFeedback]);

  const handleError = useCallback(() => {
    showFeedback("error", "Ocurrió un error, intenta nuevamente.");
  }, [showFeedback]);

  const createMutation = useMutation({
    mutationFn: (payload: EmployeeStatePayload) => adminService.createEmployeeState(payload),
    onSuccess: () => {
      setForm(emptyForm);
      setEditingState(null);
      showFeedback("success", "Estado creado");
      invalidateStates();
    },
    onError: handleError
  });

  const updateMutation = useMutation({
    mutationFn: ({ employeeStateId, payload }: { employeeStateId: number; payload: EmployeeStatePayload }) =>
      adminService.updateEmployeeState(employeeStateId, payload),
    onSuccess: () => {
      setForm(emptyForm);
      setEditingState(null);
      showFeedback("success", "Estado actualizado");
      invalidateStates();
    },
    onError: handleError
  });

  const deleteMutation = useMutation({
    mutationFn: (employeeStateId: number) => adminService.deleteEmployeeState(employeeStateId),
    onSuccess: () => {
      if (editingState) {
        setEditingState(null);
        setForm(emptyForm);
      }
      showFeedback("success", "Estado eliminado");
      invalidateStates();
    },
    onError: handleError
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const formIsValid = useMemo(() => {
    return form.name.trim().length > 1 && form.description.trim().length > 2;
  }, [form.description, form.name]);

  const handleSubmit = useCallback(() => {
    if (!formIsValid) {
        showFeedback("error", "Verifica el nombre y la descripción.");
        return;
    }
    
    const payload: EmployeeStatePayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      active: form.active
    };

    if (editingState) {
      updateMutation.mutate({ employeeStateId: editingState.employee_state_id, payload });
      return;
    }
    createMutation.mutate(payload);
  }, [createMutation, editingState, form, formIsValid, updateMutation, showFeedback]);

  const handleSelectState = useCallback((state: EmployeeState) => {
    setEditingState(state);
    setForm({
      name: state.name ?? "",
      description: state.description ?? "",
      active: Boolean(state.active)
    });
  }, []);

  const resetForm = useCallback(() => {
    setEditingState(null);
    setForm(emptyForm);
  }, []);

  const confirm = useConfirm();

  const confirmDelete = useCallback(
    async (state: EmployeeState) => {
      const accepted = await confirm({
        title: "Eliminar estado",
        message: `¿Deseas eliminar ${state.name}? Esta acción no se puede deshacer.`,
        confirmLabel: "Eliminar",
        destructive: true
      });
      if (!accepted) {
        return;
      }
      deleteMutation.mutate(state.employee_state_id);
    },
    [confirm, deleteMutation]
  );

  const helperText = editingState
    ? `Editando ${editingState.name}`
    : "Define estados laborales que luego asignarás a los usuarios.";

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <YStack gap="$4" pt="$safe" px="$0">
          
          {/* Header */}
          <YStack gap="$1" mb="$2">
                <H2 fontWeight="800" fontSize={26} color="$color">Estados de empleado</H2>
                <Paragraph color="$color" opacity={0.6}>
                     Crea estados claros para controlar la situación de cada colaborador.
                </Paragraph>
          </YStack>


          {/* Form Block */}
          <GlassCard gap="$3" p="$4" borderRadius="$6">
            <Text fontFamily="$heading" fontWeight="800" fontSize={24} color="$color">
              {editingState ? "Editar estado" : "Nuevo estado"}
            </Text>
            <Text fontFamily="$heading" fontWeight="600" fontSize={16} color="$color" opacity={0.7}>
              {helperText}
            </Text>

            <AnimatedInput
              label={<Text fontFamily="$heading" fontWeight="700" fontSize={15} color="$color">Nombre</Text>}
              value={form.name}
              onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
            />
            <AnimatedInput
              label={<Text fontFamily="$heading" fontWeight="700" fontSize={15} color="$color">Descripción</Text>}
              value={form.description}
              multiline
              numberOfLines={3}
              onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
            />

            <XStack alignItems="center" justifyContent="space-between">
              <YStack gap="$1">
                <Text fontFamily="$heading" fontWeight="700" fontSize={15} color="$color">
                  ¿Activo?
                </Text>
                <Text fontFamily="$heading" fontWeight="400" fontSize={13} color="$color" opacity={0.6}>
                  Usa el switch para habilitar o suspender.
                </Text>
              </YStack>
              <GlassCard p={6} borderRadius={20} backgroundColor="rgba(37,99,235,0.18)">
                <Switch
                  size="$4"
                  checked={form.active}
                  onCheckedChange={(value: boolean) => setForm((prev) => ({ ...prev, active: Boolean(value) }))}
                  backgroundColor={form.active ? "$blue10" : "$gray8"}
                  borderColor={form.active ? "$blue8" : "$gray7"}
                  borderWidth={2}
                  style={{ minWidth: 56, minHeight: 32, borderRadius: 20, transition: 'all 0.2s' }}
                >
                  <Switch.Thumb animation="quick" backgroundColor={form.active ? "$blue2" : "white"} style={{ width: 28, height: 28, borderRadius: 14, boxShadow: form.active ? '0 0 8px #2563eb' : '0 0 4px #fff' }} />
                </Switch>
              </GlassCard>
            </XStack>

            <XStack gap="$3" mt="$2">
              {editingState ? (
                <AnimatedButton
                  flex={1}
                  backgroundColor="rgba(239, 68, 68, 0.2)"
                  disabled={isMutating}
                  onPress={resetForm}
                  fontFamily="$heading"
                  fontWeight="700"
                  fontSize={17}
                >
                  Cancelar
                </AnimatedButton>
              ) : null}
              <AnimatedButton
                flex={1}
                disabled={isMutating}
                onPress={handleSubmit}
                bg={!formIsValid ? "$gray8" : undefined}
                backgroundColor={!formIsValid ? "$gray8" : "rgba(37,99,235,0.18)"}
                color="white"
                fontFamily="$heading"
                fontWeight="700"
                fontSize={17}
              >
                {editingState ? "Guardar cambios" : "Crear estado"}
              </AnimatedButton>
            </XStack>
          </GlassCard>

          <YStack gap="$3">
            <H2 fontSize={20} color="$color" mt="$4">Estados registrados</H2>
            {isLoading || isFetching ? (
              <ListSkeleton items={4} height={120} />
            ) : isError ? (
              <AnimatedNotice
                variant="error"
                title="No pudimos cargar los estados"
                message={error instanceof Error ? error.message : undefined}
                actionLabel="Reintentar"
                onAction={() => refetch()}
              />
            ) : employeeStates.length === 0 ? (
              <AnimatedNotice variant="info" message="Aún no registras estados." />
            ) : (
                <YStack gap="$3">
                  {employeeStates.map((item, index) => (
                    <Animated.View key={item.employee_state_id} entering={FadeInDown.delay(index * 85).springify()}>
                        <GlassCard p="$4" gap="$2">
                          <XStack justifyContent="space-between" alignItems="center">
                            <XStack gap="$3" alignItems="center">
                              <GlassCard p="$2" borderRadius="$4" backgroundColor="$backgroundPress">
                                <Briefcase size={24} color="$blue10" />
                              </GlassCard>
                              <YStack>
                                <Text fontFamily="$heading" fontWeight="800" fontSize={20} color="$color">
                                  {item.name}
                                </Text>
                                <StatusBadge
                                  label={item.active ? "Activo" : "Inactivo"}
                                  color={item.active ? "$green10" : "$gray10"}
                                />
                              </YStack>
                            </XStack>
                          </XStack>

                           <Separator borderColor="$borderColor" opacity={0.5} my="$2" />
                             
                           <Text fontFamily="$heading" color="$color" opacity={0.7} fontSize={15}>
                            {item.description ?? "Sin descripción"}
                           </Text>
                            
                          <XStack gap="$3" mt="$2">
                            <AnimatedButton flex={1} size={28} backgroundColor="rgba(37,99,235,0.18)" color="$color" borderRadius={16} icon={Edit3} onPress={() => handleSelectState(item)} fontFamily="$heading" fontWeight="700" fontSize={16} />
                            <AnimatedButton
                              flex={1}
                              size={28}
                              backgroundColor="rgba(239,68,68,0.18)"
                              color="white"
                              borderRadius={16}
                              icon={Trash2}
                              disabled={deleteMutation.isPending}
                              onPress={() => confirmDelete(item)}
                              fontFamily="$heading"
                              fontWeight="700"
                              fontSize={16}
                            />
                          </XStack>
                        </GlassCard>
                    </Animated.View>
                  ))}
                </YStack>
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
      <AdminNavbar />
    </Screen>
  );
}

