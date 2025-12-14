import { useMemo } from "react";
import { Stack, useRouter, type Href } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { InteractiveCard } from "@/components/ui/InteractiveCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { RoleSwitcher } from "@/components/admin/RoleSwitcher";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { adminService } from "@/services/adminService";
import { EarlyDepartureRequest } from "@/types/api";
import { Paragraph, ScrollView, Separator, Text, XStack, YStack } from "tamagui";

type SummaryCard = {
  label: string;
  value: number;
  hint: string;
  target: Href<string>;
};

export default function AdminDashboardScreen(): JSX.Element {
  const router = useRouter();

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const [
        users,
        documents,
        requests,
        companies,
        branches,
        departments,
        roles,
        schedules,
        employeeStates
      ] = await Promise.all([
        adminService.getUsers(),
        adminService.getDocuments(),
        adminService.getEarlyRequests(),
        adminService.getCompanies(),
        adminService.getBranches(),
        adminService.getDepartments(),
        adminService.getRoles(),
        adminService.getSchedules(),
        adminService.getEmployeeStates()
      ]);
      return {
        users: users.data ?? [],
        documents: documents.data ?? [],
        requests: requests.data ?? [],
        companies: companies.data ?? [],
        branches: branches.data ?? [],
        departments: departments.data ?? [],
        roles: roles.data ?? [],
        schedules: schedules.data ?? [],
        employeeStates: employeeStates.data ?? []
      };
    }
  });

  const summaryCards = useMemo<SummaryCard[]>(
    () => [
      {
        label: "Colaboradores",
        value: data?.users.length ?? 0,
        hint: "Gestión de usuarios",
        target: "/(app)/(admin)/users" as Href<string>
      },
      {
        label: "Documentos",
        value: data?.documents.length ?? 0,
        hint: "Archivos firmados",
        target: "/(app)/(admin)/documentos" as Href<string>
      },
      {
        label: "Solicitudes",
        value: data?.requests.length ?? 0,
        hint: "Pendientes",
        target: "/(app)/(admin)/solicitudes" as Href<string>
      },
      {
        label: "Sucursales",
        value: data?.branches.length ?? 0,
        hint: "Activas",
        target: "/(app)/(admin)/branches" as Href<string>
      },
      {
        label: "Departamentos",
        value: data?.departments.length ?? 0,
        hint: "Disponibles",
        target: "/(app)/(admin)/departments" as Href<string>
      },
      {
        label: "Roles",
        value: data?.roles.length ?? 0,
        hint: "Catálogo",
        target: "/(app)/(admin)/roles" as Href<string>
      },
      {
        label: "Estados",
        value: data?.employeeStates.length ?? 0,
        hint: "Situación laboral",
        target: "/(app)/(admin)/employee-states" as Href<string>
      },
      {
        label: "Horarios",
        value: data?.schedules.length ?? 0,
        hint: "Turnos configurados",
        target: "/(app)/(admin)/schedules" as Href<string>
      },
      {
        label: "Companias",
        value: data?.companies.length ?? 0,
        hint: "Unidades registradas",
        target: "/(app)/(admin)/crud" as Href<string>
      }
    ],
    [data]
  );

  const errorMessage = error instanceof Error ? error.message : "No se pudo sincronizar la data.";

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <YStack gap="$4">
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$7" color="$text">
              Panel administrativo
            </Text>
            <Paragraph color="$text" opacity={0.8}>
              Controla metricas clave y navega hacia las herramientas CRUD.
            </Paragraph>
          </YStack>

          <RoleSwitcher target="employee" />

          {isError ? (
            <AnimatedNotice
              variant="error"
              title="Ups, algo salio mal"
              message={errorMessage}
              actionLabel="Reintentar"
              onAction={() => refetch()}
            />
          ) : null}

          <XStack gap="$3">
            <AnimatedButton flex={1} onPress={() => router.push("/(app)/(admin)/crud")}>
              Gestionar Catalogos
            </AnimatedButton>
            <AnimatedButton
              flex={1}
              disabled={isLoading || isRefetching}
              backgroundColor="$color4"
              color="$text"
              onPress={() => refetch()}
            >
              {isRefetching ? "Actualizando..." : "Refrescar"}
            </AnimatedButton>
          </XStack>

          <YStack gap="$3">
            {isLoading ? (
              <ListSkeleton items={4} height={92} />
            ) : (
              summaryCards.map((card, index) => (
                <Animated.View key={card.label} entering={FadeInDown.delay(index * 80)}>
                  <InteractiveCard onPress={() => router.push(card.target)}>
                    <Text fontSize="$4" color="$text" opacity={0.7}>
                      {card.label}
                    </Text>
                    <XStack alignItems="flex-end" justifyContent="space-between">
                      <Text fontSize="$9" fontFamily="$heading" color="$text">
                        {card.value}
                      </Text>
                      <Text color="$muted" fontSize="$3">
                        {card.hint}
                      </Text>
                    </XStack>
                  </InteractiveCard>
                </Animated.View>
              ))
            )}
          </YStack>

          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontFamily="$heading" fontSize="$5" color="$text">
                Ultimas solicitudes
              </Text>
              <AnimatedButton
                backgroundColor="transparent"
                borderWidth={1}
                borderColor="$borderColor"
                color="$text"
                onPress={() => router.push("/(app)/(admin)/solicitudes")}
              >
                Ver todas
              </AnimatedButton>
            </XStack>
            <YStack borderRadius="$5" overflow="hidden" backgroundColor="$brandBg">
              {isLoading ? (
                <YStack p="$4">
                  <ListSkeleton items={3} height={84} />
                </YStack>
              ) : isError ? (
                <YStack p="$4">
                  <AnimatedNotice
                    variant="error"
                    message={errorMessage}
                    actionLabel="Reintentar"
                    onAction={() => refetch()}
                  />
                </YStack>
              ) : (
                <Animated.FlatList<EarlyDepartureRequest>
                  data={(data?.requests ?? []).slice(0, 5)}
                  keyExtractor={(item) => String(item.request_id)}
                  renderItem={({ item, index }) => (
                    <Animated.View entering={FadeInDown.delay(index * 90)}>
                      <YStack p="$4" gap="$2">
                        <Text color="$text" fontWeight="600">
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
                        <Paragraph color="$muted">
                          Motivo: {item.description ?? "Sin detalle"}
                        </Paragraph>
                        <XStack justifyContent="space-between" alignItems="center">
                          <Text color="$muted" fontSize="$2">
                            Estado: {item.status.toUpperCase()}
                          </Text>
                          <Text color="$muted" fontSize="$2">
                            {item.request_date}
                          </Text>
                        </XStack>
                        <Separator backgroundColor="$color4" />
                      </YStack>
                    </Animated.View>
                  )}
                  scrollEnabled={false}
                  initialNumToRender={3}
                  windowSize={4}
                  removeClippedSubviews
                />
              )}
            </YStack>
          </YStack>
        </YStack>
      </ScrollView>
    </Screen>
  );
}

