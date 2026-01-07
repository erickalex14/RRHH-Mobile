import { useCallback, useEffect, useMemo, useState } from "react";
import { Stack, useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { InteractiveCard } from "@/components/ui/InteractiveCard";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { HybridSelect } from "@/components/ui/HybridSelect";
import { adminService, DepartmentPayload } from "@/services/adminService";
import { Branch, Department } from "@/types/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { LinearGradient } from "expo-linear-gradient";
import { Layers, MapPin, Users, Edit3, Trash2 } from "@tamagui/lucide-icons";
import {
  AnimatePresence,
  Paragraph,
  ScrollView,
  Separator,
  Text,
  XStack,
  YStack,
  H2,
  Input,
  Button
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
  const branchOptions = useMemo(
    () => branches.map((branch) => ({ label: branch.name ?? "Sin nombre", value: String(branch.branch_id) })),
    [branches]
  );

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <YStack gap="$4" pt="$safe" px="$0">
          
          {/* Header */}
          <YStack gap="$1" mb="$2">
                <H2 fontWeight="800" fontSize={26} color="$color">Departamentos</H2>
                <Paragraph color="$color" opacity={0.6}>
                    Define divisiones y mantenlas alineadas a sus sucursales.
                </Paragraph>
          </YStack>


          {/* Form Block */}
          <GlassCard gap="$3" p="$4" borderRadius="$6">
            <Text fontFamily="$heading" fontSize="$5" color="$color">
               {editingDepartment ? `Editar ${editingDepartment.name}` : "Nuevo departamento"}
            </Text>
            <Paragraph color="$color" opacity={0.6}>{helperText}</Paragraph>

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
                <YStack gap="$2">
                  <Text fontWeight="600" color="$color">
                    Sucursal asignada
                  </Text>
                  <HybridSelect
                    options={branchOptions}
                    value={form.branch_id ? String(form.branch_id) : ""}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, branch_id: Number(value) }))}
                    placeholder={isBranchesLoading ? "Cargando..." : "Selecciona"}
                    disabled={isBranchesLoading || branches.length === 0}
                  />
                </YStack>

                <AnimatedInput
                  label="Nombre del departamento"
                  placeholder="Ej. Recursos Humanos"
                  value={form.name}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
                />
              </YStack>
            )}

            <XStack gap="$3" mt="$3">
              {editingDepartment ? (
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
                disabled={!formIsValid || isMutating}
                onPress={handleSubmit}
              >
                {editingDepartment ? "Guardar cambios" : "Crear departamento"}
              </AnimatedButton>
            </XStack>
          </GlassCard>

          <YStack gap="$3">
            <H2 fontSize={20} color="$color" mt="$4">Departamentos registrados</H2>
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
                <YStack gap="$3">
                  {departments.map((item, index) => (
                    <Animated.View key={item.department_id} entering={FadeInDown.delay(index * 85).springify()}>
                        <GlassCard p="$4" gap="$2">
                            <XStack justifyContent="space-between" alignItems="center">
                                <XStack gap="$3" alignItems="center">
                                    <GlassCard p="$2" borderRadius="$4" backgroundColor="$backgroundPress">
                                        <Layers size={24} color="$blue10" />
                                    </GlassCard>
                                    <YStack>
                                        <Text fontWeight="700" fontSize="$5" color="$color">
                                            {item.name}
                                        </Text>
                                        <XStack gap="$1" alignItems="center">
                                            <MapPin size={12} color="$color" opacity={0.6} />
                                            <Text color="$color" opacity={0.6} fontSize="$3">
                                                 {item.branch?.name ?? "Sin sucursal"}
                                            </Text>
                                        </XStack>
                                    </YStack>
                                </XStack>
                            </XStack>

                            <Separator borderColor="$borderColor" opacity={0.5} my="$2" />
                            
                            <XStack gap="$3" mt="$1">
                                <Button 
                                    flex={1} 
                                    size="$3" 
                                    chromeless 
                                    borderWidth={1} 
                                    borderColor="$borderColor" 
                                    icon={Users}
                                    onPress={() => handleNavigateToDepartmentUsers(item)}
                                >
                                    Usuarios
                                </Button>
                                <Button flex={1} size="$3" chromeless borderWidth={1} borderColor="$borderColor" icon={Edit3} onPress={() => handleSelectDepartment(item)} />
                                <Button
                                    flex={1}
                                    size="$3"
                                    backgroundColor="$red10"
                                    color="white"
                                    icon={Trash2}
                                    disabled={deleteMutation.isPending}
                                    onPress={() => handleDeleteDepartment(item.department_id)}
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

