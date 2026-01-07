import { useCallback, useMemo, useState } from "react";
import { Stack } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { InteractiveCard } from "@/components/ui/InteractiveCard";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { adminService, CompanyPayload } from "@/services/adminService";
import { Company } from "@/types/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { LinearGradient } from "expo-linear-gradient";
import { Building, MapPin, Phone, Mail, Edit3, Trash2 } from "@tamagui/lucide-icons";
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <YStack gap="$4" pt="$safe" px="$0">
          
          {/* Header */}
           <YStack gap="$1" mb="$2">
                <H2 fontWeight="800" fontSize={26} color="$color">Compañías</H2>
                <Paragraph color="$color" opacity={0.6}>
                 Administra compañías para habilitar ramas y departamentos.
                </Paragraph>
          </YStack>


          {/* Form Block */}
          <GlassCard gap="$3" p="$4" borderRadius="$6">
            <Text fontFamily="$heading" fontSize="$5" color="$color">
              {editingCompany ? `Editar ${editingCompany.name}` : "Nueva compañía"}
            </Text>
            <Paragraph color="$color" opacity={0.6}>{helperText}</Paragraph>
            <YStack gap="$3" mt="$2">
              <AnimatedInput
                label="Nombre"
                placeholder="Ej. RRHH Global"
                value={form.name}
                onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
              />
              <AnimatedInput
                 label="RUC"
                 placeholder="1234567890001"
                 value={form.ruc}
                 maxLength={13}
                 onChangeText={(value) => setForm((prev) => ({ ...prev, ruc: value }))}
               />
               
              <AnimatedInput
                label="Dirección"
                placeholder="Calle Principal 123"
                value={form.address}
                onChangeText={(value) => setForm((prev) => ({ ...prev, address: value }))}
              />
              
              <XStack gap="$3">
                  <YStack flex={1}>
                    <AnimatedInput
                        label="Teléfono"
                        placeholder="0999999999"
                        value={form.phone}
                        onChangeText={(value) => setForm((prev) => ({ ...prev, phone: value }))}
                    />
                  </YStack>
                  <YStack flex={1}>
                    <AnimatedInput
                        label="Correo"
                        placeholder="contacto@empresa.com"
                        autoCapitalize="none"
                        value={form.email}
                        onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
                    />
                  </YStack>
              </XStack>
            </YStack>
            <XStack gap="$3" mt="$3">
              {editingCompany ? (
                <AnimatedButton
                  flex={1}
                  backgroundColor="rgba(239, 68, 68, 0.2)"
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
                {editingCompany ? "Guardar cambios" : "Crear compañía"}
              </AnimatedButton>
            </XStack>
          </GlassCard>

          <YStack gap="$3">
            <H2 fontSize={20} color="$color" mt="$4">Empresas registradas</H2>
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
                <YStack gap="$3">
                  {companies.map((item, index) => (
                    <Animated.View key={item.company_id} entering={FadeInDown.delay(index * 90).springify()}>
                        <GlassCard p="$4" gap="$2">
                             <XStack justifyContent="space-between" alignItems="center">
                                <XStack gap="$3" alignItems="center">
                                    <GlassCard p="$2" borderRadius="$4" backgroundColor="$backgroundPress">
                                        <Building size={24} color="$blue10" />
                                    </GlassCard>
                                    <YStack>
                                        <Text fontWeight="700" fontSize="$5" color="$color">
                                            {item.name}
                                        </Text>
                                        <Text color="$color" opacity={0.6} fontSize="$3">
                                            RUC: {item.ruc ?? "Sin asignar"}
                                        </Text>
                                    </YStack>
                                </XStack>
                            </XStack>

                            <Separator borderColor="$borderColor" opacity={0.5} my="$2" />

                             <YStack gap="$2" px="$1">
                                 <XStack gap="$2" alignItems="center">
                                    <MapPin size={14} color="$color" opacity={0.6} />
                                    <Text fontSize="$3" color="$color" opacity={0.8}>{item.address ?? "Sin dirección"}</Text>
                                 </XStack>
                                 {item.phone && (
                                     <XStack gap="$2" alignItems="center">
                                        <Phone size={14} color="$color" opacity={0.6} />
                                        <Text fontSize="$3" color="$color" opacity={0.8}>{item.phone}</Text>
                                     </XStack>
                                 )}
                                  {item.email && (
                                     <XStack gap="$2" alignItems="center">
                                        <Mail size={14} color="$color" opacity={0.6} />
                                        <Text fontSize="$3" color="$color" opacity={0.8}>{item.email}</Text>
                                     </XStack>
                                 )}
                            </YStack>
                            
                            <XStack gap="$3" mt="$3">
                              <Button
                                flex={1}
                                size="$3"
                                chromeless
                                borderWidth={1}
                                borderColor="$borderColor"
                                icon={Edit3}
                                onPress={() => handleSelectCompany(item)}
                              />
                              <Button
                                flex={1}
                                size="$3"
                                backgroundColor="$red10"
                                color="white"
                                icon={Trash2}
                                onPress={() => handleDelete(item)}
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

