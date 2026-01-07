import { useCallback, useMemo, useState } from "react";
import { Linking, Platform } from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent
} from "@react-native-community/datetimepicker";
import { Stack } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format, parseISO } from "date-fns";
import { Screen } from "@/components/ui/Screen";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { InteractiveCard } from "@/components/ui/InteractiveCard";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { HybridSelect } from "@/components/ui/HybridSelect";
import { adminService } from "@/services/adminService";
import { useConfirm } from "@/hooks/useConfirm";
import { Branch, Department, EarlyDepartureRequest, Role, User } from "@/types/api";
import { LinearGradient } from "expo-linear-gradient";
import { GlassCard } from "@/components/ui/GlassCard";
import { Filter, Calendar, Zap, AlertCircle, RefreshCw } from "@tamagui/lucide-icons";
import {
  AnimatePresence,
  Paragraph,
  ScrollView,
  Separator,
  Sheet,
  Text,
  XStack,
  YStack,
  H2,
  Button
} from "tamagui";

type StatusFilter = "all" | "pending" | "approved" | "rejected";
type DateField = "dateFrom" | "dateTo";

type FilterState = {
  branchId: string;
  departmentId: string;
  roleId: string;
  employeeId: string;
  status: StatusFilter;
  dateFrom: string;
  dateTo: string;
};

type MetaDataResponse = {
  branches: Branch[];
  departments: Department[];
  roles: Role[];
  employees: User[];
};

const STATUS_LABELS: Record<EarlyDepartureRequest["status"], string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada"
};

const STATUS_COLORS: Record<EarlyDepartureRequest["status"], string> = {
  pending: "#f59e0b",
  approved: "#22c55e",
  rejected: "#ef4444"
};

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: "Todas", value: "all" },
  { label: "Pendientes", value: "pending" },
  { label: "Aprobadas", value: "approved" },
  { label: "Rechazadas", value: "rejected" }
];

const DEFAULT_FILTERS: FilterState = {
  branchId: "all",
  departmentId: "all",
  roleId: "all",
  employeeId: "all",
  status: "all",
  dateFrom: "",
  dateTo: ""
};

const safeParseISO = (value?: string | null): Date | null => {
  if (!value) return null;
  try {
    return parseISO(value);
  } catch (error) {
    return null;
  }
};

const safeParseDateTimeParts = (dateValue?: string | null, timeValue?: string | null): Date | null => {
  if (!dateValue) return null;
  const isoString = `${dateValue}${timeValue ? `T${timeValue}` : "T00:00"}`;
  return safeParseISO(isoString);
};

const formatDateTimeValue = (value?: string | null, pattern = "dd/MM/yyyy HH:mm"): string => {
  const parsed = safeParseISO(value);
  return parsed ? format(parsed, pattern) : "Sin registro";
};

const formatRequestDateTime = (request: EarlyDepartureRequest): string => {
  const parsed = safeParseDateTimeParts(request.request_date, request.request_time);
  return parsed ? format(parsed, "dd/MM/yyyy HH:mm") : "Sin registro";
};

const formatDateFilterLabel = (value: string, placeholder: string): string => {
  if (!value) return placeholder;
  const parsed = safeParseISO(value);
  return parsed ? format(parsed, "dd/MM/yyyy") : placeholder;
};

const getEmployeeName = (request: EarlyDepartureRequest, contextUser?: User | null): string => {
  const detailFirst = request.employee_detail?.first_name ?? request.employee_detail?.user?.first_name ?? "";
  const detailLast = request.employee_detail?.last_name ?? request.employee_detail?.user?.last_name ?? "";
  const detailName = `${detailFirst} ${detailLast}`.trim();
  if (detailName) return detailName;
  const user = contextUser ?? request.user ?? null;
  if (user) {
    const name = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
    if (name) return name;
  }
  return "Colaborador";
};

