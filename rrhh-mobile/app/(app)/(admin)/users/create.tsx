import { useCallback, useMemo, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { Alert } from "react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { RoleSwitcher } from "@/components/admin/RoleSwitcher";
import { SimpleSelect } from "@/components/ui/SimpleSelect";
import { adminService } from "@/services/adminService";
import { EmployeeState, Role, Department, Schedule, Branch } from "@/types/api";
import { LinearGradient } from "expo-linear-gradient";
import {
  Paragraph,
  ScrollView,
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
  branch_id: number | null;
  role_id: number | null;
  department_id: number | null;
  schedule_id: number | null;
  national_id: string;
  address: string;
  phone: string;
  hire_date: string;
  birth_date: string;
}

const emptyForm: UserFormState = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  confirm: "",
  employee_state_id: null,
  branch_id: null,
  role_id: null,
  department_id: null,
  schedule_id: null,
  national_id: "",
  address: "",
  phone: "",
  hire_date: "",
  birth_date: ""
};

export default function AdminCreateUserScreen(): JSX.Element {
  const router = useRouter();
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { data: stateData, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "employee-states"],
    queryFn: adminService.getEmployeeStates
  });

  const { data: rolesData } = useQuery({ queryKey: ["admin", "roles"], queryFn: adminService.getRoles });
  const { data: branchesData } = useQuery({ queryKey: ["admin", "branches"], queryFn: adminService.getBranches });
  const { data: deptData } = useQuery({ queryKey: ["admin", "departments"], queryFn: adminService.getDepartments });
  const { data: schedulesData } = useQuery({ queryKey: ["admin", "schedules"], queryFn: adminService.getSchedules });

  const states: EmployeeState[] = stateData?.data ?? [];
  const roles: Role[] = rolesData?.data ?? [];
  const branches: Branch[] = branchesData?.data ?? [];
  const departments: Department[] = deptData?.data ?? [];
  const schedules: Schedule[] = schedulesData?.data ?? [];

  const stateOptions = useMemo(
    () => states.map((state) => ({ label: state.name, value: String(state.employee_state_id) })),
    [states]
  );

  const roleOptions = useMemo(
    () => roles.map((role) => ({ label: role.name, value: String(role.role_id) })),
    [roles]
  );

  const branchOptions = useMemo(
    () => branches.map((branch) => ({ label: branch.name, value: String(branch.branch_id) })),
    [branches]
  );

  const filteredDepartments = useMemo(() => {
    if (!form.branch_id) return departments;
    return departments.filter((dept) => dept.branch_id === form.branch_id);
  }, [departments, form.branch_id]);

  const departmentOptions = useMemo(
    () =>
      filteredDepartments.map((department) => ({
        label: `${department?.branch?.name ?? ""} ${department.name}`.trim(),
        value: String(department.department_id)
      })),
    [filteredDepartments]
  );

  const scheduleOptions = useMemo(
    () => schedules.map((schedule) => ({ label: schedule.name, value: String(schedule.schedule_id) })),
    [schedules]
  );

  const handleSetField = useCallback(<K extends keyof UserFormState>(key: K, value: UserFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isEmailValid = useMemo(() => /^[\w-.]+@[\w-]+\.[\w-.]+$/.test(form.email.trim()), [form.email]);
  const isPasswordValid = useMemo(() => form.password.trim().length >= 8, [form.password]);
  const isConfirmValid = useMemo(() => form.password === form.confirm, [form.confirm, form.password]);
  const isStateSelected = typeof form.employee_state_id === "number" && form.employee_state_id > 0;
  const isRoleSelected = typeof form.role_id === "number" && form.role_id > 0;
  const isBranchSelected = typeof form.branch_id === "number" && form.branch_id > 0;
  const isDepartmentSelected = typeof form.department_id === "number" && form.department_id > 0;
  const isScheduleSelected = typeof form.schedule_id === "number" && form.schedule_id > 0;
  const isNationalIdValid = useMemo(() => {
    const len = form.national_id.trim().length;
    return len >= 6 && len <= 10;
  }, [form.national_id]);

  const isPhoneValid = useMemo(() => {
    const len = form.phone.trim().length;
    return len >= 7 && len <= 10;
  }, [form.phone]);

  const hasAddress = useMemo(() => form.address.trim().length > 5, [form.address]);

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const hasHireDate = useMemo(() => dateRegex.test(form.hire_date.trim()), [form.hire_date]);
  const hasBirthDate = useMemo(() => dateRegex.test(form.birth_date.trim()), [form.birth_date]);
  const isBirthBeforeHire = useMemo(() => {
    if (!hasBirthDate || !hasHireDate) return false;
    return new Date(form.birth_date) < new Date(form.hire_date);
  }, [form.birth_date, form.hire_date, hasBirthDate, hasHireDate]);

  const formIsValid = useMemo(() => {
    return (
      form.first_name.trim().length > 1 &&
      form.last_name.trim().length > 1 &&
      isEmailValid &&
      isPasswordValid &&
      isConfirmValid &&
      isStateSelected &&
      isRoleSelected &&
      isBranchSelected &&
      isDepartmentSelected &&
      isScheduleSelected &&
      isNationalIdValid &&
      isPhoneValid &&
      hasAddress &&
      hasHireDate &&
      hasBirthDate &&
      isBirthBeforeHire
    );
  }, [
    form.first_name,
    form.last_name,
    isConfirmValid,
    isEmailValid,
    isPasswordValid,
    isStateSelected,
    isRoleSelected,
    isBranchSelected,
    isDepartmentSelected,
    isScheduleSelected,
    isNationalIdValid,
    isPhoneValid,
    hasAddress,
    hasHireDate,
    hasBirthDate,
    isBirthBeforeHire
  ]);

  const getValidationMessage = useCallback((): string => {
    const issues: string[] = [];
    if (form.first_name.trim().length <= 1) issues.push("Nombre requerido");
    if (form.last_name.trim().length <= 1) issues.push("Apellido requerido");
    if (!isEmailValid) issues.push("Correo inválido");
    if (!isPasswordValid) issues.push("Contraseña mínimo 8 caracteres");
    if (!isConfirmValid) issues.push("Confirmación no coincide");
    if (!isStateSelected) issues.push("Selecciona estado");
    if (!isRoleSelected) issues.push("Selecciona rol");
    if (!isBranchSelected) issues.push("Selecciona sucursal");
    if (!isDepartmentSelected) issues.push("Selecciona departamento");
    if (!isScheduleSelected) issues.push("Selecciona horario");
    if (!isNationalIdValid) issues.push("Cédula entre 6 y 10 caracteres");
    if (!hasAddress) issues.push("Dirección obligatoria");
    if (!isPhoneValid) issues.push("Teléfono entre 7 y 10 dígitos");
    if (!hasHireDate) issues.push("Fecha contratación YYYY-MM-DD");
    if (!hasBirthDate) issues.push("Fecha nacimiento YYYY-MM-DD");
    if (hasBirthDate && hasHireDate && !isBirthBeforeHire) issues.push("Nacimiento debe ser antes que contratación");
    return issues.join(" · ") || "Completa todos los campos con formato válido";
  }, [
    form.first_name,
    form.last_name,
    isEmailValid,
    isPasswordValid,
    isConfirmValid,
    isStateSelected,
    isRoleSelected,
    isDepartmentSelected,
    isScheduleSelected,
    isNationalIdValid,
    hasAddress,
    isPhoneValid,
    hasHireDate,
    hasBirthDate,
    isBirthBeforeHire
  ]);

  const createMutation = useMutation({
    mutationFn: adminService.createUser,
    onSuccess: (response) => {
      setFeedback({ type: "success", message: "Usuario creado" });
      setTimeout(() => setFeedback(null), 2200);
      // Flujo unificado: ya se envían datos completos, no redirigir a crear detalles aparte
      Alert.alert("Usuario creado", "Los datos se guardaron correctamente.");
      router.replace("/(app)/(admin)/users");
    },
    onError: () => {
      setFeedback({ type: "error", message: "No se pudo crear el usuario" });
      setTimeout(() => setFeedback(null), 2200);
    }
  });

  const handleSubmit = useCallback(() => {
    if (!formIsValid) {
      setFeedback({ type: "error", message: getValidationMessage() });
      setTimeout(() => setFeedback(null), 2200);
      return;
    }
    if (!form.employee_state_id || !form.role_id || !form.department_id || !form.schedule_id) return;
    createMutation.mutate({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password.trim(),
      employee_state_id: form.employee_state_id,
      branch_id: form.branch_id ?? undefined,
      role_id: form.role_id,
      department_id: form.department_id,
      schedule_id: form.schedule_id,
      national_id: form.national_id.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      hire_date: form.hire_date.trim(),
      birth_date: form.birth_date.trim()
    });
  }, [
    createMutation,
    getValidationMessage,
    form.address,
    form.birth_date,
    form.confirm,
    form.department_id,
    form.email,
    form.employee_state_id,
    form.branch_id,
    form.first_name,
    form.hire_date,
    form.last_name,
    form.national_id,
    form.password,
    form.phone,
    form.role_id,
    form.schedule_id,
    formIsValid
  ]);

  return (
    <Screen>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={{ position: 'absolute', width: '100%', height: '100%', zIndex: -1 }}
      />
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 64 }}>
        <YStack gap="$5" p="$4">
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$7" color="white">
              Crear usuario
            </Text>
            <Paragraph color="$gray10">
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
            <GlassCard gap="$3" borderRadius="$6" p="$5">
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

              <YStack gap="$2">
                <Text fontWeight="600" color="white" ml="$1">
                  Estado del colaborador
                </Text>
                <SimpleSelect
                  options={stateOptions}
                  value={form.employee_state_id ? String(form.employee_state_id) : ""}
                  onValueChange={(value) => handleSetField("employee_state_id", Number(value))}
                  placeholder="Selecciona estado"
                />
              </YStack>

              <YStack gap="$2">
                <Text fontWeight="600" color="white" ml="$1">
                  Rol
                </Text>
                <SimpleSelect
                  options={roleOptions}
                  value={form.role_id ? String(form.role_id) : ""}
                  onValueChange={(value) => handleSetField("role_id", Number(value))}
                  placeholder="Selecciona rol"
                />
              </YStack>

              <YStack gap="$2">
                <Text fontWeight="600" color="white" ml="$1">
                  Sucursal
                </Text>
                <SimpleSelect
                  options={branchOptions}
                  value={form.branch_id ? String(form.branch_id) : ""}
                  onValueChange={(value) => handleSetField("branch_id", Number(value))}
                  placeholder="Selecciona sucursal"
                />
              </YStack>

              <YStack gap="$2">
                <Text fontWeight="600" color="white" ml="$1">
                  Departamento
                </Text>
                <SimpleSelect
                  options={departmentOptions}
                  value={form.department_id ? String(form.department_id) : ""}
                  onValueChange={(value) => handleSetField("department_id", Number(value))}
                  placeholder="Selecciona departamento"
                />
              </YStack>

              <YStack gap="$2">
                <Text fontWeight="600" color="white" ml="$1">
                  Horario
                </Text>
                <SimpleSelect
                  options={scheduleOptions}
                  value={form.schedule_id ? String(form.schedule_id) : ""}
                  onValueChange={(value) => handleSetField("schedule_id", Number(value))}
                  placeholder="Selecciona horario"
                />
              </YStack>

              <AnimatedInput
                label="Cédula / ID"
                placeholder="Documento"
                keyboardType="default"
                value={form.national_id}
                onChangeText={(value) => handleSetField("national_id", value)}
                status={form.national_id.length > 0 ? (isNationalIdValid ? "success" : "error") : undefined}
              />

              <AnimatedInput
                label="Dirección"
                placeholder="Dirección residencial"
                value={form.address}
                onChangeText={(value) => handleSetField("address", value)}
                status={form.address.length > 0 ? (hasAddress ? "success" : "error") : undefined}
              />

              <AnimatedInput
                label="Teléfono"
                placeholder="09xxxxxxxx"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(value) => handleSetField("phone", value)}
                status={form.phone.length > 0 ? (isPhoneValid ? "success" : "error") : undefined}
              />

              <AnimatedInput
                label="Fecha de contratación"
                placeholder="YYYY-MM-DD"
                value={form.hire_date}
                onChangeText={(value) => handleSetField("hire_date", value)}
                status={form.hire_date.length > 0 ? (hasHireDate ? "success" : "error") : undefined}
              />

              <AnimatedInput
                label="Fecha de nacimiento"
                placeholder="YYYY-MM-DD"
                value={form.birth_date}
                onChangeText={(value) => handleSetField("birth_date", value)}
                status={form.birth_date.length > 0 ? (hasBirthDate ? "success" : "error") : undefined}
              />

              <Paragraph color="$gray10" fontSize="$2" mt="$2">
                Asegúrate de que la contraseña tenga mínimo 8 caracteres y selecciona el estado correcto.
              </Paragraph>

              <XStack gap="$3" mt="$4">
                <AnimatedButton 
                    flex={1} 
                    backgroundColor="rgba(239, 68, 68, 0.2)"
                    borderColor="$red8"
                    borderWidth={1}
                    onPress={() => router.back()}
                >
                  <Text color="$red9" fontWeight="600">Cancelar</Text>
                </AnimatedButton>
                <AnimatedButton 
                  flex={1} 
                  disabled={createMutation.isPending} 
                  backgroundColor="$blue10"
                  onPress={handleSubmit}
                >
                  {createMutation.isPending ? "Creando..." : "Crear usuario"}
                </AnimatedButton>
              </XStack>
            </GlassCard>
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

