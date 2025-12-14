import { useCallback, useMemo, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { Alert } from "react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { RoleSwitcher } from "@/components/admin/RoleSwitcher";
import { adminService } from "@/services/adminService";
import { EmployeeState } from "@/types/api";
import {
  Adapt,
  Paragraph,
  ScrollView,
  Select,
  Sheet,
  Text,
  XStack,
  YStack
} from "tamagui";

interface UserFormState {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm: string;
  employee_state_id: number | null;
}

const emptyForm: UserFormState = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  confirm: "",
  employee_state_id: null
};

export default function AdminCreateUserScreen(): JSX.Element {
  const router = useRouter();
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "employee-states"],
    queryFn: adminService.getEmployeeStates
  });

  const states: EmployeeState[] = data?.data ?? [];

  const stateOptions = useMemo(
    () => states.map((state) => ({ label: state.name, value: String(state.employee_state_id) })),
    [states]
  );

  const handleSetField = useCallback(<K extends keyof UserFormState>(key: K, value: UserFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isEmailValid = useMemo(() => /^[\w-.]+@[\w-]+\.[\w-.]+$/.test(form.email.trim()), [form.email]);
  const isPasswordValid = useMemo(() => form.password.trim().length >= 8, [form.password]);
  const isConfirmValid = useMemo(() => form.password === form.confirm, [form.confirm, form.password]);
  const isStateSelected = typeof form.employee_state_id === "number" && form.employee_state_id > 0;

  const formIsValid = useMemo(() => {
    return (
      form.first_name.trim().length > 1 &&
      form.last_name.trim().length > 1 &&
      isEmailValid &&
      isPasswordValid &&
      isConfirmValid &&
      isStateSelected
    );
  }, [form.first_name, form.last_name, isConfirmValid, isEmailValid, isPasswordValid, isStateSelected]);

  const createMutation = useMutation({
    mutationFn: adminService.createUser,
    onSuccess: (response) => {
      setFeedback({ type: "success", message: "Usuario creado" });
      setTimeout(() => setFeedback(null), 2200);
      const userId = response.data?.user_id;
      if (!userId) {
        Alert.alert("Usuario creado", "No se pudo obtener el identificador.");
        return;
      }
      // TODO(Fase 3): Esta pantalla debe existir antes de habilitar el flujo completo.
      router.replace(`/(app)/(admin)/employee-details/create/${userId}`);
    },
    onError: () => {
      setFeedback({ type: "error", message: "No se pudo crear el usuario" });
      setTimeout(() => setFeedback(null), 2200);
    }
  });

  const handleSubmit = useCallback(() => {
    if (!formIsValid) return;
    if (!form.employee_state_id) return;
    createMutation.mutate({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password.trim(),
      employee_state_id: form.employee_state_id
    });
  }, [createMutation, form.employee_state_id, form.email, form.first_name, form.last_name, form.password, formIsValid]);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 64 }}>
        <YStack gap="$5">
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$7" color="$text">
              Crear usuario
            </Text>
            <Paragraph color="$muted">
              Registra la cuenta base del colaborador antes de definir sus detalles laborales.
            </Paragraph>
          </YStack>

          <RoleSwitcher target="employee" />

          {isLoading ? (
            <ListSkeleton items={4} height={88} />
          ) : isError ? (
            <AnimatedNotice
              variant="error"
              title="No pudimos cargar estados"
              message="Reintenta para continuar."
              actionLabel="Reintentar"
              onAction={() => refetch()}
            />
          ) : (
            <YStack gap="$3" backgroundColor="$brandBg" p="$4" borderRadius="$6">
              <AnimatedInput
                label="Nombre"
                placeholder="Nombre"
                value={form.first_name}
                onChangeText={(value) => handleSetField("first_name", value)}
              />
              <AnimatedInput
                label="Apellido"
                placeholder="Apellido"
                value={form.last_name}
                onChangeText={(value) => handleSetField("last_name", value)}
              />
              <AnimatedInput
                label="Correo"
                placeholder="correo@empresa.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(value) => handleSetField("email", value)}
                status={form.email.length > 0 ? (isEmailValid ? "success" : "error") : undefined}
              />
              <AnimatedInput
                label="Contraseña"
                placeholder="********"
                secureTextEntry
                value={form.password}
                onChangeText={(value) => handleSetField("password", value)}
                status={form.password.length > 0 ? (isPasswordValid ? "success" : "error") : undefined}
              />
              <AnimatedInput
                label="Confirmar contraseña"
                placeholder="********"
                secureTextEntry
                value={form.confirm}
                onChangeText={(value) => handleSetField("confirm", value)}
                status={form.confirm.length > 0 ? (isConfirmValid ? "success" : "error") : undefined}
              />

              <YStack gap="$1">
                <Text fontWeight="600" color="$text">
                  Estado del colaborador
                </Text>
                <Select
                  value={form.employee_state_id ? String(form.employee_state_id) : undefined}
                  onValueChange={(value) => handleSetField("employee_state_id", Number(value))}
                  disabled={stateOptions.length === 0}
                >
                  <Select.Trigger borderColor="$borderColor">
                    <Select.Value placeholder="Selecciona" />
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
                      {stateOptions.map((option) => (
                        <Select.Item key={option.value} value={option.value}>
                          <Select.ItemText>{option.label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                    <Select.ScrollDownButton />
                  </Select.Content>
                </Select>
              </YStack>

              <Paragraph color="$muted" fontSize="$2">
                Asegúrate de que la contraseña tenga mínimo 8 caracteres y selecciona el estado correcto.
              </Paragraph>

              <XStack gap="$3" mt="$3">
                <AnimatedButton flex={1} backgroundColor="$color4" color="$text" onPress={() => router.back()}>
                  Cancelar
                </AnimatedButton>
                <AnimatedButton flex={1} disabled={!formIsValid || createMutation.isPending} onPress={handleSubmit}>
                  {createMutation.isPending ? "Creando..." : "Crear usuario"}
                </AnimatedButton>
              </XStack>
            </YStack>
          )}

          {feedback ? (
            <AnimatedNotice
              variant={feedback.type}
              message={feedback.message}
              actionLabel="Cerrar"
              onAction={() => setFeedback(null)}
            />
          ) : null}
        </YStack>
      </ScrollView>
    </Screen>
  );
}

