import { useCallback, useMemo, useState } from "react";
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
import { adminService, RolePayload } from "@/services/adminService";
import { Role } from "@/types/api";
import { AnimatePresence, Paragraph, ScrollView, Separator, Switch, Text, XStack, YStack } from "tamagui";

type RoleFormState = RolePayload;

const emptyForm: RoleFormState = {
  name: "",
  description: "",
  salary: "",
  admin: false
};

export default function AdminRolesScreen(): JSX.Element {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RoleFormState>(emptyForm);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch
  } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: adminService.getRoles
  });

  const roles: Role[] = data?.data ?? [];

  const invalidateRoles = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
  }, [queryClient]);

  const closeFeedback = useCallback(() => {
    setTimeout(() => setFeedback(null), 2200);
  }, []);

  const handleError = useCallback((message: string) => {
    setFeedback({ type: "error", message });
    closeFeedback();
  }, [closeFeedback]);

  const createMutation = useMutation({
    mutationFn: (payload: RolePayload) => adminService.createRole(payload),
    onSuccess: () => {
      setForm(emptyForm);
      setFeedback({ type: "success", message: "Rol creado" });
      invalidateRoles();
      closeFeedback();
    },
    onError: () => handleError("No se pudo crear el rol")
  });

  const updateMutation = useMutation({
    mutationFn: ({ roleId, payload }: { roleId: number; payload: RolePayload }) =>
      adminService.updateRole(roleId, payload),
    onSuccess: () => {
      setEditingRole(null);
      setForm(emptyForm);
      setFeedback({ type: "success", message: "Rol actualizado" });
      invalidateRoles();
      closeFeedback();
    },
    onError: () => handleError("No se pudo actualizar el rol")
  });

  const deleteMutation = useMutation({
    mutationFn: (roleId: number) => adminService.deleteRole(roleId),
    onSuccess: () => {
      setFeedback({ type: "success", message: "Rol eliminado" });
      invalidateRoles();
      closeFeedback();
    },
    onError: () => handleError("No se pudo eliminar el rol")
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const handleSelectRole = useCallback((role: Role) => {
    setEditingRole(role);
    setForm({
      name: role.name ?? "",
      description: role.description ?? "",
      salary: role.salary ?? "",
      admin: Boolean(role.admin)
    });
  }, []);

  const resetForm = useCallback(() => {
    setEditingRole(null);
    setForm(emptyForm);
  }, []);

  const formIsValid = useMemo(() => {
    return (
      form.name.trim().length > 2 &&
      form.description.trim().length > 4 &&
      form.salary.trim().length > 0
    );
  }, [form]);

  const payload = useMemo<RolePayload | null>(() => {
    if (!formIsValid) return null;
    return {
      name: form.name.trim(),
      description: form.description.trim(),
      salary: form.salary.trim(),
      admin: form.admin
    };
  }, [form, formIsValid]);

  const handleSubmit = useCallback(() => {
    if (!payload) return;
    if (editingRole) {
      updateMutation.mutate({ roleId: editingRole.role_id, payload });
      return;
    }
    createMutation.mutate(payload);
  }, [createMutation, editingRole, payload, updateMutation]);

  const handleDeleteRole = useCallback((roleId: number) => {
    deleteMutation.mutate(roleId);
  }, [deleteMutation]);

  const helperText = useMemo(
    () => (editingRole ? "Editando un rol existente" : "Completa los campos para registrar"),
    [editingRole]
  );

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 64 }}>
        <YStack gap="$5">
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$7" color="$text">
              Roles
            </Text>
            <Paragraph color="$muted">Centraliza perfiles y salarios para asignarlos luego a colaboradores.</Paragraph>
          </YStack>

          <RoleSwitcher target="employee" />

          <YStack gap="$3" backgroundColor="$brandBg" p="$4" borderRadius="$6">
            <Text fontFamily="$heading" fontSize="$5" color="$text">
              {editingRole ? `Editar ${editingRole.name}` : "Nuevo rol"}
            </Text>
            <Paragraph color="$muted">{helperText}</Paragraph>

            <YStack gap="$3" mt="$2">
              <AnimatedInput
                label="Nombre"
                placeholder="Analista"
                value={form.name}
                onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
              />
              <AnimatedInput
                label="Descripción"
                placeholder="Responsable de ..."
                value={form.description}
                onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
              />
              <AnimatedInput
                label="Salario"
                placeholder="1200"
                keyboardType="decimal-pad"
                value={form.salary}
                onChangeText={(value) => setForm((prev) => ({ ...prev, salary: value }))}
              />
              <XStack alignItems="center" justifyContent="space-between">
                <YStack gap="$1">
                  <Text fontWeight="600" color="$text">
                    ¿Es administrador?
                  </Text>
                  <Paragraph color="$muted" fontSize="$2">
                    Habilita privilegios especiales para este rol.
                  </Paragraph>
                </YStack>
                  <Switch
                    size="$3"
                    checked={form.admin}
                    onCheckedChange={(value: boolean) =>
                      setForm((prev) => ({ ...prev, admin: Boolean(value) }))
                    }
                  >
                  <Switch.Thumb animation="quick" />
                </Switch>
              </XStack>
            </YStack>

            <XStack gap="$3" mt="$3">
              {editingRole ? (
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
                {editingRole ? "Guardar cambios" : "Crear"}
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
              Roles registrados
            </Text>
            {isLoading || isFetching ? (
              <ListSkeleton items={4} height={132} />
            ) : isError ? (
              <AnimatedNotice
                variant="error"
                title="No se pudieron cargar"
                message="Verifica tu conexión e intenta nuevamente."
                actionLabel="Reintentar"
                onAction={() => void refetch()}
              />
            ) : roles.length === 0 ? (
              <AnimatedNotice variant="info" message="Aún no tienes roles registrados." />
            ) : (
              <Animated.FlatList<Role>
                data={roles}
                keyExtractor={(item) => String(item.role_id)}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <Separator backgroundColor="$color4" />}
                renderItem={({ item, index }) => (
                  <Animated.View entering={FadeInDown.delay(index * 85)}>
                    <InteractiveCard onPress={() => handleSelectRole(item)}>
                      <YStack gap="$2">
                        <XStack justifyContent="space-between" alignItems="center">
                          <Text fontWeight="600" fontSize="$4" color="$text">
                            {item.name}
                          </Text>
                          <Text color={item.admin ? "$success" : "$muted"} fontSize="$2">
                            {item.admin ? "Admin" : "Base"}
                          </Text>
                        </XStack>
                        <Paragraph color="$muted">{item.description}</Paragraph>
                        <Paragraph color="$muted">Salario: {item.salary}</Paragraph>
                        <XStack gap="$2" mt="$2">
                          <AnimatedButton
                            flex={1}
                            backgroundColor="$color4"
                            color="$text"
                            onPress={() => handleSelectRole(item)}
                          >
                            Editar
                          </AnimatedButton>
                          <AnimatedButton
                            flex={1}
                            backgroundColor="$danger"
                            color="#fff"
                            disabled={deleteMutation.isPending}
                            onPress={() => handleDeleteRole(item.role_id)}
                          >
                            Borrar
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

