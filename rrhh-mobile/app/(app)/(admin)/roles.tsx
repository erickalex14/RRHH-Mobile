import { useCallback, useMemo, useState } from "react";
import { Stack } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { InteractiveCard } from "@/components/ui/InteractiveCard";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { adminService, RolePayload } from "@/services/adminService";
import { Role } from "@/types/api";
import { LinearGradient } from "expo-linear-gradient";
import { Briefcase, DollarSign, ShieldCheck, Edit3, Trash2 } from "@tamagui/lucide-icons";
import { AnimatePresence, Paragraph, ScrollView, Separator, Switch, Text, XStack, YStack, H2, Input, Button } from "tamagui";

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
      form.name.trim().length > 1 &&
      form.description.trim().length > 2 &&
      form.salary.trim().length > 0
    );
  }, [form]);

  const handleSubmit = useCallback(() => {
    if (!formIsValid) {
      handleError("Verifica que el nombre, descripción y salario sean válidos.");
      return;
    }
    
    const payload: RolePayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      salary: form.salary.trim(),
      admin: form.admin
    };

    if (editingRole) {
      updateMutation.mutate({ roleId: editingRole.role_id, payload });
      return;
    }
    createMutation.mutate(payload);
  }, [createMutation, editingRole, form, formIsValid, updateMutation, handleError]);

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <YStack gap="$4" pt="$safe" px="$0">
          
          {/* Header */}
          <YStack gap="$1" mb="$2">
                <H2 fontWeight="800" fontSize={26} color="$color">Roles</H2>
                <Paragraph color="$color" opacity={0.6}>
                    Centraliza perfiles y salarios para asignarlos luego a colaboradores.
                </Paragraph>
          </YStack>

          {/* Form Block */}
          <GlassCard gap="$3" p="$4" borderRadius="$6">
            <Text fontFamily="$heading" fontSize="$5" color="$color">
              {editingRole ? `Editar ${editingRole.name}` : "Nuevo rol"}
            </Text>
            <Paragraph color="$color" opacity={0.6}>{helperText}</Paragraph>

            <YStack gap="$3" mt="$2">
              <AnimatedInput
                label="Nombre"
                placeholder="Ej. Analista"
                value={form.name}
                onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
              />
              <AnimatedInput
                label="Descripción"
                placeholder="Ej. Responsable de..."
                value={form.description}
                onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
              />
              
              <AnimatedInput
                label="Salario Base"
                placeholder="Ej. 1200"
                keyboardType="decimal-pad"
                value={form.salary}
                onChangeText={(value) => setForm((prev) => ({ ...prev, salary: value }))}
              />
              
              <XStack alignItems="center" justifyContent="space-between" mt="$2">
                <YStack gap="$1" flex={1}>
                  <Text fontWeight="600" color="white">
                    ¿Es administrador?
                  </Text>
                  <Paragraph color="$gray10" fontSize="$2">
                    Habilita privilegios especiales.
                  </Paragraph>
                </YStack>
                  <Switch
                    size="$3"
                    checked={form.admin}
                    onCheckedChange={(value: boolean) =>
                      setForm((prev) => ({ ...prev, admin: Boolean(value) }))
                    }
                  >
                  <Switch.Thumb animation="quick" backgroundColor="white" />
                </Switch>
              </XStack>
            </YStack>

            <XStack gap="$3" mt="$3">
              {editingRole ? (
                <AnimatedButton
                  flex={1}
                  backgroundColor="rgba(239, 68, 68, 0.2)"
                  disabled={isMutating}
                  onPress={resetForm}
                >
                  Cancelar
                </AnimatedButton>
              ) : null}
              <AnimatedButton
                flex={1}
                disabled={isMutating}
                onPress={handleSubmit}
                bg={!formIsValid ? "$gray8" : undefined}
              >
                {editingRole ? "Guardar cambios" : "Crear rol"}
              </AnimatedButton>
            </XStack>
          </GlassCard>

          <YStack gap="$3">
             <H2 fontSize={20} color="$color" mt="$4">Roles registrados</H2>
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
                <YStack gap="$3">
                  {roles.map((item, index) => (
                    <Animated.View key={item.role_id} entering={FadeInDown.delay(index * 85).springify()}>
                        <GlassCard p="$4" gap="$2">
                             <XStack justifyContent="space-between" alignItems="center">
                                <XStack gap="$3" alignItems="center">
                                    <GlassCard p="$2" borderRadius="$4" backgroundColor="$backgroundPress">
                                        <Briefcase size={24} color="$blue10" />
                                    </GlassCard>
                                    <YStack>
                                        <Text fontWeight="700" fontSize="$5" color="$color">
                                            {item.name}
                                        </Text>
                                        <Text color={item.admin ? "$green10" : "$color"} opacity={item.admin ? 1 : 0.6} fontSize="$3">
                                            {item.admin ? "Administrador" : "Rol Base"}
                                        </Text>
                                    </YStack>
                                </XStack>
                            </XStack>

                            <Separator borderColor="$borderColor" opacity={0.5} my="$2" />
                            
                             <YStack gap="$1" px="$1">
                                 <Text color="$color" opacity={0.8} fontStyle="italic">
                                     {item.description}
                                 </Text>
                                 <XStack gap="$2" alignItems="center" mt="$1">
                                     <Text color="$color" opacity={0.6}>Salario Base:</Text>
                                     <Text color="$color" fontWeight="700">${item.salary}</Text>
                                 </XStack>
                             </YStack>

                            <XStack gap="$3" mt="$3">
                                <Button flex={1} size="$3" chromeless borderWidth={1} borderColor="$borderColor" icon={Edit3} onPress={() => handleSelectRole(item)} />
                                <Button
                                    flex={1}
                                    size="$3"
                                    backgroundColor="$red10"
                                    color="white"
                                    icon={Trash2}
                                    disabled={deleteMutation.isPending}
                                    onPress={() => handleDeleteRole(item.role_id)}
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

