import { useMemo } from "react";
import { Stack, useRouter, type Href } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { Screen } from "@/components/ui/Screen";
import { adminService } from "@/services/adminService";
import { 
  BarChart, 
  Bell, 
  Search, 
  Users, 
  FileText, 
  ClipboardList, 
  Building2, 
  Layers, 
  Shield, 
  Briefcase, 
  Clock 
} from "@tamagui/lucide-icons";
import { 
  Button, 
  H2, 
  H4, 
  Input, 
  Paragraph, 
  ScrollView,
  SizableText, 
  XStack, 
  YStack 
} from "tamagui";
import { LinearGradient } from "expo-linear-gradient";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { RoleSwitcher } from "@/components/admin/RoleSwitcher";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

type SummaryCard = {
  label: string;
  value: number;
  hint: string;
  target: Href<string>;
  Icon: typeof Users;
  color: string;
  bg: string;
};

export default function AdminDashboardScreen(): JSX.Element {
  const router = useRouter();

  const { data, isLoading } = useQuery({
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
        target: "/(app)/(admin)/users",
        Icon: Users,
        color: "$blue10",
        bg: "$blue2"
      },
      {
        label: "Documentos",
        value: data?.documents.length ?? 0,
        hint: "Archivos firmados",
        target: "/(app)/(admin)/documentos",
        Icon: FileText,
        color: "$green10",
        bg: "$green2"
      },
      {
        label: "Solicitudes",
        value: data?.requests.length ?? 0,
        hint: "Pendientes",
        target: "/(app)/(admin)/solicitudes",
        Icon: ClipboardList,
        color: "$orange10",
        bg: "$orange2"
      },
      {
        label: "Recursos", 
        value: data?.branches.length ?? 0,
        hint: "Sucursales",
        target: "/(app)/(admin)/branches",
        Icon: Building2,
        color: "$purple10",
        bg: "$purple2"
      },
      {
        label: "Departamentos",
        value: data?.departments.length ?? 0,
        hint: "Estructura",
        target: "/(app)/(admin)/departments",
        Icon: Layers,
        color: "$red10",
        bg: "$red2"
      },
      {
        label: "Roles",
        value: data?.roles.length ?? 0,
        hint: "Permisos",
        target: "/(app)/(admin)/roles",
        Icon: Shield,
        color: "$pink10",
        bg: "$pink2"
      },
      {
        label: "Equipos",
        value: data?.employeeStates.length ?? 0,
        hint: "Estados",
        target: "/(app)/(admin)/employee-states",
        Icon: Briefcase,
        color: "$indigo10",
        bg: "$indigo2"
      },
      {
        label: "Horarios",
        value: data?.schedules.length ?? 0,
        hint: "Turnos",
        target: "/(app)/(admin)/schedules",
        Icon: Clock,
        color: "$cyan10",
        bg: "$cyan2"
      },
    ],
    [data]
  );

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        <YStack gap="$4" pt="$0" pb="$8">
        
        {/* Header */}
        <YStack gap="$4" pt="$safe" px="$0">
            <XStack justifyContent="space-between" alignItems="center">
                <H2 fontWeight="800" fontSize={24} color="$color">Panel Admin</H2>
                <XStack gap="$2" alignItems="center">
                    <ThemeToggle />
                    <Button icon={Bell} circular size="$3" chromeless />
                </XStack>
            </XStack>

            <RoleSwitcher target="employee" />

            {/* Search Bar */}
            <XStack 
                bg="$background" 
                borderRadius="$6" 
                height={50} 
                alignItems="center" 
                px="$4" 
                borderWidth={1}
                borderColor="$borderColor"
                mx="$0"
            >
            <Search size={20} color="$color" opacity={0.5} />
            <Input 
                flex={1} 
                borderWidth={0} 
                backgroundColor="transparent" 
                placeholder="Buscar colaboradores..." 
                placeholderTextColor="$color"
                opacity={0.7}
            />
            </XStack>

        </YStack>

        {/* Action Buttons */}
        <XStack gap="$3">
          <LinearGradient
            colors={['#2563eb', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, borderRadius: 16, padding: 16, height: 100, justifyContent: 'center', alignItems: 'center' }}
          >
             <YStack alignItems="center" gap="$2">
                <BarChart color="white" size={24} />
                <SizableText color="white" fontWeight="600">Estadísticas</SizableText>
             </YStack>
          </LinearGradient>

          <LinearGradient
            colors={['#c026d3', '#db2777']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, borderRadius: 16, padding: 16, height: 100, justifyContent: 'center', alignItems: 'center' }}
          >
             <YStack alignItems="center" gap="$2">
                <Bell color="white" size={24} />
                <SizableText color="white" fontWeight="600">Notificar</SizableText>
             </YStack>
          </LinearGradient>
        </XStack>

        {/* Resumen Rápido Grid */}
        <YStack gap="$3" mt="$2">
          <H4 fontWeight="700">Resumen Rápido</H4>
          <XStack flexWrap="wrap" gap="$3" justifyContent="space-between">
            {summaryCards.map((stat, index) => (
              <Animated.View 
                key={index} 
                entering={FadeInDown.delay(index * 50).springify()}
                style={{ width: '48%' }}
              >
                <YStack 
                  bg="$background" 
                  borderRadius="$4" 
                  p="$3"
                  borderWidth={1}
                  borderColor="$borderColor"
                  pressStyle={{ scale: 0.98 }}
                  animation="quick"
                  onPress={() => router.push(stat.target)}
                >
                    <XStack justifyContent="space-between" alignItems="flex-start" mb="$2">
                      <YStack 
                          bg={stat.bg} 
                          p="$2" 
                          borderRadius="$3"
                          alignItems="center"
                          justifyContent="center"
                      >
                          <stat.Icon size={20} color={stat.color} />
                      </YStack>
                      <SizableText fontSize={18} fontWeight="700">{stat.value}</SizableText>
                    </XStack>
                    <SizableText fontSize={12} color="$color" opacity={0.7}>{stat.label}</SizableText>
                </YStack>
              </Animated.View>
            ))}
          </XStack>
        </YStack>
        </YStack>
      </ScrollView>
      <AdminNavbar />
    </Screen>
  );
}

