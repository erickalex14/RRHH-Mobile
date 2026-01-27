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

export default function AdminRolesScreen() {
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
            <Text fontFamily="$heading" fontWeight="800" fontSize={24} color="$color">
              {editingRole ? `Editar ${editingRole.name}` : "Nuevo rol"}
            </Text>
            <Text fontFamily="$heading" fontWeight="600" fontSize={16} color="$color" opacity={0.7}>
              {helperText}
            </Text>

            <YStack gap="$3" mt="$2">
              <AnimatedInput
                label={<Text fontFamily="$heading" fontWeight="700" fontSize={15} color="$color">Nombre</Text>}
                value={form.name}
                onChangeText={(value: string) => setForm((prev) => ({ ...prev, name: value }))}
              />
              <AnimatedInput
                label={<Text fontFamily="$heading" fontWeight="700" fontSize={15} color="$color">Descripción</Text>}
                value={form.description}
                onChangeText={(value: string) => setForm((prev) => ({ ...prev, description: value }))}
              />
              <AnimatedInput
                label={<Text fontFamily="$heading" fontWeight="700" fontSize={15} color="$color">Salario Base</Text>}
                value={form.salary}
                keyboardType="decimal-pad"
                onChangeText={(value: string) => setForm((prev) => ({ ...prev, salary: value }))}
              />
              <XStack alignItems="center" justifyContent="space-between" mt="$2">
                <YStack gap="$1" flex={1}>
                  <Text fontFamily="$heading" fontWeight="700" fontSize={15} color="white">
                    ¿Es administrador?
                  </Text>
                  <Text fontFamily="$heading" fontWeight="400" fontSize={13} color="$gray10">
                    Habilita privilegios especiales.
                  </Text>
                </YStack>
                <YStack ai="center" jc="center" px={6}>
                  <GlassCard
                    p={8}
                    borderRadius={24}
                    backgroundColor="rgba(37,99,235,0.22)"
                    style={{
                      backdropFilter: 'blur(8px)',
                      border: '1.5px solid rgba(255,255,255,0.12)',
                      boxShadow: '0 2px 16px rgba(37,99,235,0.12)'
                    }}
                  >
                    <Switch
                      size="$5"
                      checked={form.admin}
                      onCheckedChange={(value: boolean) =>
                        setForm((prev) => ({ ...prev, admin: Boolean(value) }))
                      }
                      backgroundColor={form.admin ? "rgba(37,99,235,0.45)" : "rgba(30,41,59,0.45)"}
                      borderColor={form.admin ? "$blue8" : "$gray7"}
                      borderWidth={2}
                      style={{ minWidth: 64, minHeight: 36, borderRadius: 18, transition: 'all 0.25s', boxShadow: form.admin ? '0 0 12px #2563eb88' : '0 0 6px #fff2' }}
                    >
                      <Switch.Thumb
                        animation="quick"
                        backgroundColor={form.admin ? "#fff" : "#cbd5e1"}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          boxShadow: form.admin ? '0 0 16px #2563eb' : '0 0 8px #fff',
                          border: form.admin ? '2px solid #2563eb' : '2px solid #cbd5e1',
                          transition: 'all 0.25s'
                        }}
                      />
                    </Switch>
                  </GlassCard>
                </YStack>
              </XStack>
            </YStack>

            <XStack gap="$3" mt="$3">
              {editingRole ? (
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
                fontFamily="$heading"
                fontWeight="700"
                fontSize={17}
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
                            <Text fontFamily="$heading" fontWeight="800" fontSize={22} color="$color">{item.name}</Text>
                            <Text fontFamily="$heading" fontWeight="700" color={item.admin ? "$green10" : "$color"} opacity={item.admin ? 1 : 0.6} fontSize={16}>
                              {item.admin ? "Administrador" : "Rol Base"}
                            </Text>
                          </YStack>
                        </XStack>
                      </XStack>
                      <Separator borderColor="$borderColor" opacity={0.5} my="$2" />
                      <YStack gap="$1" px="$1">
                        <Text fontFamily="$heading" color="$color" opacity={0.8} fontStyle="italic" fontSize={15}>
                          {item.description}
                        </Text>
                        <XStack gap="$2" alignItems="center" mt="$1">
                          <Text fontFamily="$heading" color="$color" opacity={0.6} fontSize={15}>Salario Base:</Text>
                          <Text fontFamily="$heading" color="$color" fontWeight="700" fontSize={15}>${item.salary}</Text>
                        </XStack>
                      </YStack>
                      <XStack gap="$3" mt="$3">
                        <AnimatedButton
                          flex={1}
                          icon={Edit3}
                          size={28}
                          backgroundColor="rgba(37,99,235,0.18)"
                          color="$color"
                          borderRadius={16}
                          onPress={() => handleSelectRole(item)}
                        />
                        <AnimatedButton
                          flex={1}
                          icon={Trash2}
                          size={28}
                          backgroundColor="rgba(239,68,68,0.22)"
                          color="white"
                          borderRadius={16}
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

