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
import { adminService, CompanyPayload } from "@/services/adminService";
import { Company } from "@/types/api";
import {
  AnimatePresence,
  Paragraph,
  ScrollView,
  Separator,
  Text,
  XStack,
  YStack
} from "tamagui";

const emptyForm: CompanyPayload = {
  name: "",
  ruc: "",
  address: "",
  phone: "",
  email: ""
};

export default function AdminCrudScreen(): JSX.Element {
  const [form, setForm] = useState<CompanyPayload>(emptyForm);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "companies"],
    queryFn: adminService.getCompanies
  });

  const invalidateCompanies = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
  }, [queryClient]);

  const closeFeedback = useCallback(() => {
    setTimeout(() => setFeedback(null), 2500);
  }, []);

  const createMutation = useMutation({
    mutationFn: adminService.createCompany,
    onSuccess: () => {
      setForm(emptyForm);
      setFeedback({ type: "success", message: "Empresa creada" });
      invalidateCompanies();
      closeFeedback();
    },
    onError: () => {
      setFeedback({ type: "error", message: "No se pudo crear" });
      closeFeedback();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ companyId, payload }: { companyId: number; payload: CompanyPayload }) =>
      adminService.updateCompany(companyId, payload),
    onSuccess: () => {
      setEditingCompany(null);
      setForm(emptyForm);
      setFeedback({ type: "success", message: "Empresa actualizada" });
      invalidateCompanies();
      closeFeedback();
    },
    onError: () => {
      setFeedback({ type: "error", message: "No se pudo actualizar" });
      closeFeedback();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteCompany,
    onSuccess: () => {
      setFeedback({ type: "success", message: "Empresa eliminada" });
      invalidateCompanies();
      closeFeedback();
    },
    onError: () => {
      setFeedback({ type: "error", message: "No se pudo eliminar" });
      closeFeedback();
    }
  });

  const handleSubmit = useCallback(() => {
    if (editingCompany) {
      updateMutation.mutate({ companyId: editingCompany.company_id, payload: form });
      return;
    }
    createMutation.mutate(form);
  }, [createMutation, editingCompany, form, updateMutation]);

  const handleSelectCompany = useCallback((company: Company) => {
    setEditingCompany(company);
    setForm({
      name: company.name,
      ruc: company.ruc ?? "",
      address: company.address ?? "",
      phone: company.phone ?? "",
      email: company.email ?? ""
    });
  }, []);

  const handleDelete = useCallback((company: Company) => {
    deleteMutation.mutate(company.company_id);
  }, [deleteMutation]);

  const disableSubmit = createMutation.isPending || updateMutation.isPending;

  const companies = data?.data ?? [];

  const helperText = useMemo(
    () => (editingCompany ? "Editando registro existente" : "Crea una nueva compañía"),
    [editingCompany]
  );

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 56 }}>
        <YStack gap="$5">
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$7" color="$text">
              Catálogos principales
            </Text>
            <Paragraph color="$muted">
              Administra compañías para habilitar ramas y departamentos.
            </Paragraph>
          </YStack>

          <RoleSwitcher target="employee" />

          <YStack gap="$3" backgroundColor="$brandBg" p="$4" borderRadius="$6">
            <Text fontFamily="$heading" fontSize="$5" color="$text">
              {editingCompany ? `Editar ${editingCompany.name}` : "Nueva compañía"}
            </Text>
            <Paragraph color="$muted">{helperText}</Paragraph>
            <YStack gap="$3" mt="$2">
              <AnimatedInput
                label="Nombre"
                placeholder="RRHH Global"
                value={form.name}
                onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
              />
              <AnimatedInput
                label="RUC"
                placeholder="0000000000001"
                value={form.ruc}
                maxLength={13}
                onChangeText={(value) => setForm((prev) => ({ ...prev, ruc: value }))}
              />
              <AnimatedInput
                label="Dirección"
                placeholder="Av. Siempre Viva"
                value={form.address}
                onChangeText={(value) => setForm((prev) => ({ ...prev, address: value }))}
              />
              <AnimatedInput
                label="Teléfono"
                placeholder="(04) 000 0000"
                value={form.phone}
                onChangeText={(value) => setForm((prev) => ({ ...prev, phone: value }))}
              />
              <AnimatedInput
                label="Correo"
                placeholder="contacto@empresa.com"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
              />
            </YStack>
            <XStack gap="$3" mt="$3">
              {editingCompany ? (
                <AnimatedButton
                  flex={1}
                  backgroundColor="$color4"
                  color="$text"
                  disabled={disableSubmit}
                  onPress={() => {
                    setEditingCompany(null);
                    setForm(emptyForm);
                  }}
                >
                  Cancelar
                </AnimatedButton>
              ) : null}
              <AnimatedButton
                flex={1}
                disabled={disableSubmit}
                onPress={handleSubmit}
              >
                {editingCompany ? "Guardar cambios" : "Crear"}
              </AnimatedButton>
            </XStack>
          </YStack>

          <YStack gap="$3">
            <Text fontFamily="$heading" fontSize="$5" color="$text">
              Empresas registradas
            </Text>
            {isLoading || isFetching ? (
              <ListSkeleton items={3} height={112} />
            ) : isError ? (
              <AnimatedNotice
                variant="error"
                title="No se pudieron cargar"
                message="Verifica tu conexión e intenta nuevamente."
                actionLabel="Reintentar"
                onAction={() => void refetch()}
              />
            ) : (
              <Animated.FlatList<Company>
                data={companies}
                keyExtractor={(item) => String(item.company_id)}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <Separator backgroundColor="$color4" />}
                renderItem={({ item, index }) => (
                  <Animated.View entering={FadeInDown.delay(index * 90)}>
                    <InteractiveCard onPress={() => handleSelectCompany(item)}>
                      <YStack gap="$2">
                        <Text fontSize="$4" fontWeight="600" color="$text">
                          {item.name}
                        </Text>
                        <Paragraph color="$muted">RUC: {item.ruc ?? "Sin asignar"}</Paragraph>
                        <Paragraph color="$muted">
                          Dirección: {item.address ?? "-"}
                        </Paragraph>
                        <XStack gap="$2" mt="$2">
                          <AnimatedButton
                            flex={1}
                            backgroundColor="$color4"
                            color="$text"
                            onPress={() => handleSelectCompany(item)}
                          >
                            Editar
                          </AnimatedButton>
                          <AnimatedButton
                            flex={1}
                            backgroundColor="$danger"
                            color="#fff"
                            onPress={() => handleDelete(item)}
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

