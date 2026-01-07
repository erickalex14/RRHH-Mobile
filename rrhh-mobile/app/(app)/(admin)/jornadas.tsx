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
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { adminService } from "@/services/adminService";
import { Branch, Department, Role, User, WorkSession } from "@/types/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { LinearGradient } from "expo-linear-gradient";
import { HybridSelect } from "@/components/ui/HybridSelect";
import { Filter, Calendar, Clock, User as UserIcon, Building2, Layers, Briefcase, RefreshCw, XCircle } from "@tamagui/lucide-icons";
import {
  Adapt,
  Paragraph,
  ScrollView,
  Select,
  Separator,
  Sheet,
  Text,
  XStack,
  YStack,
  H2,
  Button
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <YStack gap="$4" pt="$safe" px="$0">
          
          {/* Header */}
          <YStack gap="$1" mb="$2">
                <H2 fontWeight="800" fontSize={26} color="$color">Jornadas</H2>
                <Paragraph color="$color" opacity={0.6}>
                     Controla las sesiones registradas desde Web y móvil.
                </Paragraph>
          </YStack>

          <AdminNavbar />

          <AnimatedNotice
            variant="info"
            title="Modo solo lectura"
            message="Puedes revisar las jornadas, pero el cierre y edición estarán disponibles cuando el backend lo soporte."
          />

          {/* Filter Block */}
          <GlassCard gap="$3" p="$4" borderRadius="$6">
            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap="$2" alignItems="center">
                  <Filter size={20} color="$color" />
                  <Text fontFamily="$heading" fontSize="$5" color="$color">
                    Filtros avanzados
                  </Text>
              </XStack>
              <Button
                size="$3"
                chromeless
                color="$blue10"
                onPress={() => setIsFilterBarOpen((prev) => !prev)}
              >
                {isFilterBarOpen ? "Ocultar" : "Mostrar"}
              </Button>
            </XStack>
            {isFilterBarOpen ? (
              <YStack gap="$3">
                <YStack gap="$1">
                  <Text fontWeight="600" color="$color">
                    Sucursal
                  </Text>
                  <HybridSelect
                    options={branchOptions}
                    value={filters.branchId}
                    onValueChange={handleBranchChange}
                    placeholder="Todas"
                  />
                </YStack>

                <YStack gap="$1">
                  <Text fontWeight="600" color="$color">
                    Departamento
                  </Text>
                  <HybridSelect
                    options={departmentOptions}
                    value={filters.departmentId}
                    onValueChange={handleDepartmentChange}
                    placeholder="Todos"
                  />
                </YStack>

                <YStack gap="$1">
                  <Text fontWeight="600" color="$color">
                    Rol
                  </Text>
                  <HybridSelect
                    options={roleOptions}
                    value={filters.roleId}
                    onValueChange={handleRoleChange}
                    placeholder="Todos"
                  />
                </YStack>

                <YStack gap="$1">
                  <Text fontWeight="600" color="$color">
                    Empleado
                  </Text>
                  <HybridSelect
                    options={employeeOptions}
                    value={filters.employeeId}
                    onValueChange={handleEmployeeChange}
                    placeholder="Todos"
                  />
                </YStack>

                <YStack gap="$1">
                  <Text fontWeight="600" color="$color">
                    Estado
                  </Text>
                  <HybridSelect
                    options={statusOptions}
                    value={filters.status}
                    onValueChange={(value) => handleStatusChange(value as StatusFilter)}
                    placeholder="Todos"
                  />
                </YStack>

                <XStack gap="$3" flexWrap="wrap">
                  <YStack flex={1} minWidth={150} gap="$1">
                    <Text fontWeight="600" color="$color">
                      Desde
                    </Text>
                    <Button
                      variant="outlined"
                      borderColor="$borderColor"
                      color="$color"
                      icon={Calendar}
                      onPress={() => openDatePicker("dateFrom")}
                    >
                      {filters.dateFrom}
                    </Button>
                  </YStack>
                  <YStack flex={1} minWidth={150} gap="$1">
                    <Text fontWeight="600" color="$color">
                      Hasta
                    </Text>
                    <Button
                     variant="outlined"
                     borderColor="$borderColor"
                     color="$color"
                     icon={Calendar}
                      onPress={() => openDatePicker("dateTo")}
                    >
                      {filters.dateTo}
                    </Button>
                  </YStack>
                </XStack>

                {renderIOSPicker()}

                <XStack gap="$3" mt="$2">
                  <Button flex={1} chromeless color="$color" onPress={resetFilters} icon={XCircle}>
                    Restablecer
                  </Button>
                  <Button
                    flex={1}
                    backgroundColor="$blue10"
                    color="white"
                    disabled={isLoading || isRefetching}
                    onPress={() => refetch()}
                    icon={RefreshCw}
                  >
                    {isRefetching ? "Aplicando..." : "Aplicar filtros"}
                  </Button>
                </XStack>
              </YStack>
            ) : null}
          </GlassCard>

          <Button
            size="$4"
            chromeless
            borderWidth={1}
            borderColor="$borderColor"
            disabled={isLoading || isRefetching}
            onPress={() => refetch()}
            icon={RefreshCw}
          >
            {isRefetching ? "Actualizando..." : "Refrescar lista"}
          </Button>

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
             <YStack gap="$3">
              {sessions.map((item, index) => (
                    <Animated.View key={item.session_id} entering={FadeInDown.delay(index * 75).springify()}>
                        <GlassCard p="$4" gap="$2">
                             <XStack justifyContent="space-between" alignItems="center">
                                <XStack gap="$3" alignItems="center" flex={1}>
                                    <GlassCard p="$2" borderRadius="$4" backgroundColor="$backgroundPress">
                                        <Clock size={24} color="$blue10" />
                                    </GlassCard>
                                    <YStack flex={1}>
                                        <Text fontWeight="700" fontSize="$4" numberOfLines={1} color="$color">
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
                                        <Text color="$color" opacity={0.6} fontSize="$3">
                                            {item.work_date}
                                        </Text>
                                    </YStack>
                                </XStack>
                                 <StatusBadge
                                  label={item.end_time ? "Cerrada" : "Abierta"}
                                  color={item.end_time ? "$green10" : "$orange10"}
                                />
                            </XStack>
                            
                            <Separator borderColor="$borderColor" opacity={0.5} my="$2" />

                            <XStack gap="$4" px="$1">
                                <YStack flex={1}>
                                     <Text fontSize="$2" opacity={0.6} color="$color">INICIO</Text>
                                     <Text fontSize="$5" fontWeight="700" color="$color">{formatTime(item.start_time)}</Text>
                                </YStack>
                                <Separator vertical borderColor="$borderColor" opacity={0.5} />
                                <YStack flex={1}>
                                     <Text fontSize="$2" opacity={0.6} color="$color">FIN</Text>
                                     <Text fontSize="$5" fontWeight="700" color={item.end_time ? "$color" : "$orange10"}>
                                         {item.end_time ? formatTime(item.end_time) : "En curso"}
                                     </Text>
                                </YStack>
                            </XStack>

                            <Separator borderColor="$borderColor" opacity={0.5} my="$2" />

                             <YStack gap="$1" px="$1">
                                 <XStack gap="$2" alignItems="center">
                                    <Building2 size={12} color="$color" opacity={0.6} />
                                    <Text fontSize="$3" color="$color" opacity={0.8}>
                                        {item.employee_detail?.department?.branch?.name ?? "Sin sucursal"}
                                    </Text>
                                 </XStack>
                                 <XStack gap="$2" alignItems="center">
                                    <Layers size={12} color="$color" opacity={0.6} />
                                    <Text fontSize="$3" color="$color" opacity={0.8}>
                                        {item.employee_detail?.department?.name ?? "Sin departamento"}
                                    </Text>
                                 </XStack>
                                  <XStack gap="$2" alignItems="center">
                                    <Briefcase size={12} color="$color" opacity={0.6} />
                                    <Text fontSize="$3" color="$color" opacity={0.8}>
                                        {item.employee_detail?.role?.name ?? "Sin rol"}
                                    </Text>
                                 </XStack>
                            </YStack>

                            <XStack gap="$2" mt="$2">
                                <Button flex={1} size="$3" disabled backgroundColor="$backgroundPress" color="$color" opacity={0.5}>
                                    Cerrar jornada
                                </Button>
                                <Button flex={1} size="$3" disabled backgroundColor="$backgroundPress" color="$color" opacity={0.5}>
                                    Editar
                                </Button>
                            </XStack>
                             <Paragraph color="$color" opacity={0.4} fontSize="$2" textAlign="center">
                                Gestión no disponible en esta versión.
                            </Paragraph>
                        </GlassCard>
                    </Animated.View>
                  ))}
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </Screen>
  );
}

