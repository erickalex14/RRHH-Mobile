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
import { adminService, BranchPayload } from "@/services/adminService";
import { Branch, Company } from "@/types/api";
import {
  Adapt,
  AnimatePresence,
  Paragraph,
  ScrollView,
  Select,
  Separator,
  Sheet,
  Switch,
  Text,
  XStack,
  YStack
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

  const companies: Company[] = companiesData?.data ?? [];
  const branches: Branch[] = branchesData?.data ?? [];

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
      <ScrollView contentContainerStyle={{ paddingBottom: 64 }}>
        <YStack gap="$5">
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$7" color="$text">
              Sucursales
            </Text>
            <Paragraph color="$muted">Controla aperturas, actualiza datos y asigna la compañía matriz.</Paragraph>
          </YStack>

          <RoleSwitcher target="employee" />

          <YStack gap="$3" backgroundColor="$brandBg" p="$4" borderRadius="$6">
            <Text fontFamily="$heading" fontSize="$5" color="$text">
              {editingBranch ? `Editar ${editingBranch.name}` : "Nueva sucursal"}
            </Text>
            <Paragraph color="$muted">{helperText}</Paragraph>

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
                <YStack gap="$1">
                  <Text fontWeight="600" color="$text">
                    Compañía
                  </Text>
                  <Select
                    value={form.company_id ? String(form.company_id) : undefined}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, company_id: Number(value) }))
                    }
                    disabled={isCompaniesLoading || companies.length === 0}
                  >
                    <Select.Trigger borderColor="$borderColor">
                      <Select.Value placeholder={isCompaniesLoading ? "Cargando..." : "Selecciona"} />
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
                        {companies.map((company) => (
                          <Select.Item key={company.company_id} value={String(company.company_id)}>
                            <Select.ItemText>{company.name}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                      <Select.ScrollDownButton />
                    </Select.Content>
                  </Select>
                </YStack>

                <AnimatedInput
                  label="Nombre"
                  placeholder="Sucursal Centro"
                  value={form.name}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
                />
                <AnimatedInput
                  label="Código"
                  placeholder="CENTRO-01"
                  autoCapitalize="characters"
                  value={form.code}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, code: value }))}
                />
                <AnimatedInput
                  label="Dirección"
                  placeholder="Av. Principal 123"
                  value={form.address}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, address: value }))}
                />
                <AnimatedInput
                  label="Ciudad"
                  placeholder="Quito"
                  value={form.city}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, city: value }))}
                />
                <AnimatedInput
                  label="Provincia/Estado"
                  placeholder="Pichincha"
                  value={form.state}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, state: value }))}
                />
                <AnimatedInput
                  label="País"
                  placeholder="Ecuador"
                  value={form.country}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, country: value }))}
                />
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
                <AnimatedInput
                  label="Correo"
                  placeholder="sucursal@empresa.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={form.email}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
                />
                <XStack alignItems="center" justifyContent="space-between" mt="$1">
                  <YStack gap="$1">
                    <Text fontWeight="600" color="$text">
                      ¿Es matriz?
                    </Text>
                    <Paragraph color="$muted" fontSize="$2">
                      Marca si esta sucursal centraliza operaciones.
                    </Paragraph>
                  </YStack>
                  <Switch
                    size="$3"
                    checked={form.matrix}
                    onCheckedChange={(value) =>
                      setForm((prev) => ({ ...prev, matrix: Boolean(value) }))
                    }
                  >
                    <Switch.Thumb animation="quick" />
                  </Switch>
                </XStack>
              </YStack>
            )}

            <XStack gap="$3" mt="$3">
              {editingBranch ? (
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
                {editingBranch ? "Guardar cambios" : "Crear"}
              </AnimatedButton>
            </XStack>
          </YStack>

          <XStack gap="$3">
            <AnimatedButton
              flex={1}
              backgroundColor="$color4"
              color="$text"
              disabled={isBranchesLoading || isBranchesFetching}
              onPress={() => refetchBranches()}
            >
              {isBranchesFetching ? "Sincronizando..." : "Actualizar"}
            </AnimatedButton>
          </XStack>

          <YStack gap="$3">
            <Text fontFamily="$heading" fontSize="$5" color="$text">
              Sucursales registradas
            </Text>
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
              <Animated.FlatList<Branch>
                data={branches}
                keyExtractor={(item) => String(item.branch_id)}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <Separator backgroundColor="$color4" />}
                renderItem={({ item, index }) => (
                  <Animated.View entering={FadeInDown.delay(index * 90)}>
                    <InteractiveCard onPress={() => handleSelectBranch(item)}>
                      <YStack gap="$2">
                        <XStack justifyContent="space-between" alignItems="center">
                          <Text fontWeight="600" fontSize="$4" color="$text">
                            {item.name}
                          </Text>
                          <Text color={item.matrix ? "$success" : "$muted"} fontSize="$2">
                            {item.matrix ? "Matriz" : "Sucursal"}
                          </Text>
                        </XStack>
                        <Paragraph color="$muted">Código: {item.code}</Paragraph>
                        <Paragraph color="$muted">
                          Compañía: {item.company?.name ?? "Sin asignar"}
                        </Paragraph>
                        <Paragraph color="$muted">
                          {item.address}, {item.city}, {item.state} - {item.country}
                        </Paragraph>
                        <Paragraph color="$muted">Tel: {item.phone} · {item.email}</Paragraph>
                        <AnimatedButton
                          mt="$2"
                          backgroundColor="$color3"
                          color="$text"
                          onPress={() => handleNavigateToBranchUsers(item)}
                        >
                          Ver usuarios
                        </AnimatedButton>
                        <XStack gap="$2" mt="$2">
                          <AnimatedButton flex={1} backgroundColor="$color4" color="$text" onPress={() => handleSelectBranch(item)}>
                            Editar
                          </AnimatedButton>
                          <AnimatedButton
                            flex={1}
                            backgroundColor="$danger"
                            color="#fff"
                            disabled={deleteMutation.isPending}
                            onPress={() => handleDeleteBranch(item.branch_id)}
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

