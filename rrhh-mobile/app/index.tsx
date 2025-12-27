import { Redirect } from "expo-router";
import { Spinner, YStack } from "tamagui";
import { useAuthStore } from "@/store/auth";
import { isUserAdmin } from "@/utils/auth";

export default function Index() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  // Si estamos verificando la sesión, mostrar loading
  if (status === "checking") {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$brandBg">
        <Spinner size="large" color="$brandPrimary" />
      </YStack>
    );
  }

  // Si está autenticado, redirigir según el rol
  if (status === "authenticated" && user) {
    const isAdmin = isUserAdmin(user);
    if (isAdmin) {
      return <Redirect href="/(app)/(admin)/dashboard" />;
    }
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  // Si no está autenticado, ir al login
  return <Redirect href="/(auth)/login" />;
}
