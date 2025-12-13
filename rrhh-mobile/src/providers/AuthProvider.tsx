import { PropsWithChildren, useEffect, useRef } from "react";
import { Spinner, Text, YStack } from "tamagui";
import { useAuthStore } from "@/store/auth";

export const AuthProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const status = useAuthStore((state) => state.status);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) {
      return;
    }
    bootstrapped.current = true;
    bootstrap();
  }, [bootstrap]);

  if (status === "checking") {
    return (
      <YStack flex={1} bg="$brandBg" alignItems="center" justifyContent="center">
        <Spinner size="large" color="$brandPrimary" />
        <Text color="$text" mt="$3">
          Inicializando sesión...
        </Text>
      </YStack>
    );
  }

  return <>{children}</>;
};
