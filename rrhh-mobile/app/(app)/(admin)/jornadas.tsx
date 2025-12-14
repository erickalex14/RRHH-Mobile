import { useCallback, useMemo, useState } from "react";
import { Platform } from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent
} from "@react-native-community/datetimepicker";
import { Stack } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { InteractiveCard } from "@/components/ui/InteractiveCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RoleSwitcher } from "@/components/admin/RoleSwitcher";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { adminService } from "@/services/adminService";
import { Branch, Department, Role, User, WorkSession } from "@/types/api";
import {
  Adapt,
  Paragraph,
  ScrollView,
  Select,
  Separator,
  Sheet,
  Text,
  XStack,
  YStack
} from "tamagui";
import { addDays, format } from "date-fns";

const formatTime = (value?: string | null): string => {
  if (!value) return "--:--";
  if (value.length >= 5) {
    return value.slice(0, 5);
  }
  try {
    return format(new Date(value), "HH:mm");
  } catch (error) {
    return value;
  }
};

type StatusFilter = "all" | "open" | "closed";

type FilterState = {
  branchId: string;
  departmentId: string;
  roleId: string;
  employeeId: string;
  dateFrom: string;
  dateTo: string;
  status: StatusFilter;
};

const DEFAULT_FILTERS: FilterState = {
  branchId: "all",
  departmentId: "all",
  roleId: "all",
  employeeId: "all",
  dateFrom: format(addDays(new Date(), -7), "yyyy-MM-dd"),
  dateTo: format(new Date(), "yyyy-MM-dd"),
  status: "all"
};

