import { Redirect, Stack, useRouter } from "expo-router";
import { Paragraph, Spinner, Text, YStack } from "tamagui";
import { useAuthStore } from "@/store/auth";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";

export default function AdminLayout(): JSX.Element {
  const router = useRouter();
  const { status, user } = useAuthStore((state) => ({
    status: state.status,
    user: state.user
  }));

  if (status === "checking") {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$brandBg">
        <Spinner size="large" color="$brandPrimary" />
      </YStack>
    );
  }

  if (status !== "authenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  const isAdmin = user?.employeeDetail?.role?.admin;

  if (!isAdmin) {
    return (
      <YStack flex={1} backgroundColor="$brandBg" alignItems="center" justifyContent="center" px="$6" py="$8">
        <YStack width="100%" maxWidth={420} gap="$4">
          <Text fontFamily="$heading" fontSize="$8" color="$text">
            Acceso restringido
          </Text>
          <Paragraph fontSize="$4" color="$muted">
            Este módulo está limitado a perfiles con permisos administrativos. Si necesitas habilitarlos, habla con tu supervisor.
          </Paragraph>
          <AnimatedNotice
            title="No tienes permisos activos"
            message="Vuelve a la vista de colaborador para continuar con tus gestiones diarias."
            variant="error"
            actionLabel="Ir al inicio"
            onAction={() => router.replace("/(app)/(tabs)/home")}
          />
        </YStack>
      </YStack>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade_from_bottom"
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="crud" />
      <Stack.Screen name="jornadas" />
      <Stack.Screen name="solicitudes" />
      <Stack.Screen name="documentos" />
      <Stack.Screen name="branches" />
      <Stack.Screen name="departments" />
      <Stack.Screen name="roles" />
      <Stack.Screen name="employee-states" />
      <Stack.Screen name="users" />
      <Stack.Screen name="users/create" />
      <Stack.Screen name="users/[user_id]" />
      <Stack.Screen name="employee-details/create/[user_id]" />
      <Stack.Screen name="schedules" />
    </Stack>
  );
}

