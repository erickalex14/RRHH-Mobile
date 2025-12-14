import { useEffect, useMemo, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { InteractiveCard } from "@/components/ui/InteractiveCard";
import { RoleSwitcher } from "@/components/admin/RoleSwitcher";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminService } from "@/services/adminService";
import { Branch, Department, EmployeeState, Role, User } from "@/types/api";
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
    return users.filter((user) => {
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
  }, [branchFilter, departmentFilter, roleFilter, search, stateFilter, users]);

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
    <YStack gap="$3">
      <AnimatedInput
        label="Buscar"
        placeholder="Nombre o correo"
        autoCapitalize="none"
        value={search}
        onChangeText={setSearch}
      />
      <XStack gap="$3" flexWrap="wrap">
        <YStack flex={1} minWidth={160} gap="$1">
          <Text fontWeight="600" color="$text">Estado</Text>
          <Select value={stateFilter} onValueChange={(value) => setStateFilter(value as FilterOption)}>
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
        <YStack flex={1} minWidth={160} gap="$1">
          <Text fontWeight="600" color="$text">Rol</Text>
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as FilterOption)}>
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
      </XStack>
      <XStack gap="$3" flexWrap="wrap">
        <YStack flex={1} minWidth={160} gap="$1">
          <Text fontWeight="600" color="$text">Sucursal</Text>
          <Select value={branchFilter} onValueChange={(value) => setBranchFilter(value as FilterOption)}>
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
        <YStack flex={1} minWidth={160} gap="$1">
          <Text fontWeight="600" color="$text">Departamento</Text>
          <Select value={departmentFilter} onValueChange={(value) => setDepartmentFilter(value as FilterOption)}>
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
      </XStack>
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
      <Animated.FlatList<User>
        data={filteredUsers}
        keyExtractor={(item) => String(item.user_id)}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <Separator backgroundColor="$color4" />}
        renderItem={({ item, index }) => {
          const statePresentation = getStatePresentation(item);
          return (
            <Animated.View entering={FadeInDown.delay(index * 85)}>
              <InteractiveCard
                onPress={() => {
                  if (isReadonlyContext) return;
                  router.push(`/(app)/(admin)/users/${item.user_id}`);
                }}
              >
                <YStack gap="$2">
                  <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$2">
                    <Text fontWeight="600" fontSize="$4" color="$text">
                      {[item.first_name, item.last_name].filter(Boolean).join(" ") || "Sin nombre"}
                    </Text>
                    <StatusBadge label={statePresentation.label} color={statePresentation.color} />
                  </XStack>
                  <Paragraph color="$muted">{item.email}</Paragraph>
                  <Paragraph color="$muted">
                    Rol: {item.employeeDetail?.role?.name ?? "Sin rol"}
                  </Paragraph>
                  <Paragraph color="$muted">
                    Departamento: {item.employeeDetail?.department?.name ?? "Sin departamento"}
                  </Paragraph>
                  <Paragraph color="$muted">
                    Sucursal: {item.employeeDetail?.department?.branch?.name ?? "Sin sucursal"}
                  </Paragraph>
                </YStack>
              </InteractiveCard>
            </Animated.View>
          );
        }}
      />
    );
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 64 }}>
        <YStack gap="$5">
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$7" color="$text">
              Usuarios
            </Text>
            <Paragraph color="$muted">
              Explora colaboradores, filtra por estado o rol y encuentra rápidamente a cualquier persona.
            </Paragraph>
          </YStack>

          <RoleSwitcher target="employee" />

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

          <AnimatedButton
            backgroundColor="$color4"
            color="$text"
            disabled={isLoading || isFetching}
            onPress={() => refetch()}
          >
            {isFetching ? "Actualizando..." : "Actualizar"}
          </AnimatedButton>

          {!isReadonlyContext ? (
            <AnimatedButton onPress={() => router.push("/(app)/(admin)/users/create")}>
              Crear usuario
            </AnimatedButton>
          ) : null}

          {renderList()}
        </YStack>
      </ScrollView>
    </Screen>
  );
}

