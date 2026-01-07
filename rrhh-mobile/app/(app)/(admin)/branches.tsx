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
import { adminService, BranchPayload } from "@/services/adminService";
import { Branch, Company } from "@/types/api";
import { LinearGradient } from "expo-linear-gradient";
import { GlassCard } from "@/components/ui/GlassCard";
import { Building2, MapPin, Phone, Mail, Edit3, Trash2, Users } from "@tamagui/lucide-icons";
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
  Button,
  Input
} from "tamagui";

type BranchFormState = Omit<BranchPayload, "company_id"> & { company_id: number | null };

const emptyForm: BranchFormState = {
  company_id: null,
  name: "",
  code: "",
  address: "",
  city: "",
  state: "",
  country: "",
  phone: "",
  email: "",
  matrix: false
};

export default function AdminBranchesScreen(): JSX.Element {
  const router = useRouter();
  const [form, setForm] = useState<BranchFormState>(emptyForm);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const queryClient = useQueryClient();

  const {
    data: branchesData,
    isLoading: isBranchesLoading,
    isError: isBranchesError,
    isFetching: isBranchesFetching,
    refetch: refetchBranches
  } = useQuery({
    queryKey: ["admin", "branches"],
    queryFn: adminService.getBranches
  });

  const {
    data: companiesData,
    isLoading: isCompaniesLoading,
    isError: isCompaniesError,
    refetch: refetchCompanies
  } = useQuery({
    queryKey: ["admin", "companies"],
    queryFn: adminService.getCompanies
  });

  const branches: Branch[] = branchesData?.data ?? [];
  const companies: Company[] = companiesData?.data ?? [];
  const companyOptions = useMemo(
    () => companies.map((company) => ({ label: company.name ?? "Sin nombre", value: String(company.company_id) })),
    [companies]
  );

  useEffect(() => {
    if (companies.length > 0 && form.company_id === null) {
      setForm((prev) => ({ ...prev, company_id: companies[0].company_id }));
    }
  }, [companies, form.company_id]);

  const invalidateBranches = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin", "branches"] });
  }, [queryClient]);

  const closeFeedback = useCallback(() => {
    setTimeout(() => setFeedback(null), 2400);
  }, []);

  const handleErrorFeedback = useCallback((message: string) => {
    setFeedback({ type: "error", message });
    closeFeedback();
  }, [closeFeedback]);

  const createMutation = useMutation({
    mutationFn: (payload: BranchPayload) => adminService.createBranch(payload),
    onSuccess: () => {
      setForm((prev) => ({ ...emptyForm, company_id: prev.company_id }));
      setFeedback({ type: "success", message: "Sucursal creada" });
      invalidateBranches();
      closeFeedback();
    },
    onError: () => handleErrorFeedback("No se pudo crear la sucursal")
  });

  const updateMutation = useMutation({
    mutationFn: ({ branchId, payload }: { branchId: number; payload: BranchPayload }) =>
      adminService.updateBranch(branchId, payload),
    onSuccess: () => {
      setEditingBranch(null);
      setForm((prev) => ({ ...emptyForm, company_id: prev.company_id }));
      setFeedback({ type: "success", message: "Sucursal actualizada" });
      invalidateBranches();
      closeFeedback();
    },
    onError: () => handleErrorFeedback("No se pudo actualizar la sucursal")
  });

  const deleteMutation = useMutation({
    mutationFn: (branchId: number) => adminService.deleteBranch(branchId),
    onSuccess: () => {
      setFeedback({ type: "success", message: "Sucursal eliminada" });
      invalidateBranches();
      closeFeedback();
    },
    onError: () => handleErrorFeedback("No se pudo eliminar la sucursal")
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const handleSelectBranch = useCallback((branch: Branch) => {
    setEditingBranch(branch);
    setForm({
      company_id: branch.company_id,
      name: branch.name ?? "",
      code: branch.code ?? "",
      address: branch.address ?? "",
      city: branch.city ?? "",
      state: branch.state ?? "",
      country: branch.country ?? "",
      phone: branch.phone ?? "",
      email: branch.email ?? "",
      matrix: Boolean(branch.matrix)
    });
  }, []);

  const handleDeleteBranch = useCallback((branchId: number) => {
    deleteMutation.mutate(branchId);
  }, [deleteMutation]);

  const handleNavigateToBranchUsers = useCallback((branch: Branch) => {
    router.push({
      pathname: "/(app)/(admin)/users",
      params: {
        context: "branch",
        branchId: String(branch.branch_id),
        branchName: branch.name ?? "Sucursal"
      }
    });
  }, [router]);

  const formIsValid = useMemo(() => {
    return (
      typeof form.company_id === "number" &&
      form.company_id > 0 &&
      form.name.trim().length > 2 &&
      form.code.trim().length > 0 &&
      form.address.trim().length > 0 &&
      form.city.trim().length > 0 &&
      form.state.trim().length > 0 &&
      form.country.trim().length > 0 &&
      form.phone.trim().length === 10 &&
      form.email.trim().length > 5
    );
  }, [form]);

  const payload = useMemo<BranchPayload | null>(() => {
    if (!formIsValid) return null;
    return {
      company_id: form.company_id as number,
      name: form.name.trim(),
      code: form.code.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim(),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      matrix: form.matrix
    };
  }, [form, formIsValid]);

  const handleSubmit = useCallback(() => {
    if (!payload) return;
    if (editingBranch) {
      updateMutation.mutate({ branchId: editingBranch.branch_id, payload });
      return;
    }
    createMutation.mutate(payload);
  }, [createMutation, editingBranch, payload, updateMutation]);

  const helperText = useMemo(
    () => (editingBranch ? "Estas editando una sucursal existente" : "Completa los campos para registrar"),
    [editingBranch]
  );

  const resetForm = useCallback(() => {
    setEditingBranch(null);
    setForm((prev) => ({ ...emptyForm, company_id: prev.company_id }));
  }, []);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <YStack gap="$4" pt="$safe" px="$0">
          
          {/* Header */}
          <YStack gap="$1" mb="$2">
                <H2 fontWeight="800" fontSize={26} color="$color">Sucursales</H2>
                <Paragraph color="$color" opacity={0.6}>Controla aperturas y asigna la compañía matriz.</Paragraph>
          </YStack>

          {/* Form Block */}
          <GlassCard gap="$3" p="$4" borderRadius="$6">
            <Text fontFamily="$heading" fontSize="$5" color="$color">
              {editingBranch ? `Editar ${editingBranch.name}` : "Nueva sucursal"}
            </Text>
            <Paragraph color="$color" opacity={0.6}>{helperText}</Paragraph>

            {isCompaniesError ? (
              <AnimatedNotice
                variant="error"
                title="No pudimos cargar las compañías"
                message="Actualiza para continuar."
                actionLabel="Reintentar"
                onAction={() => void refetchCompanies()}
              />
            ) : !isCompaniesLoading && companies.length === 0 ? (
              <AnimatedNotice
                variant="info"
                message="Crea una compañía antes de registrar sucursales."
                actionLabel="Ir a compañías"
                onAction={() => router.push("/(app)/(admin)/crud")}
              />
            ) : (
              <YStack gap="$3" mt="$2">
                <YStack gap="$2">
                  <Text fontWeight="600" color="white">
                    Compañía
                  </Text>
                  <HybridSelect
                    options={companyOptions}
                    value={form.company_id ? String(form.company_id) : ""}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, company_id: Number(value) }))}
                    placeholder={isCompaniesLoading ? "Cargando..." : "Selecciona"}
                    disabled={isCompaniesLoading || companies.length === 0}
                  />
                </YStack>

                <AnimatedInput
                  label="Nombre de la sucursal"
                  placeholder="Ej. Sede Central"
                  value={form.name}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
                />
                <XStack gap="$3">
                    <YStack flex={1}>
                        <AnimatedInput
                            label="Código"
                            placeholder="Ej. CEN-01"
                            autoCapitalize="characters"
                            value={form.code}
                            onChangeText={(value) => setForm((prev) => ({ ...prev, code: value }))}
                        />
                    </YStack>
                    <YStack flex={1}>
                        <AnimatedInput
                            label="Teléfono"
                            placeholder="0999999999"
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={form.phone}
                            onChangeText={(value) =>
                                setForm((prev) => ({ ...prev, phone: value.replace(/[^0-9]/g, "") }))
                            }
                        />
                    </YStack>
                </XStack>
                
                <AnimatedInput
                  label="Dirección"
                  placeholder="Calle Principal 123"
                  value={form.address}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, address: value }))}
                />
                
                <XStack gap="$3">
                     <YStack flex={1}>
                        <AnimatedInput
                            label="Ciudad"
                            placeholder="Ej. Quito"
                            value={form.city}
                            onChangeText={(value) => setForm((prev) => ({ ...prev, city: value }))}
                        />
                     </YStack>
                    <YStack flex={1}>
                        <AnimatedInput
                            label="Provincia"
                            placeholder="Ej. Pichincha"
                            value={form.state}
                            onChangeText={(value) => setForm((prev) => ({ ...prev, state: value }))}
                        />
                    </YStack>
                </XStack>
                <AnimatedInput
                  label="País"
                  placeholder="Ej. Ecuador"
                  value={form.country}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, country: value }))}
                />
                <AnimatedInput
                  label="Correo de contacto"
                  placeholder="sukursal@empresa.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={form.email}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
                />
                <XStack alignItems="center" justifyContent="space-between" mt="$1">
                  <YStack gap="$1" flex={1}>
                    <Text fontWeight="600" color="white">
                      ¿Es matriz?
                    </Text>
                    <Paragraph color="$gray10" fontSize="$2">
                      Marca si esta sucursal centraliza operaciones.
                    </Paragraph>
                  </YStack>
                  <Switch
                    size="$3"
                    checked={form.matrix}
                    onCheckedChange={(value: boolean) =>
                      setForm((prev) => ({ ...prev, matrix: Boolean(value) }))
                    }
                  >
                    <Switch.Thumb animation="quick" backgroundColor="white" />
                  </Switch>
                </XStack>
              </YStack>
            )}

            <XStack gap="$3" mt="$3">
              {editingBranch ? (
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
                {editingBranch ? "Guardar cambios" : "Crear sucursal"}
              </AnimatedButton>
            </XStack>
          </GlassCard>

          <YStack gap="$3">
             <H2 fontSize={20} color="$color" mt="$4">Sucursales registradas</H2>
            {isBranchesLoading || isBranchesFetching ? (
              <ListSkeleton items={4} height={140} />
            ) : isBranchesError ? (
              <AnimatedNotice
                variant="error"
                title="No se pudieron cargar"
                message="Revisa tu conexión e intenta nuevamente."
                actionLabel="Reintentar"
                onAction={() => void refetchBranches()}
              />
            ) : branches.length === 0 ? (
              <AnimatedNotice variant="info" message="Todavía no tienes sucursales registradas." />
            ) : (
                <YStack gap="$3">
                  {branches.map((item, index) => (
                    <Animated.View key={item.branch_id} entering={FadeInDown.delay(index * 50).springify()}>
                        <GlassCard p="$4" gap="$2">
                            <XStack justifyContent="space-between" alignItems="center">
                                <XStack gap="$3" alignItems="center">
                                    <GlassCard p="$2" borderRadius="$4" backgroundColor="$backgroundPress">
                                        <Building2 size={24} color="$blue10" />
                                    </GlassCard>
                                    <YStack>
                                        <Text fontWeight="700" fontSize="$5" color="$color">
                                            {item.name}
                                        </Text>
                                        <Text color={item.matrix ? "$green10" : "$color"} opacity={item.matrix ? 1 : 0.6} fontSize="$3">
                                            {item.matrix ? "Matriz Principal" : "Sucursal"}
                                        </Text>
                                    </YStack>
                                </XStack>
                            </XStack>
                            
                            <Separator borderColor="$borderColor" opacity={0.5} my="$2" />
                            
                            <YStack gap="$2" px="$1">
                                 <XStack gap="$2" alignItems="center">
                                    <MapPin size={14} color="$color" opacity={0.6} />
                                    <Text fontSize="$3" color="$color" opacity={0.8}>{item.address}, {item.city}</Text>
                                 </XStack>
                                 <XStack gap="$2" alignItems="center">
                                    <Phone size={14} color="$color" opacity={0.6} />
                                    <Text fontSize="$3" color="$color" opacity={0.8}>{item.phone}</Text>
                                 </XStack>
                                 <XStack gap="$2" alignItems="center">
                                    <Mail size={14} color="$color" opacity={0.6} />
                                    <Text fontSize="$3" color="$color" opacity={0.8}>{item.email}</Text>
                                 </XStack>
                            </YStack>

                            <XStack gap="$3" mt="$3">
                                <Button 
                                    flex={1} 
                                    size="$3" 
                                    chromeless 
                                    borderWidth={1} 
                                    borderColor="$borderColor" 
                                    icon={Users}
                                    onPress={() => handleNavigateToBranchUsers(item)}
                                >
                                    Usuarios
                                </Button>
                                <Button flex={1} size="$3" chromeless borderWidth={1} borderColor="$borderColor" icon={Edit3} onPress={() => handleSelectBranch(item)} />
                                <Button
                                    flex={1}
                                    size="$3"
                                    backgroundColor="$red10"
                                    color="white"
                                    icon={Trash2}
                                    disabled={deleteMutation.isPending}
                                    onPress={() => handleDeleteBranch(item.branch_id)}
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

