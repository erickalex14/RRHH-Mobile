import { useCallback, useMemo, useState } from "react";
import { Platform } from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent
} from "@react-native-community/datetimepicker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Screen } from "@/components/ui/Screen";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { InteractiveCard } from "@/components/ui/InteractiveCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { SimpleSelect } from "@/components/ui/SimpleSelect";
import { LinearGradient } from "expo-linear-gradient";
import { adminService, EmployeeDetailPayload } from "@/services/adminService";
import { Department, Role, Schedule, User } from "@/types/api";
import {
  Paragraph,
  ScrollView,
  Separator,
  Sheet,
  Text,
  XStack,
  YStack
} from "tamagui";

interface DetailFormState {
  role_id: number | null;
  department_id: number | null;
  schedule_id: number | null;
  national_id: string;
  address: string;
  phone: string;
}

type CatalogsData = {
  roles: Role[];
  departments: Department[];
  schedules: Schedule[];
};

type PickerTarget = "birth" | "hire";

const emptyForm: DetailFormState = {
  role_id: null,
  department_id: null,
  schedule_id: null,
  national_id: "",
  address: "",
  phone: ""
};

const DEFAULT_BIRTH_DATE = new Date(1990, 0, 1);

export default function AdminCreateEmployeeDetailScreen(): JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ user_id?: string }>();
  const userId = Number(params.user_id);
  const hasValidUser = Number.isFinite(userId) && userId > 0;

  const [form, setForm] = useState<DetailFormState>(emptyForm);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [hireDate, setHireDate] = useState<Date | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [pickerState, setPickerState] = useState<{ open: boolean; target: PickerTarget } | null>(null);

  const {
    data: userResponse,
    isLoading: isUserLoading,
    isError: isUserError,
    refetch: refetchUser
  } = useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: () => adminService.getUserById(userId),
    enabled: hasValidUser
  });

  const {
    data: catalogResponse,
    isLoading: isCatalogLoading,
    isError: isCatalogError,
    refetch: refetchCatalogs
  } = useQuery<CatalogsData>({
    queryKey: ["admin", "employee-detail", "catalogs"],
    queryFn: async () => {
      const [roles, departments, schedules] = await Promise.all([
        adminService.getRoles(),
        adminService.getDepartments(),
        adminService.getSchedules()
      ]);
      return {
        roles: roles.data ?? [],
        departments: departments.data ?? [],
        schedules: schedules.data ?? []
      };
    },
    enabled: hasValidUser
  });

  const user: User | undefined = userResponse?.data;
  const roles: Role[] = catalogResponse?.roles ?? [];
  const departments: Department[] = catalogResponse?.departments ?? [];
  const schedules: Schedule[] = catalogResponse?.schedules ?? [];

  const handleSetForm = useCallback(<K extends keyof DetailFormState>(key: K, value: DetailFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const selectedDepartment = useMemo(
    () => departments.find((dept) => dept.department_id === form.department_id) ?? null,
    [departments, form.department_id]
  );

  const branchInfo = useMemo(() => {
    if (!selectedDepartment?.branch) return "Sin sucursal";
    const { name, company } = selectedDepartment.branch;
    return `${name}${company ? ` · ${company.name}` : ""}`;
  }, [selectedDepartment]);

  const isNationalIdValid = useMemo(() => /^\d{10}$/.test(form.national_id), [form.national_id]);
  const isPhoneValid = useMemo(() => /^\d{10}$/.test(form.phone), [form.phone]);
  const isAddressValid = useMemo(() => form.address.trim().length > 5, [form.address]);
  const hasRole = typeof form.role_id === "number" && form.role_id > 0;
  const hasDepartment = typeof form.department_id === "number" && form.department_id > 0;
  const hasSchedule = typeof form.schedule_id === "number" && form.schedule_id > 0;

  const datesAreValid = useMemo(() => {
    if (!birthDate || !hireDate) return false;
    const today = new Date();
    const hireAfterBirth = hireDate >= birthDate;
    const hireNotFuture = hireDate <= today;
    const birthNotFuture = birthDate <= today;
    return hireAfterBirth && hireNotFuture && birthNotFuture;
  }, [birthDate, hireDate]);

  const formIsValid =
    hasRole &&
    hasDepartment &&
    hasSchedule &&
    isNationalIdValid &&
    isPhoneValid &&
    isAddressValid &&
    datesAreValid;

  const payload: EmployeeDetailPayload | null = useMemo(() => {
    if (!formIsValid || !birthDate || !hireDate || !hasValidUser) return null;
    return {
      user_id: userId,
      role_id: form.role_id as number,
      department_id: form.department_id as number,
      schedule_id: form.schedule_id as number,
      national_id: form.national_id,
      address: form.address.trim(),
      phone: form.phone,
      hire_date: format(hireDate, "yyyy-MM-dd"),
      birth_date: format(birthDate, "yyyy-MM-dd")
    };
  }, [birthDate, form.address, form.department_id, form.phone, form.role_id, form.schedule_id, formIsValid, hasValidUser, hireDate, userId]);

  const createMutation = useMutation({
    mutationFn: adminService.createEmployeeDetail,
    onSuccess: () => {
      setFeedback({ type: "success", message: "Detalles registrados correctamente" });
      setTimeout(() => {
        router.replace("/(app)/(admin)/users");
      }, 1500);
    },
    onError: () => {
      setFeedback({ type: "error", message: "No pudimos guardar los detalles" });
      setTimeout(() => setFeedback(null), 2500);
    }
  });

  const handleOpenPicker = useCallback((target: PickerTarget) => {
    const currentValue = target === "birth" ? birthDate ?? DEFAULT_BIRTH_DATE : hireDate ?? new Date();
    const minimumDate = target === "hire" && birthDate ? birthDate : undefined;
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        mode: "date",
        value: currentValue,
        maximumDate: new Date(),
        minimumDate,
        onChange: (_event, selectedDate) => {
          if (!selectedDate) return;
          if (target === "birth") {
            setBirthDate(selectedDate);
            if (hireDate && selectedDate > hireDate) {
              setHireDate(null);
            }
          } else {
            setHireDate(selectedDate);
          }
        }
      });
      return;
    }
    setPickerState({ open: true, target });
  }, [birthDate, hireDate]);

  const handleIOSDateChange = useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      if (!selectedDate || !pickerState) return;
      if (pickerState.target === "birth") {
        setBirthDate(selectedDate);
        if (hireDate && selectedDate > hireDate) {
          setHireDate(null);
        }
      } else {
        setHireDate(selectedDate);
      }
    },
    [hireDate, pickerState]
  );

  const closeIOSPicker = useCallback(() => {
    setPickerState((prev) => (prev ? { ...prev, open: false } : prev));
  }, []);

  const displayDate = useCallback((date: Date | null) => (date ? format(date, "dd/MM/yyyy") : "Selecciona una fecha"), []);

  const handleSubmit = useCallback(() => {
    if (!payload) return;
    createMutation.mutate(payload);
  }, [createMutation, payload]);

  if (!hasValidUser) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <YStack flex={1} justifyContent="center" p="$4">
          <AnimatedNotice
            variant="error"
            title="Usuario inválido"
            message="El identificador proporcionado no es válido."
            actionLabel="Volver"
            onAction={() => router.replace("/(app)/(admin)/users")}
          />
        </YStack>
      </Screen>
    );
  }

  const isLoading = isUserLoading || isCatalogLoading;
  const hasError = isUserError || isCatalogError;

  return (
    <Screen>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={{ position: 'absolute', width: '100%', height: '100%', zIndex: -1 }}
      />
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 72 }}>
        <YStack gap="$5" p="$4">
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$7" color="white">
              Detalles del colaborador
            </Text>
            <Paragraph color="$gray10">
              Completa la información laboral y personal asociada al usuario recién creado.
            </Paragraph>
          </YStack>

          <AdminNavbar />

          {isLoading ? (
            <ListSkeleton items={5} height={120} />
          ) : hasError ? (
            <AnimatedNotice
              variant="error"
              title="No pudimos cargar la información"
              message="Revisa tu conexión e intenta de nuevo."
              actionLabel="Reintentar"
              onAction={() => {
                void refetchUser();
                void refetchCatalogs();
              }}
            />
          ) : !user ? (
            <AnimatedNotice
              variant="error"
              title="Usuario no encontrado"
              message="Verifica que el identificador exista."
              actionLabel="Volver"
              onAction={() => router.replace("/(app)/(admin)/users")}
            />
          ) : roles.length === 0 || departments.length === 0 || schedules.length === 0 ? (
            <AnimatedNotice
              variant="info"
              message="Debes registrar roles, departamentos y horarios antes de continuar."
              actionLabel="Volver"
              onAction={() => router.replace("/(app)/(admin)/users")}
            />
          ) : (
            <YStack gap="$4">
              <GlassCard p="$4">
                <YStack gap="$2">
                  <Text fontWeight="600" fontSize="$5" color="white">
                    {[user.first_name, user.last_name].filter(Boolean).join(" ") || `Usuario #${user.user_id}`}
                  </Text>
                  <Paragraph color="$gray10">{user.email}</Paragraph>
                  <StatusBadge label={user.employeeState?.name ?? "Sin estado"} />
                </YStack>
              </GlassCard>

              <GlassCard gap="$3" p="$4" borderRadius="$6">
                <Text fontFamily="$heading" fontSize="$5" color="white">
                  Información laboral
                </Text>
                <YStack gap="$3">
                  <YStack gap="$1">
                    <Text fontWeight="600" color="white">
                      Rol
                    </Text>
                    <SimpleSelect
                      value={form.role_id ? String(form.role_id) : ""}
                      onValueChange={(value) => handleSetForm("role_id", Number(value))}
                      options={roles.map(r => ({ label: r.name, value: String(r.role_id) }))}
                      placeholder="Selecciona"
                    />
                  </YStack>

                  <YStack gap="$1">
                    <Text fontWeight="600" color="white">
                      Departamento
                    </Text>
                    <SimpleSelect
                      value={form.department_id ? String(form.department_id) : ""}
                      onValueChange={(value) => handleSetForm("department_id", Number(value))}
                      options={departments.map(d => ({ label: d.name, value: String(d.department_id) }))}
                      placeholder="Selecciona"
                    />
                    <Paragraph color="$gray10" fontSize="$2" mt="$1">
                      Sucursal asignada: {branchInfo}
                    </Paragraph>
                  </YStack>

                  <YStack gap="$1">
                    <Text fontWeight="600" color="white">
                      Horario
                    </Text>
                    <SimpleSelect
                      value={form.schedule_id ? String(form.schedule_id) : ""}
                      onValueChange={(value) => handleSetForm("schedule_id", Number(value))}
                      options={schedules.map(s => ({ label: s.name, value: String(s.schedule_id) }))}
                      placeholder="Selecciona"
                    />
                  </YStack>
                </YStack>

                <Separator borderColor="rgba(255,255,255,0.1)" my="$3" />

                <Text fontFamily="$heading" fontSize="$5" color="white">
                  Datos personales
                </Text>
                <YStack gap="$3">
                  <AnimatedInput
                    label="Cédula"
                    placeholder="0000000000"
                    keyboardType="number-pad"
                    maxLength={10}
                    value={form.national_id}
                    onChangeText={(value) => handleSetForm("national_id", value.replace(/[^0-9]/g, ""))}
                    status={form.national_id.length > 0 ? (isNationalIdValid ? "success" : "error") : undefined}
                  />
                  <AnimatedInput
                    label="Dirección"
                    placeholder="Av. Principal 123"
                    value={form.address}
                    onChangeText={(value) => handleSetForm("address", value)}
                    status={form.address.length > 0 ? (isAddressValid ? "success" : "error") : undefined}
                  />
                  <AnimatedInput
                    label="Teléfono"
                    placeholder="0999999999"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={form.phone}
                    onChangeText={(value) => handleSetForm("phone", value.replace(/[^0-9]/g, ""))}
                    status={form.phone.length > 0 ? (isPhoneValid ? "success" : "error") : undefined}
                  />

                  <YStack gap="$1">
                    <Text fontWeight="600" color="white">
                      Fecha de nacimiento
                    </Text>
                    <AnimatedButton
                      backgroundColor="rgba(255,255,255,0.1)"
                      color="white"
                      onPress={() => handleOpenPicker("birth")}
                    >
                      {displayDate(birthDate)}
                    </AnimatedButton>
                  </YStack>

                  <YStack gap="$1">
                    <Text fontWeight="600" color="white">
                      Fecha de ingreso
                    </Text>
                    <AnimatedButton
                      backgroundColor="rgba(255,255,255,0.1)"
                      color="white"
                      onPress={() => handleOpenPicker("hire")}
                    >
                      {displayDate(hireDate)}
                    </AnimatedButton>
                    <Paragraph color="$gray10" fontSize="$2" mt="$1">
                      Debe ser igual o posterior a la fecha de nacimiento.
                    </Paragraph>
                  </YStack>
                </YStack>

                <XStack gap="$3" mt="$3">
                  <AnimatedButton
                    flex={1}
                    backgroundColor="rgba(255,255,255,0.1)"
                    color="white"
                    onPress={() => router.replace("/(app)/(admin)/users")}
                  >
                    Cancelar
                  </AnimatedButton>
                  <AnimatedButton
                    flex={1}
                    disabled={!formIsValid || createMutation.isPending}
                    onPress={handleSubmit}
                  >
                    {createMutation.isPending ? "Guardando..." : "Guardar detalles"}
                  </AnimatedButton>
                </XStack>
              </GlassCard>

              {feedback ? (
                <AnimatedNotice
                  variant={feedback.type}
                  message={feedback.message}
                  actionLabel="Cerrar"
                  onAction={() => setFeedback(null)}
                />
              ) : null}
            </YStack>
          )}
        </YStack>
      </ScrollView>

      {Platform.OS === "ios" && pickerState?.open ? (
        <Sheet
          modal
          open
          onOpenChange={(open: boolean) => setPickerState((prev) => (prev ? { ...prev, open } : prev))}
        >
          <Sheet.Frame>
            <YStack gap="$3" p="$4">
              <Text fontFamily="$heading" fontSize="$5" color="$text">
                Selecciona una fecha
              </Text>
              <DateTimePicker
                value={pickerState.target === "birth" ? birthDate ?? DEFAULT_BIRTH_DATE : hireDate ?? new Date()}
                mode="date"
                maximumDate={new Date()}
                minimumDate={pickerState.target === "hire" && birthDate ? birthDate : undefined}
                onChange={handleIOSDateChange}
              />
              <AnimatedButton onPress={closeIOSPicker}>Listo</AnimatedButton>
            </YStack>
          </Sheet.Frame>
          <Sheet.Overlay enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        </Sheet>
      ) : null}
    </Screen>
  );
}