export default function AdminJornadasScreen(): JSX.Element {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isFilterBarOpen, setIsFilterBarOpen] = useState(true);
  const [datePicker, setDatePicker] = useState<{ field: "dateFrom" | "dateTo" | null; visible: boolean }>({
    field: null,
    visible: false
  });

  const { data, isLoading, refetch, isRefetching, isError, error } = useQuery({
    queryKey: ["admin", "attendance", filters],
    queryFn: async () => {
      const [response, branches, departments, roles, employees] = await Promise.all([
        adminService.getAdminAttendanceByFilters({
          branch_id: filters.branchId !== "all" ? filters.branchId : undefined,
          department_id: filters.departmentId !== "all" ? filters.departmentId : undefined,
          role_id: filters.roleId !== "all" ? filters.roleId : undefined,
          employee_id: filters.employeeId !== "all" ? filters.employeeId : undefined,
          date_from: filters.dateFrom,
          date_to: filters.dateTo,
          status: filters.status === "all" ? undefined : filters.status
        }),
        adminService.getBranches(),
        adminService.getDepartments(),
        adminService.getRoles(),
        adminService.getUsers()
      ]);
      return {
        sessions: response.data ?? [],
        branches: branches.data ?? [],
        departments: departments.data ?? [],
        roles: roles.data ?? [],
        employees: employees.data ?? []
      };
    }
  });

  const sessions = data?.sessions ?? [];
  const branches = data?.branches ?? [];
  const departments = data?.departments ?? [];
  const roles = data?.roles ?? [];
  const employees = data?.employees ?? [];

  const filteredDepartments = useMemo(() => {
    if (filters.branchId === "all") return departments;
    return departments.filter((department) => String(department.branch_id) === filters.branchId);
  }, [departments, filters.branchId]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesBranch = filters.branchId === "all"
        ? true
        : String(employee.employeeDetail?.department?.branch_id ?? "") === filters.branchId;
      const matchesDepartment = filters.departmentId === "all"
        ? true
        : String(employee.employeeDetail?.department_id ?? "") === filters.departmentId;
      const matchesRole = filters.roleId === "all"
        ? true
        : String(employee.employeeDetail?.role_id ?? "") === filters.roleId;
      return matchesBranch && matchesDepartment && matchesRole;
    });
  }, [employees, filters.branchId, filters.departmentId, filters.roleId]);

  const branchOptions = useMemo(
    () => [{ label: "Todas", value: "all" }, ...branches.map((branch) => ({
      label: branch.name ?? "Sin nombre",
      value: String(branch.branch_id)
    }))],
    [branches]
  );

  const departmentOptions = useMemo(
    () => [{ label: "Todos", value: "all" }, ...filteredDepartments.map((department) => ({
      label: department.name ?? "Sin nombre",
      value: String(department.department_id)
    }))],
    [filteredDepartments]
  );

  const roleOptions = useMemo(
    () => [{ label: "Todos", value: "all" }, ...roles.map((role) => ({
      label: role.name ?? "Sin nombre",
      value: String(role.role_id)
    }))],
    [roles]
  );

  const employeeOptions = useMemo(
    () => [{ label: "Todos", value: "all" }, ...filteredEmployees.map((employee) => ({
      label: `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "Sin nombre",
      value: String(employee.user_id)
    }))],
    [filteredEmployees]
  );

  const statusOptions = useMemo(
    () => ([
      { label: "Todas", value: "all" as StatusFilter },
      { label: "Abiertas", value: "open" as StatusFilter },
      { label: "Cerradas", value: "closed" as StatusFilter }
    ]),
    []
  );

  const toDateValue = useCallback((value: string): Date => {
    const [year, month, day] = value.split("-").map(Number);
    if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
      return new Date(year, (month as number) - 1, day);
    }
    return new Date();
  }, []);

  const handleDateChange = useCallback((field: "dateFrom" | "dateTo", date: Date) => {
    setFilters((prev) => ({ ...prev, [field]: format(date, "yyyy-MM-dd") }));
    if (Platform.OS === "ios") {
      setDatePicker({ field: null, visible: false });
    }
  }, []);

  const openDatePicker = useCallback((field: "dateFrom" | "dateTo") => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        mode: "date",
        value: toDateValue(filters[field]),
        onChange: (_event: DateTimePickerEvent, selectedDate?: Date) => {
          if (selectedDate) {
            handleDateChange(field, selectedDate);
          }
        }
      });
      return;
    }
    setDatePicker({ field, visible: true });
  }, [filters, handleDateChange, toDateValue]);

  const closeIOSPicker = useCallback(() => {
    setDatePicker({ field: null, visible: false });
  }, []);

  const renderIOSPicker = (): JSX.Element | null => {
    if (Platform.OS !== "ios" || !datePicker.visible || !datePicker.field) {
      return null;
    }
    const activeField = datePicker.field;
    return (
      <YStack gap="$2" backgroundColor="$color2" p="$3" borderRadius="$5">
        <Text fontWeight="600" color="$text">
          Selecciona {activeField === "dateFrom" ? "fecha inicial" : "fecha final"}
        </Text>
        <DateTimePicker
          value={toDateValue(filters[activeField])}
          mode="date"
          display="spinner"
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            if (event.type === "dismissed") return;
            if (selectedDate) {
              handleDateChange(activeField, selectedDate);
            }
          }}
        />
        <AnimatedButton onPress={closeIOSPicker}>Cerrar</AnimatedButton>
      </YStack>
    );
  };

  const handleBranchChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      branchId: value,
      departmentId: "all",
      employeeId: "all"
    }));
  }, []);

  const handleDepartmentChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      departmentId: value,
      employeeId: "all"
    }));
  }, []);

  const handleRoleChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      roleId: value,
      employeeId: "all"
    }));
  }, []);

  const handleEmployeeChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      employeeId: value
    }));
  }, []);

  const handleStatusChange = useCallback((value: StatusFilter) => {
    setFilters((prev) => ({
      ...prev,
      status: value
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 56 }}>
        <YStack gap="$4">
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$7" color="$text">
              Jornadas
            </Text>
            <Paragraph color="$muted">
              Controla las sesiones registradas desde Web y móvil.
            </Paragraph>
          </YStack>

          <RoleSwitcher target="employee" />

          <AnimatedNotice
            variant="info"
            title="Modo solo lectura"
            message="Puedes revisar las jornadas, pero el cierre y edición estarán disponibles cuando el backend lo soporte."
          />

          <YStack gap="$3" backgroundColor="$brandBg" p="$4" borderRadius="$6">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontFamily="$heading" fontSize="$5" color="$text">
                Filtros avanzados
              </Text>
              <AnimatedButton
                backgroundColor="$color4"
                color="$text"
                onPress={() => setIsFilterBarOpen((prev) => !prev)}
              >
                {isFilterBarOpen ? "Ocultar" : "Mostrar"}
              </AnimatedButton>
            </XStack>
            {isFilterBarOpen ? (
              <YStack gap="$3">
                <YStack gap="$1">
                  <Text fontWeight="600" color="$text">
                    Sucursal
                  </Text>
                  <Select value={filters.branchId} onValueChange={handleBranchChange}>
                    <Select.Trigger borderColor="$borderColor">
                      <Select.Value placeholder="Todas" />
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
                        {branchOptions.map((option) => (
                          <Select.Item key={option.value} value={option.value}>
                            <Select.ItemText>{option.label}</Select.ItemText>
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
                  <Select value={filters.departmentId} onValueChange={handleDepartmentChange}>
                    <Select.Trigger borderColor="$borderColor">
                      <Select.Value placeholder="Todos" />
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
                        {departmentOptions.map((option) => (
                          <Select.Item key={option.value} value={option.value}>
                            <Select.ItemText>{option.label}</Select.ItemText>
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
                  <Select value={filters.roleId} onValueChange={handleRoleChange}>
                    <Select.Trigger borderColor="$borderColor">
                      <Select.Value placeholder="Todos" />
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
                        {roleOptions.map((option) => (
                          <Select.Item key={option.value} value={option.value}>
                            <Select.ItemText>{option.label}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                      <Select.ScrollDownButton />
                    </Select.Content>
                  </Select>
                </YStack>

                <YStack gap="$1">
                  <Text fontWeight="600" color="$text">
                    Empleado
                  </Text>
                  <Select value={filters.employeeId} onValueChange={handleEmployeeChange}>
                    <Select.Trigger borderColor="$borderColor">
                      <Select.Value placeholder="Todos" />
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
                        {employeeOptions.map((option) => (
                          <Select.Item key={option.value} value={option.value}>
                            <Select.ItemText>{option.label}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                      <Select.ScrollDownButton />
                    </Select.Content>
                  </Select>
                </YStack>

                <YStack gap="$1">
                  <Text fontWeight="600" color="$text">
                    Estado
                  </Text>
                  <Select value={filters.status} onValueChange={(value) => handleStatusChange(value as StatusFilter)}>
                    <Select.Trigger borderColor="$borderColor">
                      <Select.Value placeholder="Todos" />
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
                        {statusOptions.map((option) => (
                          <Select.Item key={option.value} value={option.value}>
                            <Select.ItemText>{option.label}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                      <Select.ScrollDownButton />
                    </Select.Content>
                  </Select>
                </YStack>

                <XStack gap="$3" flexWrap="wrap">
                  <YStack flex={1} minWidth={180} gap="$1">
                    <Text fontWeight="600" color="$text">
                      Desde
                    </Text>
                    <AnimatedButton
                      backgroundColor="$color3"
                      color="$text"
                      onPress={() => openDatePicker("dateFrom")}
                    >
                      {filters.dateFrom}
                    </AnimatedButton>
                  </YStack>
                  <YStack flex={1} minWidth={180} gap="$1">
                    <Text fontWeight="600" color="$text">
                      Hasta
                    </Text>
                    <AnimatedButton
                      backgroundColor="$color3"
                      color="$text"
                      onPress={() => openDatePicker("dateTo")}
                    >
                      {filters.dateTo}
                    </AnimatedButton>
                  </YStack>
                </XStack>

                {renderIOSPicker()}

                <XStack gap="$3">
                  <AnimatedButton flex={1} backgroundColor="$color4" color="$text" onPress={resetFilters}>
                    Restablecer
                  </AnimatedButton>
                  <AnimatedButton
                    flex={1}
                    disabled={isLoading || isRefetching}
                    onPress={() => refetch()}
                  >
                    {isRefetching ? "Aplicando..." : "Aplicar filtros"}
                  </AnimatedButton>
                </XStack>
              </YStack>
            ) : null}
          </YStack>

          <AnimatedButton
            backgroundColor="$color4"
            color="$text"
            disabled={isLoading || isRefetching}
            onPress={() => refetch()}
          >
            {isRefetching ? "Actualizando..." : "Refrescar lista"}
          </AnimatedButton>

          {isLoading || isRefetching ? (
            <ListSkeleton items={4} height={140} />
          ) : isError ? (
            <AnimatedNotice
              variant="error"
              title="Error al cargar"
              message={error instanceof Error ? error.message : "No pudimos obtener las jornadas."}
              actionLabel="Reintentar"
              onAction={() => void refetch()}
            />
          ) : sessions.length === 0 ? (
            <AnimatedNotice
              variant="info"
              message="No hay jornadas con el filtro seleccionado."
            />
          ) : (
            <Animated.FlatList<WorkSession>
              data={sessions}
              keyExtractor={(item) => String(item.session_id)}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <Separator backgroundColor="$color4" />}
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInDown.delay(index * 75)}>
                  <InteractiveCard>
                    <YStack gap="$2">
                      <XStack justifyContent="space-between" alignItems="center" gap="$2" flexWrap="wrap">
                        <Text fontWeight="600" fontSize="$4" color="$text">
                          {[
                            item.employee_detail?.first_name ??
                              item.employee_detail?.user?.first_name ??
                              item.user?.first_name ??
                              "Colaborador",
                            item.employee_detail?.last_name ??
                              item.employee_detail?.user?.last_name ??
                              item.user?.last_name ??
                              ""
                          ]
                            .join(" ")
                            .trim()}
                        </Text>
                        <StatusBadge
                          label={item.end_time ? "Cerrada" : "Abierta"}
                          color={item.end_time ? "#059669" : "#f97316"}
                        />
                      </XStack>
                      <Paragraph color="$muted">
                        Fecha: {item.work_date}
                      </Paragraph>
                      <Paragraph color="$muted">
                        Inicio: {formatTime(item.start_time)} · Fin: {item.end_time ? formatTime(item.end_time) : "Pendiente"}
                      </Paragraph>
                      <Paragraph color="$muted">
                        Sucursal: {item.employee_detail?.department?.branch?.name ?? "Sin sucursal"}
                      </Paragraph>
                      <Paragraph color="$muted">
                        Departamento: {item.employee_detail?.department?.name ?? "Sin departamento"}
                      </Paragraph>
                      <Paragraph color="$muted">
                        Rol: {item.employee_detail?.role?.name ?? "Sin rol"}
                      </Paragraph>
                      <XStack gap="$2" mt="$2">
                        <AnimatedButton flex={1} backgroundColor="$color4" color="$muted" disabled>
                          Cerrar jornada
                        </AnimatedButton>
                        <AnimatedButton flex={1} backgroundColor="$color4" color="$muted" disabled>
                          Editar registro
                        </AnimatedButton>
                      </XStack>
                      <Paragraph color="$muted" fontSize="$2">
                        Estas acciones estarán disponibles cuando tengamos soporte de backend.
                      </Paragraph>
                    </YStack>
                  </InteractiveCard>
                </Animated.View>
              )}
            />
          )}
        </YStack>
      </ScrollView>
    </Screen>
  );
}