export default function AdminSolicitudesScreen(): JSX.Element {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isFilterBarOpen, setIsFilterBarOpen] = useState(true);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EarlyDepartureRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [datePicker, setDatePicker] = useState<{ field: DateField | null; visible: boolean }>({
    field: null,
    visible: false
  });

  const handleFeedback = useCallback((payload: { type: "success" | "error"; message: string }) => {
    setFeedback(payload);
    setTimeout(() => setFeedback(null), 2600);
  }, []);

  const confirm = useConfirm();

  const invalidateRequests = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin", "requests", "list"] });
  }, [queryClient]);

  const { data: metaData, isLoading: isMetaLoading, isError: isMetaError } = useQuery<MetaDataResponse>({
    queryKey: ["admin", "requests", "meta"],
    queryFn: async () => {
      const [branchesRes, departmentsRes, rolesRes, usersRes] = await Promise.all([
        adminService.getBranches(),
        adminService.getDepartments(),
        adminService.getRoles(),
        adminService.getUsers()
      ]);
      return {
        branches: branchesRes.data ?? [],
        departments: departmentsRes.data ?? [],
        roles: rolesRes.data ?? [],
        employees: usersRes.data ?? []
      };
    }
  });

  const {
    data: requestData,
    isLoading: isLoadingRequests,
    isRefetching,
    isError: isRequestError,
    refetch: refetchRequests
  } = useQuery({
    queryKey: ["admin", "requests", "list"],
    queryFn: adminService.getEarlyRequests
  });

  const branches = metaData?.branches ?? [];
  const departments = metaData?.departments ?? [];
  const roles = metaData?.roles ?? [];
  const employees = metaData?.employees ?? [];
  const requests = requestData?.data ?? [];

  const employeeMap = useMemo(() => {
    const map = new Map<number, User>();
    employees.forEach((employee) => map.set(employee.user_id, employee));
    return map;
  }, [employees]);

  const resolveContext = useCallback(
    (request: EarlyDepartureRequest) => {
      const fallbackUser = employeeMap.get(request.user_id) ?? null;
      const user = request.user ?? fallbackUser;
      const detail = request.employee_detail ?? user?.employeeDetail ?? null;
      const department = detail?.department ?? null;
      const branch = department?.branch ?? null;
      const role = detail?.role ?? null;
      return { user, detail, department, branch, role };
    },
    [employeeMap]
  );

  const filteredDepartments = useMemo(() => {
    if (filters.branchId === "all") return departments;
    return departments.filter((department) => String(department.branch_id) === filters.branchId);
  }, [departments, filters.branchId]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const detail = employee.employeeDetail;
      const matchesBranch = filters.branchId === "all" ? true : String(detail?.department?.branch_id ?? "") === filters.branchId;
      const matchesDepartment = filters.departmentId === "all" ? true : String(detail?.department_id ?? "") === filters.departmentId;
      const matchesRole = filters.roleId === "all" ? true : String(detail?.role_id ?? detail?.role?.role_id ?? "") === filters.roleId;
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

  const filterSummary = useMemo(() => {
    const descriptors: string[] = [];
    if (filters.branchId !== "all") {
      const branchLabel = branchOptions.find((option) => option.value === filters.branchId)?.label;
      descriptors.push(`Sucursal: ${branchLabel ?? filters.branchId}`);
    }
    if (filters.departmentId !== "all") {
      const departmentLabel = departmentOptions.find((option) => option.value === filters.departmentId)?.label;
      descriptors.push(`Departamento: ${departmentLabel ?? filters.departmentId}`);
    }
    if (filters.roleId !== "all") {
      const roleLabel = roleOptions.find((option) => option.value === filters.roleId)?.label;
      descriptors.push(`Rol: ${roleLabel ?? filters.roleId}`);
    }
    if (filters.employeeId !== "all") {
      const employeeLabel = employeeOptions.find((option) => option.value === filters.employeeId)?.label;
      descriptors.push(`Empleado: ${employeeLabel ?? filters.employeeId}`);
    }
    if (filters.status !== "all") {
      const statusLabel = STATUS_OPTIONS.find((option) => option.value === filters.status)?.label;
      descriptors.push(`Estado: ${statusLabel ?? filters.status}`);
    }
    if (filters.dateFrom || filters.dateTo) {
      descriptors.push(`Rango: ${filters.dateFrom || "--"} → ${filters.dateTo || "--"}`);
    }
    return descriptors.length ? `Filtros activos: ${descriptors.join(" · ")}` : "Sin filtros activos";
  }, [branchOptions, departmentOptions, employeeOptions, filters, roleOptions]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const { branch, department, role } = resolveContext(request);
      const branchId = branch?.branch_id ? String(branch.branch_id) : null;
      const departmentId = department?.department_id ? String(department.department_id) : null;
      const roleId = (role?.role_id ?? request.employee_detail?.role_id) ? String(role?.role_id ?? request.employee_detail?.role_id) : null;
      const matchesBranch = filters.branchId === "all" || branchId === filters.branchId;
      if (!matchesBranch) return false;
      const matchesDepartment = filters.departmentId === "all" || departmentId === filters.departmentId;
      if (!matchesDepartment) return false;
      const matchesRole = filters.roleId === "all" || roleId === filters.roleId;
      if (!matchesRole) return false;
      const matchesEmployee = filters.employeeId === "all" || String(request.user_id) === filters.employeeId;
      if (!matchesEmployee) return false;
      const matchesStatus = filters.status === "all" || request.status === filters.status;
      if (!matchesStatus) return false;
      const requestDate = safeParseISO(request.request_date);
      const fromDate = safeParseISO(filters.dateFrom);
      const toDate = safeParseISO(filters.dateTo);
      if (fromDate && (!requestDate || requestDate < fromDate)) return false;
      if (toDate && (!requestDate || requestDate > toDate)) return false;
      return true;
    });
  }, [filters, requests, resolveContext]);

  const requestsInsights = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((request) => request.status === "pending").length;
    const filteredCount = filteredRequests.length;
    const now = new Date();
    const urgent = filteredRequests.filter((request) => {
      if (request.status !== "pending") {
        return false;
      }
      const parsed = safeParseDateTimeParts(request.request_date, request.request_time);
      if (!parsed) {
        return false;
      }
      return parsed >= now && parsed <= addDays(now, 1);
    }).length;
    return { total, pending, filteredCount, urgent };
  }, [filteredRequests, requests]);

  const handleBranchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, branchId: value, departmentId: "all", employeeId: "all" }));
  }, []);

  const handleDepartmentChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, departmentId: value, employeeId: "all" }));
  }, []);

  const handleRoleChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, roleId: value, employeeId: "all" }));
  }, []);

  const handleEmployeeChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, employeeId: value }));
  }, []);

  const handleStatusChange = useCallback((value: StatusFilter) => {
    setFilters((prev) => ({ ...prev, status: value }));
  }, []);

  const handleDateChange = useCallback((field: DateField, date: Date) => {
    setFilters((prev) => ({ ...prev, [field]: format(date, "yyyy-MM-dd") }));
    if (Platform.OS === "ios") {
      setDatePicker({ field: null, visible: false });
    }
  }, []);

  const openDatePicker = useCallback((field: DateField) => {
    const baseValue = safeParseISO(filters[field]) ?? new Date();
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        mode: "date",
        value: baseValue,
        onChange: (_event: DateTimePickerEvent, selectedDate?: Date) => {
          if (selectedDate) {
            handleDateChange(field, selectedDate);
          }
        }
      });
      return;
    }
    setDatePicker({ field, visible: true });
  }, [filters, handleDateChange]);

  const closeIOSPicker = useCallback(() => {
    setDatePicker({ field: null, visible: false });
  }, []);

  const renderIOSPicker = (): JSX.Element | null => {
    if (Platform.OS !== "ios" || !datePicker.visible || !datePicker.field) return null;
    const activeField = datePicker.field;
    return (
      <YStack gap="$2" backgroundColor="$color2" p="$3" borderRadius="$5">
        <Text fontWeight="600" color="$text">
          Selecciona {activeField === "dateFrom" ? "fecha inicial" : "fecha final"}
        </Text>
        <DateTimePicker
          value={safeParseISO(filters[activeField]) ?? new Date()}
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

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const openDetails = useCallback((request: EarlyDepartureRequest) => {
    setSelectedRequest(request);
    setRejectReason("");
    setDetailSheetOpen(true);
  }, []);

  const closeDetails = useCallback(() => {
    setDetailSheetOpen(false);
    setSelectedRequest(null);
    setRejectReason("");
  }, []);

  const approveMutation = useMutation({
    mutationFn: adminService.approveEarlyRequest,
    onSuccess: () => {
      handleFeedback({ type: "success", message: "Solicitud aprobada" });
      invalidateRequests();
      closeDetails();
    },
    onError: () => handleFeedback({ type: "error", message: "Error al aprobar la solicitud" })
  });

  const rejectMutation = useMutation({
    mutationFn: adminService.rejectEarlyRequest,
    onSuccess: () => {
      handleFeedback({ type: "success", message: "Solicitud rechazada" });
      invalidateRequests();
      closeDetails();
    },
    onError: () => handleFeedback({ type: "error", message: "Error al rechazar la solicitud" })
  });

  const confirmApprove = useCallback(async () => {
    if (!selectedRequest) return;
    const { user } = resolveContext(selectedRequest);
    const employeeName = getEmployeeName(selectedRequest, user);
    const accepted = await confirm({
      title: "Aprobar solicitud",
      message: `Confirmas la salida anticipada de ${employeeName}?`,
      confirmLabel: "Aprobar"
    });
    if (!accepted) {
      return;
    }
    approveMutation.mutate(selectedRequest.request_id);
  }, [approveMutation, confirm, resolveContext, selectedRequest]);

  const handleRejectAction = useCallback(async () => {
    if (!selectedRequest) return;
    const trimmed = rejectReason.trim();
    if (!trimmed) {
      handleFeedback({ type: "error", message: "Debes ingresar el motivo del rechazo" });
      return;
    }
    const { user } = resolveContext(selectedRequest);
    const employeeName = getEmployeeName(selectedRequest, user);
    const accepted = await confirm({
      title: "Rechazar solicitud",
      message: `Vas a rechazar la salida anticipada de ${employeeName}.`,
      confirmLabel: "Rechazar",
      destructive: true
    });
    if (!accepted) {
      return;
    }
    rejectMutation.mutate({
      id: selectedRequest.request_id,
      reason: trimmed
    });
  }, [confirm, handleFeedback, rejectMutation, rejectReason, resolveContext, selectedRequest]);

  const isMutating = approveMutation.isPending || rejectMutation.isPending;

  const renderSelect = (
    value: string,
    options: { label: string; value: string }[],
    placeholder: string,
    onValueChange: (value: string) => void,
    disabled?: boolean
  ): JSX.Element => (
    <HybridSelect
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  );

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <YStack gap="$4" pt="$safe" px="$0">
          
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center" mb="$2">
             <YStack>
                <H2 fontWeight="800" fontSize={26} color="$color">Solicitudes</H2>
                <Paragraph color="$color" opacity={0.6}>Gestión de salidas anticipadas</Paragraph>
             </YStack>
             <Button 
                size="$3" 
                circular 
                icon={RefreshCw} 
                chromeless 
                onPress={() => queryClient.invalidateQueries({ queryKey: ["admin", "requests", "listing"] })} 
             />
          </XStack>

          {/* Stats Cards */}
           <XStack gap="$3" flexWrap="wrap">
              <GlassCard flex={1} minWidth={100} p="$3" borderRadius="$4">
                <Text fontSize="$2" color="$color" opacity={0.6} mb="$1">TOTAL</Text>
                <Text fontWeight="800" fontSize="$6" color="$blue10">
                  {requestsInsights.total}
                </Text>
              </GlassCard>
              <GlassCard flex={1} minWidth={100} p="$3" borderRadius="$4">
                <Text fontSize="$2" color="$color" opacity={0.6} mb="$1">PENDIENTES</Text>
                <Text fontWeight="800" fontSize="$6" color="$orange10">
                  {requestsInsights.pending}
                </Text>
              </GlassCard>
              <GlassCard flex={1} minWidth={100} p="$3" borderRadius="$4">
                <Text fontSize="$2" color="$color" opacity={0.6} mb="$1">24H</Text>
                <Text fontWeight="800" fontSize="$6" color="$red10">
                  {requestsInsights.urgent}
                </Text>
              </GlassCard>
            </XStack>

          {/* Filters Block */}
          <GlassCard gap="$3" p="$4" borderRadius="$6">
            <XStack justifyContent="space-between" alignItems="center" onPress={() => setIsFilterBarOpen((prev) => !prev)}>
              <XStack gap="$2" alignItems="center">
                 <Filter size={18} color="$color" />
                 <Text fontWeight="700" fontSize="$4" color="$text">
                    Filtros
                 </Text>
              </XStack>
              <Text color="$blue10" fontSize="$3">{isFilterBarOpen ? "Ocultar" : "Mostrar"}</Text>
            </XStack>
            
            {isFilterBarOpen ? (
              <YStack gap="$3" pt="$3">
                <YStack gap="$1">
                  <Text fontSize="$3" color="$color" opacity={0.7}>
                    Sucursal
                  </Text>
                  {renderSelect(filters.branchId, branchOptions, "Todas", handleBranchChange, isMetaLoading)}
                </YStack>
                <YStack gap="$1">
                  <Text fontSize="$3" color="$color" opacity={0.7}>
                    Rol
                  </Text>
                  {renderSelect(filters.roleId, roleOptions, "Todos", handleRoleChange, isMetaLoading)}
                </YStack>
                <YStack gap="$1">
                  <Text fontSize="$3" color="$color" opacity={0.7}>
                    Estado
                  </Text>
                  {renderSelect(filters.status, STATUS_OPTIONS, "Todos", (value) => handleStatusChange(value as StatusFilter))}
                </YStack>
                <YStack gap="$1">
                  <Text fontSize="$3" color="$color" opacity={0.7}>
                    Rango de fechas
                  </Text>
                  <XStack gap="$2">
                    <Button flex={1} size="$3" chromeless borderWidth={1} borderColor="$borderColor" icon={Calendar} onPress={() => openDatePicker("dateFrom")}>
                      {formatDateFilterLabel(filters.dateFrom, "Desde")}
                    </Button>
                    <Button flex={1} size="$3" chromeless borderWidth={1} borderColor="$borderColor" icon={Calendar} onPress={() => openDatePicker("dateTo")}>
                      {formatDateFilterLabel(filters.dateTo, "Hasta")}
                    </Button>
                  </XStack>
                  {renderIOSPicker()}
                  <Button size="$2" chromeless onPress={() => setFilters((prev) => ({ ...prev, dateFrom: "", dateTo: "" }))}>
                    Quitar rango
                  </Button>
                </YStack>
                <Button size="$3" backgroundColor="$blue10" color="white" onPress={resetFilters}>
                  Limpiar filtros
                </Button>
              </YStack>
            ) : null}
          </GlassCard>

          {/* List Content */}
          <YStack gap="$2">
             <Text fontSize="$3" color="$color" opacity={0.5} textAlign="right">{filterSummary}</Text>
          </YStack>

          {isMetaError ? (
            <AnimatedNotice
              variant="error"
              title="No pudimos cargar catálogos"
              message="Verifica la conexión para mostrar sucursales, departamentos y empleados."
              actionLabel="Reintentar"
              onAction={() => void queryClient.invalidateQueries({ queryKey: ["admin", "requests", "meta"] })}
            />
          ) : null}

          <XStack gap="$3">
            <AnimatedButton
              flex={1}
              backgroundColor="$color4"
              color="$text"
              disabled={isLoadingRequests || isRefetching}
              onPress={() => void refetchRequests()}
            >
              {isRefetching ? "Sincronizando..." : "Actualizar"}
            </AnimatedButton>
          </XStack>

          {isLoadingRequests || isRefetching ? (
            <ListSkeleton items={4} height={200} />
          ) : isRequestError ? (
            <AnimatedNotice
              variant="error"
              title="Error al cargar"
              message="No pudimos obtener las solicitudes. Intenta nuevamente."
              actionLabel="Reintentar"
              onAction={() => void refetchRequests()}
            />
          ) : filteredRequests.length === 0 ? (
            <AnimatedNotice
              variant="info"
              title="Sin coincidencias"
              message="No encontramos solicitudes que cumplan los filtros aplicados."
              actionLabel="Restablecer filtros"
              onAction={resetFilters}
            />
          ) : (
            <YStack gap="$3">
              {filteredRequests.map((item, index) => {
                const { user, branch, department, role } = resolveContext(item);
                const employeeName = getEmployeeName(item, user);
                const branchName = branch?.name ?? "Sin sucursal";
                const departmentName = department?.name ?? "Sin departamento";
                const roleName = role?.name ?? "Sin rol";
                return (
                  <Animated.View key={item.request_id} entering={FadeInDown.delay(index * 50).springify()}>
                    <GlassCard 
                      p="$0" 
                      overflow="hidden"
                      pressStyle={{ scale: 0.98, opacity: 0.9 }}
                      onPress={() => openDetails(item)}
                    >
                      <YStack p="$4" gap="$2">
                        <XStack justifyContent="space-between" alignItems="center">
                          <YStack flex={1}>
                            <Text fontSize="$5" fontWeight="700" color="$color">
                                {employeeName}
                            </Text>
                            <Text fontSize="$3" color="$color" opacity={0.6}>
                                {roleName}
                            </Text>
                          </YStack>
                          <StatusBadge
                            label={STATUS_LABELS[item.status]}
                            color={STATUS_COLORS[item.status]}
                          />
                        </XStack>

                        <Separator borderColor="$borderColor" opacity={0.5} my="$2" />
                        
                        <XStack gap="$4" flexWrap="wrap">
                             <YStack gap="$1">
                                <Text fontSize="$2" color="$color" opacity={0.5}>SOLICITADA PARA</Text>
                                <XStack alignItems="center" gap="$2">
                                    <Calendar size={14} color="$color" opacity={0.7} />
                                    <Text fontSize="$3" color="$color">{formatRequestDateTime(item)}</Text>
                                </XStack>
                             </YStack>
                        </XStack>

                        <YStack gap="$1" mt="$2">
                            <Text fontSize="$2" color="$color" opacity={0.5}>MOTIVO</Text>
                            <Text fontSize="$3" color="$color" numberOfLines={2}>{item.description}</Text>
                        </YStack>
                        
                        <Stack pt="$2">
                             <Text fontSize="$3" color="$blue10" fontWeight="600">Ver detalles</Text>
                        </Stack>
                      </YStack>
                       <LinearGradient
                            colors={["transparent", "$blue2"]}
                            start={[0.5, 0]}
                            end={[1, 1]}
                            style={{ position: 'absolute', right: 0, bottom: 0, width: 150, height: 150, opacity: 0.1, borderRadius: 100 }}
                        />
                    </GlassCard>
                  </Animated.View>
                );
              })}
            </YStack>
          )}

          <AdminNavbar />

          <Sheet
            modal
            open={detailSheetOpen}
            onOpenChange={(open: boolean) => (open ? setDetailSheetOpen(open) : closeDetails())}
            snapPoints={[85]}
            dismissOnSnapToBottom
          >
            <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
            <Sheet.Frame padding="$4" backgroundColor="$background" borderRadius="$6">
              <Sheet.Handle bg="$borderColor" />
              <Sheet.ScrollView showsVerticalScrollIndicator={false}>
                <YStack gap="$4" pb="$8">
                  {selectedRequest ? (
                    (() => {
                      const context = resolveContext(selectedRequest);
                      const employeeName = getEmployeeName(selectedRequest, context.user);
                      const branchName = context.branch?.name ?? "Sin sucursal";
                      const departmentName = context.department?.name ?? "Sin departamento";
                      const roleName = context.role?.name ?? "Sin rol";
                      return (
                        <>
                          <XStack justifyContent="space-between" alignItems="center">
                            <YStack gap="$1" flex={1}>
                               <H2 fontSize={22}>{employeeName}</H2>
                               <Paragraph color="$color" opacity={0.6}>{roleName}</Paragraph>
                            </YStack>
                            <StatusBadge
                              label={STATUS_LABELS[selectedRequest.status]}
                              color={STATUS_COLORS[selectedRequest.status]}
                            />
                          </XStack>

                          <YStack gap="$3" p="$4" borderWidth={1} borderColor="$borderColor" borderRadius="$4">
                              <Text fontWeight="600" color="$color">Detalle de la solicitud</Text>
                              <YStack gap="$1">
                                <Text fontSize="$3" color="$color" opacity={0.6}>Motivo:</Text>
                                <Paragraph color="$color">{selectedRequest.description}</Paragraph>
                              </YStack>
                              <XStack gap="$4">
                                  <YStack gap="$1">
                                    <Text fontSize="$3" color="$color" opacity={0.6}>Fecha:</Text>
                                    <Text color="$color" fontWeight="600">{formatRequestDateTime(selectedRequest)}</Text>
                                  </YStack>
                                  <YStack gap="$1">
                                    <Text fontSize="$3" color="$color" opacity={0.6}>Hora:</Text>
                                    <Text color="$color" fontWeight="600">{selectedRequest.request_time ?? "--:--"}</Text>
                                  </YStack>
                              </XStack>
                          </YStack>

                          {selectedRequest.document_path ? (
                            <Button
                              icon={Zap}
                              backgroundColor="$blue10"
                              color="white"
                              onPress={async () => {
                                if (selectedRequest.document_path) {
                                  await Linking.openURL(selectedRequest.document_path);
                                }
                              }}
                            >
                              Abrir respaldo adjunto
                            </Button>
                          ) : null}
                          
                          <YStack gap="$2">
                            <Text fontWeight="600" color="$color">Contexto</Text>
                             <XStack gap="$2" flexWrap="wrap">
                                <GlassCard p="$2" px="$3" borderRadius="$10"><Text fontSize="$3">{departmentName}</Text></GlassCard>
                                <GlassCard p="$2" px="$3" borderRadius="$10"><Text fontSize="$3">{branchName}</Text></GlassCard>
                             </XStack>
                          </YStack>

                          <Separator borderColor="$borderColor" />

                          <YStack gap="$1">
                            <Text fontWeight="600" color="$color">
                              Historial
                            </Text>
                            <Text fontSize="$3" color="$color" opacity={0.6}>
                              Creada: {formatDateTimeValue(selectedRequest.created_at)}
                            </Text>
                            <Text fontSize="$3" color="$color" opacity={0.6}>
                              Actualizada: {formatDateTimeValue(selectedRequest.updated_at)}
                            </Text>
                          </YStack>

                          {selectedRequest.status === "pending" ? (
                            <YStack gap="$4" pt="$4">
                              <Text fontWeight="600" color="$color">Acciones</Text>
                              <Input
                                placeholder="Motivo del rechazo (obligatorio si rechazas)"
                                value={rejectReason}
                                onChangeText={setRejectReason}
                                backgroundColor="$backgroundPress"
                                borderColor="$borderColor"
                              />
                              <XStack gap="$3">
                                <Button
                                  flex={1}
                                  backgroundColor="$green10"
                                  color="white"
                                  disabled={isMutating}
                                  onPress={confirmApprove}
                                >
                                  Aprobar
                                </Button>
                                <Button
                                  flex={1}
                                  backgroundColor="$red10"
                                  color="white"
                                  disabled={isMutating}
                                  onPress={handleRejectAction}
                                >
                                  Rechazar
                                </Button>
                              </XStack>
                            </YStack>
                          ) : null}
                        </>
                      );
                    })()
                  ) : (
                    <Paragraph color="$muted">Selecciona una solicitud para ver los detalles.</Paragraph>
                  )}
                  <Button chromeless mt="$4" onPress={closeDetails}>
                    Cerrar panel
                  </Button>
                </YStack>
              </Sheet.ScrollView>
            </Sheet.Frame>
          </Sheet>

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

