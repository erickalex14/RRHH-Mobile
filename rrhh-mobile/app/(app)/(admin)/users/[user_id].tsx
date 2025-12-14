import { useCallback, useEffect, useMemo, useState } from "react";
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
import { RoleSwitcher } from "@/components/admin/RoleSwitcher";
import { InteractiveCard } from "@/components/ui/InteractiveCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import {
  adminService,
  EmployeeDetailPayload,
  UpdateUserPayload
} from "@/services/adminService";
import {
  Department,
  EmployeeState,
  Role,
  Schedule,
  User
} from "@/types/api";
import {
  Adapt,
  Paragraph,
  ScrollView,
  Select,
  Sheet,
  Text,
  YStack
} from "tamagui";

interface AccountFormState {
  first_name: string;
  last_name: string;
  email: string;
}

interface EmploymentFormState {
  employee_state_id: number | null;
  role_id: number | null;
  department_id: number | null;
  schedule_id: number | null;
}

interface PersonalFormState {
  national_id: string;
  address: string;
  phone: string;
}

type CatalogData = {
  states: EmployeeState[];
  roles: Role[];
  departments: Department[];
  schedules: Schedule[];
};

type PickerTarget = "birth" | "hire";

const DEFAULT_BIRTH_DATE = new Date(1990, 0, 1);

