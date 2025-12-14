import { useCallback, useEffect, useMemo, useState } from "react";
import { Stack, useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { InteractiveCard } from "@/components/ui/InteractiveCard";
import { RoleSwitcher } from "@/components/admin/RoleSwitcher";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { adminService, DepartmentPayload } from "@/services/adminService";
import { Branch, Department } from "@/types/api";
import {
  Adapt,
  AnimatePresence,
  Paragraph,
  ScrollView,
  Select,
  Separator,
  Sheet,
  Text,
  XStack,
  YStack
} from "tamagui";

type DepartmentFormState = Omit<DepartmentPayload, "branch_id"> & { branch_id: number | null };

const emptyForm: DepartmentFormState = {
  branch_id: null,
  name: ""
};

export default function AdminDepartmentsScreen(): JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<DepartmentFormState>(emptyForm);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const {
    data: departmentsData,
    isLoading: isDepartmentsLoading,
    isFetching: isDepartmentsFetching,
    isError: isDepartmentsError,
    refetch: refetchDepartments
  } = useQuery({
    queryKey: ["admin", "departments"],
    queryFn: adminService.getDepartments
  });

  const {
    data: branchesData,
    isLoading: isBranchesLoading,
    isError: isBranchesError,
    refetch: refetchBranches
  } = useQuery({
    queryKey: ["admin", "branches"],
    queryFn: adminService.getBranches
  });

  const departments: Department[] = departmentsData?.data ?? [];
  const branches: Branch[] = branchesData?.data ?? [];

  useEffect(() => {
    if (branches.length > 0 && form.branch_id === null) {
      setForm((prev) => ({ ...prev, branch_id: branches[0].branch_id }));
    }
  }, [branches, form.branch_id]);

  const invalidateDepartments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin", "departments"] });
  }, [queryClient]);

  const closeFeedback = useCallback(() => {
    setTimeout(() => setFeedback(null), 2300);
  }, []);

  const handleError = useCallback((message: string) => {
    setFeedback({ type: "error", message });
    closeFeedback();
  }, [closeFeedback]);

  const createMutation = useMutation({
    mutationFn: (payload: DepartmentPayload) => adminService.createDepartment(payload),
    onSuccess: () => {
      setForm((prev) => ({ ...emptyForm, branch_id: prev.branch_id }));
      setFeedback({ type: "success", message: "Departamento creado" });
      invalidateDepartments();
      closeFeedback();
    },
    onError: () => handleError("No se pudo crear el departamento")
  });

  const updateMutation = useMutation({
    mutationFn: ({ departmentId, payload }: { departmentId: number; payload: DepartmentPayload }) =>
      adminService.updateDepartment(departmentId, payload),
    onSuccess: () => {
      setEditingDepartment(null);
      setForm((prev) => ({ ...emptyForm, branch_id: prev.branch_id }));
      setFeedback({ type: "success", message: "Departamento actualizado" });
      invalidateDepartments();
      closeFeedback();
    },
    onError: () => handleError("No se pudo actualizar el departamento")
  });

  const deleteMutation = useMutation({
    mutationFn: (departmentId: number) => adminService.deleteDepartment(departmentId),
    onSuccess: () => {
      setFeedback({ type: "success", message: "Departamento eliminado" });
      invalidateDepartments();
      closeFeedback();
    },
    onError: () => handleError("No se pudo eliminar el departamento")
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const handleSelectDepartment = useCallback((department: Department) => {
    setEditingDepartment(department);
    setForm({
      branch_id: department.branch_id,
      name: department.name ?? ""
    });
  }, []);

  const resetForm = useCallback(() => {
    setEditingDepartment(null);
    setForm((prev) => ({ ...emptyForm, branch_id: prev.branch_id }));
  }, []);

  const formIsValid = useMemo(() => {
    return typeof form.branch_id === "number" && form.branch_id > 0 && form.name.trim().length > 2;
  }, [form.branch_id, form.name]);

  const payload = useMemo<DepartmentPayload | null>(() => {
    if (!formIsValid) return null;
    return {
      branch_id: form.branch_id as number,
      name: form.name.trim()
    };
  }, [form.branch_id, form.name, formIsValid]);

  const handleSubmit = useCallback(() => {
    if (!payload) return;
    if (editingDepartment) {
      updateMutation.mutate({ departmentId: editingDepartment.department_id, payload });
      return;
    }
    createMutation.mutate(payload);
  }, [createMutation, editingDepartment, payload, updateMutation]);

  const handleDeleteDepartment = useCallback((departmentId: number) => {
    deleteMutation.mutate(departmentId);
  }, [deleteMutation]);

  const handleNavigateToDepartmentUsers = useCallback((department: Department) => {
    router.push({
      pathname: "/(app)/(admin)/users",
      params: {
        context: "department",
        departmentId: String(department.department_id),
        departmentName: department.name ?? "Departamento"
      }
    });
  }, [router]);

  const helperText = useMemo(
    () => (editingDepartment ? "Editando un departamento existente" : "Completa los campos para registrar"),
    [editingDepartment]
  );

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 64 }}>
        <YStack gap="$5">
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$7" color="$text">
              Departamentos
            </Text>
            <Paragraph color="$muted">Define divisiones y mantenlas alineadas a sus sucursales.</Paragraph>
          </YStack>

          <RoleSwitcher target="employee" />

          <YStack gap="$3" backgroundColor="$brandBg" p="$4" borderRadius="$6">
            <Text fontFamily="$heading" fontSize="$5" color="$text">
              {editingDepartment ? `Editar ${editingDepartment.name}` : "Nuevo departamento"}
            </Text>
            <Paragraph color="$muted">{helperText}</Paragraph>

            {isBranchesError ? (
              <AnimatedNotice
                variant="error"
                title="No pudimos cargar las sucursales"
                message="Actualiza para continuar."
                actionLabel="Reintentar"
                onAction={() => void refetchBranches()}
              />
            ) : !isBranchesLoading && branches.length === 0 ? (
              <AnimatedNotice
                variant="info"
                message="Crea una sucursal antes de registrar departamentos."
                actionLabel="Ir a sucursales"
                onAction={() => router.push("/(app)/(admin)/branches")}
              />
            ) : (
              <YStack gap="$3" mt="$2">
                <YStack gap="$1">
                  <Text fontWeight="600" color="$text">
                    Sucursal
                  </Text>
                  <Select
                    value={form.branch_id ? String(form.branch_id) : undefined}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, branch_id: Number(value) }))
                    }
                    disabled={isBranchesLoading || branches.length === 0}
                  >
                    <Select.Trigger borderColor="$borderColor">
                      <Select.Value placeholder={isBranchesLoading ? "Cargando..." : "Selecciona"} />
                    </Select.Trigger>
                    <Adapt when="sm" platform="touch">
                      <Sheet modal dismissOnSnapToBottom>
                        <Sheet.Frame>
                          <Sheet.ScrollView>
                            <Adapt.Contents />
                          </Sheet.ScrollView>
                        </Sheet.Frame>
                        <Sheet.Overlay enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
                      </Sheet>
                    </Adapt>
                    <Select.Content>
                      <Select.ScrollUpButton />
                      <Select.Viewport>
                        {branches.map((branch) => (
                          <Select.Item key={branch.branch_id} value={String(branch.branch_id)}>
                            <Select.ItemText>{branch.name}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                      <Select.ScrollDownButton />
                    </Select.Content>
                  </Select>
                </YStack>

                <AnimatedInput
                  label="Nombre"
                  placeholder="Talento Humano"
                  value={form.name}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
                />
              </YStack>
            )}

            <XStack gap="$3" mt="$3">
              {editingDepartment ? (
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
                {editingDepartment ? "Guardar cambios" : "Crear"}
              </AnimatedButton>
            </XStack>
          </YStack>

          <XStack gap="$3">
            <AnimatedButton
              flex={1}
              backgroundColor="$color4"
              color="$text"
              disabled={isDepartmentsLoading || isDepartmentsFetching}
              onPress={() => refetchDepartments()}
            >
              {isDepartmentsFetching ? "Actualizando..." : "Actualizar"}
            </AnimatedButton>
          </XStack>

          <YStack gap="$3">
            <Text fontFamily="$heading" fontSize="$5" color="$text">
              Departamentos registrados
            </Text>
            {isDepartmentsLoading || isDepartmentsFetching ? (
              <ListSkeleton items={4} height={120} />
            ) : isDepartmentsError ? (
              <AnimatedNotice
                variant="error"
                title="No se pudieron cargar"
                message="Verifica tu conexión e intenta nuevamente."
                actionLabel="Reintentar"
                onAction={() => void refetchDepartments()}
              />
            ) : departments.length === 0 ? (
              <AnimatedNotice variant="info" message="Aún no registras departamentos." />
            ) : (
              <Animated.FlatList<Department>
                data={departments}
                keyExtractor={(item) => String(item.department_id)}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <Separator backgroundColor="$color4" />}
                renderItem={({ item, index }) => (
                  <Animated.View entering={FadeInDown.delay(index * 85)}>
                    <InteractiveCard onPress={() => handleSelectDepartment(item)}>
                      <YStack gap="$2">
                        <Text fontWeight="600" fontSize="$4" color="$text">
                          {item.name}
                        </Text>
                        <Paragraph color="$muted">
                          Sucursal: {item.branch?.name ?? "Sin asignar"}
                        </Paragraph>
                        <AnimatedButton
                          backgroundColor="$color3"
                          color="$text"
                          onPress={() => handleNavigateToDepartmentUsers(item)}
                        >
                          Ver usuarios
                        </AnimatedButton>
                        <XStack gap="$2" mt="$2">
                          <AnimatedButton
                            flex={1}
                            backgroundColor="$color4"
                            color="$text"
                            onPress={() => handleSelectDepartment(item)}
                          >
                            Editar
                          </AnimatedButton>
                          <AnimatedButton
                            flex={1}
                            backgroundColor="$danger"
                            color="#fff"
                            disabled={deleteMutation.isPending}
                            onPress={() => handleDeleteDepartment(item.department_id)}
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

