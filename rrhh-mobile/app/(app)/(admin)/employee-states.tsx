import { useCallback, useMemo, useState } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Stack } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { InteractiveCard } from "@/components/ui/InteractiveCard";
import { RoleSwitcher } from "@/components/admin/RoleSwitcher";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminService, EmployeeStatePayload } from "@/services/adminService";
import { useConfirm } from "@/hooks/useConfirm";
import { EmployeeState } from "@/types/api";
import { AnimatePresence, Paragraph, ScrollView, Separator, Switch, Text, XStack, YStack } from "tamagui";

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
    return form.name.trim().length > 2 && form.description.trim().length > 4;
  }, [form.description, form.name]);

  const payload = useMemo<EmployeeStatePayload | null>(() => {
    if (!formIsValid) {
      return null;
    }
    return {
      name: form.name.trim(),
      description: form.description.trim(),
      active: form.active
    };
  }, [form, formIsValid]);

  const handleSubmit = useCallback(() => {
    if (!payload) return;
    if (editingState) {
      updateMutation.mutate({ employeeStateId: editingState.employee_state_id, payload });
      return;
    }
    createMutation.mutate(payload);
  }, [createMutation, editingState, payload, updateMutation]);

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
      <ScrollView contentContainerStyle={{ paddingBottom: 64 }}>
        <YStack gap="$5">
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$7" color="$text">
              Estados de empleado
            </Text>
            <Paragraph color="$muted">
              Crea estados claros para controlar la situación de cada colaborador.
            </Paragraph>
          </YStack>

          <RoleSwitcher target="employee" />

          <YStack gap="$3" backgroundColor="$brandBg" p="$4" borderRadius="$6">
            <Text fontFamily="$heading" fontSize="$5" color="$text">
              {editingState ? "Editar estado" : "Nuevo estado"}
            </Text>
            <Paragraph color="$muted">{helperText}</Paragraph>

            <AnimatedInput
              label="Nombre"
              placeholder="Activo"
              value={form.name}
              onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
            />
            <AnimatedInput
              label="Descripción"
              placeholder="Colaborador activo con acceso completo"
              value={form.description}
              onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
              multiline
            />

            <XStack alignItems="center" justifyContent="space-between">
              <YStack gap="$1">
                <Text fontWeight="600" color="$text">
                  ¿Activo?
                </Text>
                <Paragraph color="$muted" fontSize="$2">
                  Usa el switch para habilitar o suspender el estado.
                </Paragraph>
              </YStack>
              <Switch
                size="$3"
                checked={form.active}
                  onCheckedChange={(value: boolean) => setForm((prev) => ({ ...prev, active: Boolean(value) }))}
              >
                <Switch.Thumb animation="quick" />
              </Switch>
            </XStack>

            <XStack gap="$3" mt="$2">
              {editingState ? (
                <AnimatedButton
                  flex={1}
                  backgroundColor="$color4"
                  color="$text"
                  disabled={isMutating}
                  onPress={resetForm}
                >
                  Cancelar
                </AnimatedButton>
              ) : null}
              <AnimatedButton flex={1} disabled={!formIsValid || isMutating} onPress={handleSubmit}>
                {editingState ? "Guardar cambios" : "Crear"}
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
              Estados registrados
            </Text>
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
              <Animated.FlatList<EmployeeState>
                data={employeeStates}
                keyExtractor={(item) => String(item.employee_state_id)}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <Separator backgroundColor="$color4" />}
                renderItem={({ item, index }) => (
                  <Animated.View entering={FadeInDown.delay(index * 85)}>
                    <InteractiveCard onPress={() => handleSelectState(item)}>
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
                          {item.description ?? "Sin descripción"}
                        </Paragraph>
                        <XStack gap="$2" mt="$2">
                          <AnimatedButton
                            flex={1}
                            backgroundColor="$color4"
                            color="$text"
                            onPress={() => handleSelectState(item)}
                          >
                            Editar
                          </AnimatedButton>
                          <AnimatedButton
                            flex={1}
                            backgroundColor="$danger"
                            color="#fff"
                            disabled={deleteMutation.isPending}
                            onPress={() => confirmDelete(item)}
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