export default function AdminEditUserScreen(): JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ user_id?: string }>();
  const userId = Number(params.user_id);
  const hasValidUser = Number.isFinite(userId) && userId > 0;

  const [accountForm, setAccountForm] = useState<AccountFormState>({
    first_name: "",
    last_name: "",
    email: ""
  });
  const [employmentForm, setEmploymentForm] = useState<EmploymentFormState>({
    employee_state_id: null,
    role_id: null,
    department_id: null,
    schedule_id: null
  });
  const [personalForm, setPersonalForm] = useState<PersonalFormState>({
    national_id: "",
    address: "",
    phone: ""
  });
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
    queryKey: ["admin", "users", "detail", userId],
    queryFn: () => adminService.getUserById(userId),
    enabled: hasValidUser
  });

  const {
    data: catalogResponse,
    isLoading: isCatalogLoading,
    isError: isCatalogError,
    refetch: refetchCatalogs
  } = useQuery<CatalogData>({
    queryKey: ["admin", "users", "catalogs"],
    enabled: hasValidUser,
    queryFn: async () => {
      const [states, roles, departments, schedules] = await Promise.all([
        adminService.getEmployeeStates(),
        adminService.getRoles(),
        adminService.getDepartments(),
        adminService.getSchedules()
      ]);
      return {
        states: states.data ?? [],
        roles: roles.data ?? [],
        departments: departments.data ?? [],
        schedules: schedules.data ?? []
      };
    }
  });

  const user: User | undefined = userResponse?.data;
  const employeeDetail = user?.employeeDetail;
  const employeeDetailId = employeeDetail?.employee_detail_id;

  const states = catalogResponse?.states ?? [];
  const roles = catalogResponse?.roles ?? [];
  const departments = catalogResponse?.departments ?? [];
  const schedules = catalogResponse?.schedules ?? [];

  useEffect(() => {
    if (!user) return;
    setAccountForm({
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      email: user.email ?? ""
    });
    setEmploymentForm({
      employee_state_id: user.employee_state_id ?? user.employeeState?.employee_state_id ?? null,
      role_id: employeeDetail?.role_id ?? employeeDetail?.role?.role_id ?? null,
      department_id: employeeDetail?.department_id ?? employeeDetail?.department?.department_id ?? null,
      schedule_id: employeeDetail?.schedule_id ?? employeeDetail?.schedule?.schedule_id ?? null
    });
    setPersonalForm({
      national_id: employeeDetail?.national_id ?? "",
      address: employeeDetail?.address ?? "",
      phone: employeeDetail?.phone ?? ""
    });
    setBirthDate(employeeDetail?.birth_date ? new Date(employeeDetail.birth_date) : null);
    setHireDate(employeeDetail?.hire_date ? new Date(employeeDetail.hire_date) : null);
  }, [employeeDetail, user]);

  const selectedDepartment = useMemo(
    () => departments.find((dept) => dept.department_id === employmentForm.department_id) ?? null,
    [departments, employmentForm.department_id]
  );

  const branchInfo = useMemo(() => {
    if (!selectedDepartment?.branch) return "Sin sucursal";
    const { name, company } = selectedDepartment.branch;
    return `${name}${company ? ` · ${company.name}` : ""}`;
  }, [selectedDepartment]);

  const isEmailValid = useMemo(() => /^[\w-.]+@[\w-]+\.[\w-.]+$/.test(accountForm.email.trim()), [accountForm.email]);
  const accountValid =
    accountForm.first_name.trim().length > 1 &&
    accountForm.last_name.trim().length > 1 &&
    isEmailValid &&
    typeof employmentForm.employee_state_id === "number";

  const employmentValid =
    typeof employmentForm.employee_state_id === "number" &&
    typeof employmentForm.role_id === "number" &&
    typeof employmentForm.department_id === "number" &&
    typeof employmentForm.schedule_id === "number";

  const isNationalIdValid = useMemo(() => /^\d{10}$/.test(personalForm.national_id), [personalForm.national_id]);
  const isPhoneValid = useMemo(() => /^\d{10}$/.test(personalForm.phone), [personalForm.phone]);
  const isAddressValid = useMemo(() => personalForm.address.trim().length > 5, [personalForm.address]);

  const datesAreValid = useMemo(() => {
    if (!birthDate || !hireDate) return false;
    const today = new Date();
    const hireAfterBirth = hireDate >= birthDate;
    const hireNotFuture = hireDate <= today;
    const birthNotFuture = birthDate <= today;
    return hireAfterBirth && hireNotFuture && birthNotFuture;
  }, [birthDate, hireDate]);

  const personalValid = isNationalIdValid && isPhoneValid && isAddressValid && datesAreValid;

  const buildUserPayload = useCallback((): UpdateUserPayload | null => {
    if (typeof employmentForm.employee_state_id !== "number") return null;
    return {
      first_name: accountForm.first_name.trim(),
      last_name: accountForm.last_name.trim(),
      email: accountForm.email.trim().toLowerCase(),
      employee_state_id: employmentForm.employee_state_id
    };
  }, [accountForm.email, accountForm.first_name, accountForm.last_name, employmentForm.employee_state_id]);

  const buildDetailPayload = useCallback((): EmployeeDetailPayload | null => {
    if (
      typeof employmentForm.role_id !== "number" ||
      typeof employmentForm.department_id !== "number" ||
      typeof employmentForm.schedule_id !== "number" ||
      !birthDate ||
      !hireDate ||
      !hasValidUser
    ) {
      return null;
    }
    return {
      user_id: userId,
      role_id: employmentForm.role_id,
      department_id: employmentForm.department_id,
      schedule_id: employmentForm.schedule_id,
      national_id: personalForm.national_id,
      address: personalForm.address.trim(),
      phone: personalForm.phone,
      hire_date: format(hireDate, "yyyy-MM-dd"),
      birth_date: format(birthDate, "yyyy-MM-dd")
    };
  }, [birthDate, employmentForm.department_id, employmentForm.role_id, employmentForm.schedule_id, hasValidUser, hireDate, personalForm.address, personalForm.national_id, personalForm.phone, userId]);

  const showFeedback = useCallback((type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 2500);
  }, []);

  const accountMutation = useMutation({
    mutationFn: async () => {
      const payload = buildUserPayload();
      if (!payload) throw new Error("Datos incompletos");
      await adminService.updateUser(userId, payload);
    },
    onSuccess: () => {
      void refetchUser();
      showFeedback("success", "Cuenta actualizada");
    },
    onError: () => showFeedback("error", "No pudimos actualizar la cuenta")
  });

  const employmentMutation = useMutation({
    mutationFn: async () => {
      const userPayload = buildUserPayload();
      const detailPayload = buildDetailPayload();
      if (!userPayload || !detailPayload || !employeeDetailId) throw new Error("Datos incompletos");
      await Promise.all([
        adminService.updateUser(userId, userPayload),
        adminService.updateEmployeeDetail(employeeDetailId, detailPayload)
      ]);
    },
    onSuccess: () => {
      void refetchUser();
      showFeedback("success", "Estado laboral actualizado");
    },
    onError: () => showFeedback("error", "No pudimos actualizar el estado laboral")
  });

  const personalMutation = useMutation({
    mutationFn: async () => {
      const detailPayload = buildDetailPayload();
      if (!detailPayload || !employeeDetailId) throw new Error("Datos incompletos");
      await adminService.updateEmployeeDetail(employeeDetailId, detailPayload);
    },
    onSuccess: () => {
      void refetchUser();
      showFeedback("success", "Datos personales actualizados");
    },
    onError: () => showFeedback("error", "No pudimos actualizar los datos personales")
  });

  const handleSetAccount = useCallback(<K extends keyof AccountFormState>(key: K, value: AccountFormState[K]) => {
    setAccountForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSetEmployment = useCallback(
    <K extends keyof EmploymentFormState>(key: K, value: EmploymentFormState[K]) => {
      setEmploymentForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleSetPersonal = useCallback(<K extends keyof PersonalFormState>(key: K, value: PersonalFormState[K]) => {
    setPersonalForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleOpenPicker = useCallback(
    (target: PickerTarget) => {
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
    },
    [birthDate, hireDate]
  );

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

  if (!hasValidUser) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <YStack flex={1} alignItems="center" justifyContent="center" p="$4">
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

  const loading = isUserLoading || isCatalogLoading;
  const hasError = isUserError || isCatalogError;

  const summaryBadge = user?.employeeState?.name
    ? { label: user.employeeState.name, color: user.employeeState?.active ? "#059669" : "#9ca3af" }
    : null;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <YStack gap="$5">
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$7" color="$text">
              Editar colaborador
            </Text>
            <Paragraph color="$muted">
              Actualiza la cuenta, el estado laboral y los datos personales de forma independiente.
            </Paragraph>
          </YStack>

          <RoleSwitcher target="employee" />

          {loading ? (
            <ListSkeleton items={6} height={120} />
          ) : hasError ? (
            <AnimatedNotice
              variant="error"
              title="No pudimos cargar la información"
              message="Revisa tu conexión e intenta nuevamente."
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
              message="Verifica que el registro exista."
              actionLabel="Volver"
              onAction={() => router.replace("/(app)/(admin)/users")}
            />
          ) : !employeeDetailId ? (
            <AnimatedNotice
              variant="info"
              title="Faltan detalles"
              message="Crea los datos laborales antes de editar."
              actionLabel="Crear detalles"
              onAction={() => router.replace(`/(app)/(admin)/employee-details/create/${userId}`)}
            />
          ) : states.length === 0 || roles.length === 0 || departments.length === 0 || schedules.length === 0 ? (
            <AnimatedNotice
              variant="info"
              title="Catálogos incompletos"
              message="Asegúrate de registrar estados, roles, departamentos y horarios."
              actionLabel="Volver"
              onAction={() => router.replace("/(app)/(admin)/users")}
            />
          ) : (
            <YStack gap="$4">
              <InteractiveCard>
                <YStack gap="$2">
                  <Text fontWeight="600" fontSize="$5" color="$text">
                    {[accountForm.first_name, accountForm.last_name].filter(Boolean).join(" ") || `Usuario #${user.user_id}`}
                  </Text>
                  <Paragraph color="$muted">{accountForm.email}</Paragraph>
                  {summaryBadge ? <StatusBadge label={summaryBadge.label} color={summaryBadge.color} /> : null}
                </YStack>
              </InteractiveCard>

              <YStack gap="$3" backgroundColor="$brandBg" p="$4" borderRadius="$6">
                <Text fontFamily="$heading" fontSize="$5" color="$text">
                  Cuenta
                </Text>
                <Paragraph color="$muted" fontSize="$3">
                  Modifica la información básica del colaborador.
                </Paragraph>
                <AnimatedInput
                  label="Nombre"
                  placeholder="Nombre"
                  value={accountForm.first_name}
                  onChangeText={(value) => handleSetAccount("first_name", value)}
                />
                <AnimatedInput
                  label="Apellido"
                  placeholder="Apellido"
                  value={accountForm.last_name}
                  onChangeText={(value) => handleSetAccount("last_name", value)}
                />
                <AnimatedInput
                  label="Correo"
                  placeholder="correo@empresa.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={accountForm.email}
                  onChangeText={(value) => handleSetAccount("email", value)}
                  status={accountForm.email.length > 0 ? (isEmailValid ? "success" : "error") : undefined}
                />
                <AnimatedButton
                  disabled={!accountValid || accountMutation.isPending}
                  onPress={() => accountMutation.mutate()}
                >
                  {accountMutation.isPending ? "Guardando..." : "Guardar cuenta"}
                </AnimatedButton>
              </YStack>

              <YStack gap="$3" backgroundColor="$brandBg" p="$4" borderRadius="$6">
                <Text fontFamily="$heading" fontSize="$5" color="$text">
                  Estado laboral
                </Text>
                <Paragraph color="$muted" fontSize="$3">
                  Ajusta el estado, rol, departamento y horario del colaborador.
                </Paragraph>

                <YStack gap="$1">
                  <Text fontWeight="600" color="$text">
                    Estado del empleado
                  </Text>
                  <Select
                    value={employmentForm.employee_state_id ? String(employmentForm.employee_state_id) : undefined}
                    onValueChange={(value) => handleSetEmployment("employee_state_id", Number(value))}
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
                        {states.map((state) => (
                          <Select.Item key={state.employee_state_id} value={String(state.employee_state_id)}>
                            <Select.ItemText>{state.name}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                      <Select.ScrollDownButton />
                    </Select.Content>
                  </Select>
                </YStack>

                <YStack gap="$1">
                  <Text fontWeight="600" color="$text">
                    Rol
                  </Text>
                  <Select
                    value={employmentForm.role_id ? String(employmentForm.role_id) : undefined}
                    onValueChange={(value) => handleSetEmployment("role_id", Number(value))}
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
                        {roles.map((role) => (
                          <Select.Item key={role.role_id} value={String(role.role_id)}>
                            <Select.ItemText>{role.name}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                      <Select.ScrollDownButton />
                    </Select.Content>
                  </Select>
                </YStack>

                <YStack gap="$1">
                  <Text fontWeight="600" color="$text">
                    Departamento
                  </Text>
                  <Select
                    value={employmentForm.department_id ? String(employmentForm.department_id) : undefined}
                    onValueChange={(value) => handleSetEmployment("department_id", Number(value))}
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
                        {departments.map((department) => (
                          <Select.Item key={department.department_id} value={String(department.department_id)}>
                            <Select.ItemText>{department.name}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                      <Select.ScrollDownButton />
                    </Select.Content>
                  </Select>
                  <Paragraph color="$muted" fontSize="$2">
                    Sucursal vinculada: {branchInfo}
                  </Paragraph>
                </YStack>

                <YStack gap="$1">
                  <Text fontWeight="600" color="$text">
                    Horario
                  </Text>
                  <Select
                    value={employmentForm.schedule_id ? String(employmentForm.schedule_id) : undefined}
                    onValueChange={(value) => handleSetEmployment("schedule_id", Number(value))}
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
                        {schedules.map((schedule) => (
                          <Select.Item key={schedule.schedule_id} value={String(schedule.schedule_id)}>
                            <Select.ItemText>{schedule.name}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                      <Select.ScrollDownButton />
                    </Select.Content>
                  </Select>
                </YStack>

                <AnimatedButton
                  disabled={!employmentValid || employmentMutation.isPending}
                  onPress={() => employmentMutation.mutate()}
                >
                  {employmentMutation.isPending ? "Guardando..." : "Guardar estado"}
                </AnimatedButton>
              </YStack>

              <YStack gap="$3" backgroundColor="$brandBg" p="$4" borderRadius="$6">
                <Text fontFamily="$heading" fontSize="$5" color="$text">
                  Detalles personales
                </Text>
                <Paragraph color="$muted" fontSize="$3">
                  Información para RRHH y cálculos de nómina.
                </Paragraph>

                <AnimatedInput
                  label="Cédula"
                  placeholder="0000000000"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={personalForm.national_id}
                  onChangeText={(value) => handleSetPersonal("national_id", value.replace(/[^0-9]/g, ""))}
                  status={personalForm.national_id.length > 0 ? (isNationalIdValid ? "success" : "error") : undefined}
                />
                <AnimatedInput
                  label="Dirección"
                  placeholder="Av. Principal 123"
                  value={personalForm.address}
                  onChangeText={(value) => handleSetPersonal("address", value)}
                  status={personalForm.address.length > 0 ? (isAddressValid ? "success" : "error") : undefined}
                />
                <AnimatedInput
                  label="Teléfono"
                  placeholder="0999999999"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={personalForm.phone}
                  onChangeText={(value) => handleSetPersonal("phone", value.replace(/[^0-9]/g, ""))}
                  status={personalForm.phone.length > 0 ? (isPhoneValid ? "success" : "error") : undefined}
                />

                <YStack gap="$1">
                  <Text fontWeight="600" color="$text">
                    Fecha de nacimiento
                  </Text>
                  <AnimatedButton
                    backgroundColor="$color4"
                    color="$text"
                    onPress={() => handleOpenPicker("birth")}
                  >
                    {displayDate(birthDate)}
                  </AnimatedButton>
                </YStack>

                <YStack gap="$1">
                  <Text fontWeight="600" color="$text">
                    Fecha de ingreso
                  </Text>
                  <AnimatedButton
                    backgroundColor="$color4"
                    color="$text"
                    onPress={() => handleOpenPicker("hire")}
                  >
                    {displayDate(hireDate)}
                  </AnimatedButton>
                  <Paragraph color="$muted" fontSize="$2">
                    Debe ser igual o posterior a la fecha de nacimiento y no mayor a hoy.
                  </Paragraph>
                </YStack>

                <AnimatedButton
                  disabled={!personalValid || personalMutation.isPending}
                  onPress={() => personalMutation.mutate()}
                >
                  {personalMutation.isPending ? "Guardando..." : "Guardar detalles"}
                </AnimatedButton>
              </YStack>

              <AnimatedButton
                backgroundColor="$color4"
                color="$text"
                onPress={() => router.replace("/(app)/(admin)/users")}
              >
                Volver al listado
              </AnimatedButton>

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
        <Sheet modal open onOpenChange={(open) => setPickerState((prev) => (prev ? { ...prev, open } : prev))}>
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

