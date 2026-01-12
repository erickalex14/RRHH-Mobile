import { useEffect, useMemo, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { InteractiveCard } from "@/components/ui/InteractiveCard";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SimpleSelect } from "@/components/ui/SimpleSelect";
import { adminService } from "@/services/adminService";
import { Branch, Department, EmployeeDetail, EmployeeState, Role, User } from "@/types/api";
import { LinearGradient } from "expo-linear-gradient";
import { Search, Plus, RefreshCw } from "@tamagui/lucide-icons";
import {
  Button,
  H2,
  Input,
  Paragraph,
  ScrollView,
  Separator,
  Text,
  XStack,
  YStack
} from "tamagui";

type FilterOption = "all" | string;

type UsersResponse = {
  users: User[];
  states: EmployeeState[];
  roles: Role[];
  branches: Branch[];
  departments: Department[];
};

export default function AdminUsersScreen(): JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{
    context?: string | string[];
    branchId?: string | string[];
    branchName?: string | string[];
    departmentId?: string | string[];
    departmentName?: string | string[];
  }>();
  const resolveParam = (value?: string | string[]): string | undefined =>
    Array.isArray(value) ? value[0] : value;
  const contextParam = resolveParam(params.context);
  const branchParam = resolveParam(params.branchId);
  const departmentParam = resolveParam(params.departmentId);
  const branchNameParam = resolveParam(params.branchName);
  const departmentNameParam = resolveParam(params.departmentName);
  const contextType = contextParam === "branch" || contextParam === "department"
    ? (contextParam as "branch" | "department")
    : null;
  const isReadonlyContext = Boolean(contextType);
  const contextLabel = contextType === "branch"
    ? branchNameParam ?? "esta sucursal"
    : contextType === "department"
      ? departmentNameParam ?? "este departamento"
      : "";
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<FilterOption>("all");
  const [roleFilter, setRoleFilter] = useState<FilterOption>("all");
  const [branchFilter, setBranchFilter] = useState<FilterOption>("all");
  const [departmentFilter, setDepartmentFilter] = useState<FilterOption>("all");
  const handleExitContext = (): void => {
    setBranchFilter("all");
    setDepartmentFilter("all");
    router.replace("/(app)/(admin)/users");
  };

  const { data, isLoading, isFetching, isError, refetch, error } = useQuery<UsersResponse>({
    queryKey: ["admin", "users", "listing"],
    queryFn: async () => {
      const [users, states, roles, branches, departments] = await Promise.all([
        adminService.getUsers(),
        adminService.getEmployeeStates(),
        adminService.getRoles(),
        adminService.getBranches(),
        adminService.getDepartments()
      ]);
      return {
        users: users.data ?? [],
        states: states.data ?? [],
        roles: roles.data ?? [],
        branches: branches.data ?? [],
        departments: departments.data ?? []
      };
    }
  });

  const users = data?.users ?? [];
    const getEmployeeDetail = (user: User): EmployeeDetail | null => {
      return (user as any).employeeDetail ?? (user as any).employee_detail ?? null;
    };

    const normalizedUsers = useMemo(() => users.map((u) => ({ ...u, employeeDetail: getEmployeeDetail(u) })), [users]);

  const states = data?.states ?? [];
  const roles = data?.roles ?? [];
  const branches = data?.branches ?? [];
  const departments = data?.departments ?? [];
  const stateOptions = useMemo(() => [{ label: "Todos", value: "all" }, ...states.map((state) => ({
    label: state.name,
    value: String(state.employee_state_id)
  }))], [states]);

  const roleOptions = useMemo(() => [{ label: "Todos", value: "all" }, ...roles.map((role) => ({
    label: role.name,
    value: String(role.role_id)
  }))], [roles]);

  const branchOptions = useMemo(
    () => [{ label: "Todas", value: "all" }, ...branches.map((branch) => ({
      label: branch.name ?? "Sin nombre",
      value: String(branch.branch_id)
    }))],
    [branches]
  );

  const filteredDepartments = useMemo(() => {
    if (branchFilter === "all") {
      return departments;
    }
    return departments.filter((department) => {
      const departmentBranchId = department.branch_id ?? department.branch?.branch_id;
      return String(departmentBranchId ?? "") === branchFilter;
    });
  }, [branchFilter, departments]);

  const departmentOptions = useMemo(
    () => [{ label: "Todos", value: "all" }, ...filteredDepartments.map((department) => ({
      label: department.name ?? "Sin nombre",
      value: String(department.department_id)
    }))],
    [filteredDepartments]
  );

  useEffect(() => {
    if (departmentFilter === "all") return;
    const departmentStillVisible = filteredDepartments.some((department) =>
      String(department.department_id) === departmentFilter
    );
    if (!departmentStillVisible) {
      setDepartmentFilter("all");
    }
  }, [departmentFilter, filteredDepartments]);

  useEffect(() => {
    if (contextType === "branch" && branchParam) {
      setBranchFilter(branchParam);
      setDepartmentFilter("all");
      return;
    }
    if (contextType === "department" && departmentParam) {
      setDepartmentFilter(departmentParam);
      const matchedDepartment = departments.find(
        (department) => String(department.department_id) === departmentParam
      );
      const matchedBranchId = matchedDepartment?.branch_id ?? matchedDepartment?.branch?.branch_id;
      if (matchedBranchId) {
        setBranchFilter(String(matchedBranchId));
      }
    }
  }, [branchParam, contextType, departmentParam, departments]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return normalizedUsers.filter((user) => {
      const matchesSearch = normalizedSearch.length === 0
        ? true
        : [
            `${user.first_name ?? ""} ${user.last_name ?? ""}`.toLowerCase(),
            user.email?.toLowerCase() ?? ""
          ].some((field) => field.includes(normalizedSearch));
      const matchesState = stateFilter === "all"
        ? true
        : String(user.employee_state_id ?? user.employeeState?.employee_state_id ?? "") === stateFilter;
      const assignedRoleId = user.employeeDetail?.role_id ?? user.employeeDetail?.role?.role_id;
      const matchesRole = roleFilter === "all" ? true : String(assignedRoleId ?? "") === roleFilter;
      const userBranchId = user.employeeDetail?.department?.branch_id ?? user.employeeDetail?.department?.branch?.branch_id;
      const matchesBranch = branchFilter === "all" ? true : String(userBranchId ?? "") === branchFilter;
      const userDepartmentId = user.employeeDetail?.department?.department_id;
      const matchesDepartment = departmentFilter === "all" ? true : String(userDepartmentId ?? "") === departmentFilter;
      return matchesSearch && matchesState && matchesRole && matchesBranch && matchesDepartment;
    });
  }, [branchFilter, departmentFilter, normalizedUsers, roleFilter, search, stateFilter]);

  const getStatePresentation = (user: User): { label: string; color: string } => {
    const label = user.employeeState?.name ?? "Sin estado";
    const normalized = label.toLowerCase();
    if (normalized.includes("activo")) {
      return { label, color: "#059669" };
    }
    if (normalized.includes("inactivo")) {
      return { label, color: "#9ca3af" };
    }
    if (normalized.includes("suspend")) {
      return { label, color: "#f97316" };
    }
    return { label, color: "#2563eb" };
  };

  const renderFilters = (): JSX.Element => (
    <YStack gap="$4">
      {/* Search Bar stylized like Dashboard */}
      <GlassCard 
        p="$0"
        overflow="hidden"
        borderRadius="$6" 
        height={50} 
      >
        <XStack flex={1} alignItems="center" px="$4" gap="$2">
            <Search size={20} color="#9ca3af" />
            <Input 
              flex={1} 
              borderWidth={0} 
              backgroundColor="transparent" 
              placeholder="Buscar por nombre o correo..." 
              placeholderTextColor="$gray10"
              color="white"
              value={search}
              onChangeText={setSearch}
            />
        </XStack>
      </GlassCard>

      {/* Filters Grid */}
      <GlassCard gap="$4" borderRadius="$6" p="$4">
        <XStack gap="$3" flexWrap="wrap">
          <YStack flex={1} minWidth={160} gap="$1">
            <Text fontWeight="600" color="$gray11" fontSize="$3">Estado</Text>
            <SimpleSelect
              options={stateOptions}
              value={stateFilter}
              onValueChange={(value) => setStateFilter(value as FilterOption)}
              placeholder="Selecciona estado"
            />
          </YStack>
          <YStack flex={1} minWidth={160} gap="$1">
            <Text fontWeight="600" color="$gray11" fontSize="$3">Rol</Text>
            <SimpleSelect
              options={roleOptions}
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as FilterOption)}
              placeholder="Selecciona rol"
            />
          </YStack>
        </XStack>
        <XStack gap="$3" flexWrap="wrap">
          <YStack flex={1} minWidth={160} gap="$1">
            <Text fontWeight="600" color="$gray11" fontSize="$3">Sucursal</Text>
            <SimpleSelect
              options={branchOptions}
              value={branchFilter}
              onValueChange={(value) => setBranchFilter(value as FilterOption)}
              placeholder="Selecciona sucursal"
            />
          </YStack>
          <YStack flex={1} minWidth={160} gap="$1">
            <Text fontWeight="600" color="$gray11" fontSize="$3">Departamento</Text>
            <SimpleSelect
              options={departmentOptions}
              value={departmentFilter}
              onValueChange={(value) => setDepartmentFilter(value as FilterOption)}
              placeholder="Selecciona departamento"
            />
          </YStack>
        </XStack>
      </GlassCard>
    </YStack>
  );

  const renderList = (): JSX.Element => {
    if (isLoading || isFetching) {
      return <ListSkeleton items={5} height={140} />;
    }
    if (isError) {
      const message = error instanceof Error ? error.message : "No pudimos cargar los usuarios.";
      return (
        <AnimatedNotice
          variant="error"
          title="Error al cargar"
          message={message}
          actionLabel="Reintentar"
          onAction={() => refetch()}
        />
      );
    }
    if (filteredUsers.length === 0) {
      return <AnimatedNotice variant="info" message="No hay usuarios con los filtros aplicados." />;
    }
    return (
      <YStack gap="$3">
        {filteredUsers.map((item, index) => {
           const statePresentation = getStatePresentation(item);
           return (
              <Animated.View key={item.user_id} entering={FadeInDown.delay(index * 50).springify()}>
                <GlassCard 
                  p="$0" 
                  overflow="hidden"
                  pressStyle={{ scale: 0.98, opacity: 0.9 }}
                  onPress={() => {
                    if (!isReadonlyContext) {
                        router.push(`/(app)/(admin)/users/${item.user_id}`);
                    }
                  }}
                >
                  <YStack p="$4" gap="$2">
                    <XStack justifyContent="space-between" alignItems="center">
                      <YStack>
                          <Text fontWeight="700" fontSize="$5" color="white">
                            {[item.first_name, item.last_name].filter(Boolean).join(" ") || "Sin nombre"}
                          </Text>
                          <Text fontSize="$3" color="$gray10">{item.email}</Text>
                      </YStack>
                      <StatusBadge label={statePresentation.label} color={statePresentation.color} />
                    </XStack>
                    
                    <Separator borderColor="rgba(255,255,255,0.1)" my="$2" />
                    
                    <XStack gap="$4" flexWrap="wrap">
                        <YStack gap="$1">
                            <Text fontSize="$2" color="$gray11">ROL</Text>
                            <Text fontSize="$3" color="white">{item.employeeDetail?.role?.name ?? "N/A"}</Text>
                        </YStack>
                        <YStack gap="$1">
                            <Text fontSize="$2" color="$gray11">DEPARTAMENTO</Text>
                            <Text fontSize="$3" color="white">{item.employeeDetail?.department?.name ?? "N/A"}</Text>
                        </YStack>
                        <YStack gap="$1">
                            <Text fontSize="$2" color="$gray11">SUCURSAL</Text>
                            <Text fontSize="$3" color="white">{item.employeeDetail?.department?.branch?.name ?? "N/A"}</Text>
                        </YStack>
                    </XStack>
                  </YStack>
                  <LinearGradient
                    colors={["transparent", "#3b82f6"]}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={{ position: 'absolute', right: 0, bottom: 0, width: 100, height: 100, opacity: 0.1, borderRadius: 50 }}
                  />
                </GlassCard>
              </Animated.View>
           );
        })}
      </YStack>
    );
  };

  return (
    <Screen>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={{ position: 'absolute', width: '100%', height: '100%', zIndex: -1 }}
      />
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <YStack gap="$4" pt="$safe" px="$0">
          
           {/* Header */}
          <XStack justifyContent="space-between" alignItems="center" mb="$2">
             <YStack>
                <H2 fontWeight="800" fontSize={28} color="white">Usuarios</H2>
                <Paragraph color="$gray10">Gestión de colaboradores</Paragraph>
             </YStack>
             
             {!isReadonlyContext && (
                <XStack gap="$2">
                     <Button 
                        size="$3" 
                        circular 
                        icon={<RefreshCw color="white" />} 
                        backgroundColor="rgba(255,255,255,0.1)" 
                        onPress={() => refetch()} 
                     />
                     <Button 
                        size="$3" 
                        circular 
                        icon={Plus} 
                        backgroundColor="$blue10" 
                        color="white"
                        onPress={() => router.push("/(app)/(admin)/users/create")}
                     />
                </XStack>
             )}
          </XStack>

          {isReadonlyContext ? (
            <AnimatedNotice
              variant="info"
              title="Vista solo lectura"
              message={`Mostrando usuarios vinculados a ${contextLabel || "este contexto"}.`}
              actionLabel="Salir de vista"
              onAction={handleExitContext}
            />
          ) : null}

          {renderFilters()}

          {renderList()}
        </YStack>
      </ScrollView>
      <AdminNavbar />
    </Screen>
  );
}

