import { Screen } from "@/components/ui/Screen";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { employeeService, EarlyDeparturePayload } from "@/services/employeeService";
import { format } from "date-fns";
import { Stack } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AnimatePresence,
  Paragraph,
  SizableText,
  Spinner,
  Text,
  XStack,
  YStack
} from "tamagui";
import Animated, { FadeInDown, FadeOutUp, SlideInDown, SlideOutDown, Layout } from "react-native-reanimated";

const statusColor = {
  pending: "#facc15",
  approved: "#22c55e",
  rejected: "#ef4444"
};

export default function SolicitudesScreen(): JSX.Element {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EarlyDeparturePayload>({
    description: "",
    request_date: format(new Date(), "yyyy-MM-dd"),
    request_time: format(new Date(), "HH:mm"),
    document_path: ""
  });

  const { data, isLoading } = useQuery({
    queryKey: ["early-requests"],
    queryFn: employeeService.getRequests
  });

  const createMutation = useMutation({
    mutationFn: employeeService.createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["early-requests"] });
      setShowForm(false);
      setForm((prev) => ({ ...prev, description: "", document_path: "" }));
    }
  });

  const requests = useMemo(() => data?.data ?? [], [data?.data]);

  const handleSubmit = (): void => {
    createMutation.mutate(form);
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <YStack flex={1} gap="$4">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontFamily="$heading" fontSize="$6" color="$text">
            Solicitudes de salida
          </Text>
          <AnimatedButton
            onPress={() => setShowForm(true)}
            bg="$brandSecondary"
          >
            Nueva
          </AnimatedButton>
        </XStack>

        {isLoading ? (
          <XStack alignItems="center" gap="$2">
            <Spinner color="$text" />
            <Text color="$text">Cargando solicitudes...</Text>
          </XStack>
        ) : (
          <YStack gap="$3" flex={1}>
            {requests.map((request) => (
              <Animated.View
                key={request.request_id}
                entering={FadeInDown}
                layout={Layout.springify()}
                style={{ backgroundColor: "#0f172a", padding: 16, borderRadius: 24 }}
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack gap="$1">
                    <Text color="$text" fontSize="$4">
                      {request.description}
                    </Text>
                    <Paragraph color="$text" opacity={0.65}>
                      {request.request_date} · {request.request_time}
                    </Paragraph>
                  </YStack>
                  <Animated.View
                    key={request.status}
                    entering={FadeInDown}
                    exiting={FadeOutUp}
                    style={{
                      backgroundColor: statusColor[request.status],
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999
                    }}
                  >
                    <Text color="#0f172a" fontWeight="700">
                      {request.status.toUpperCase()}
                    </Text>
                  </Animated.View>
                </XStack>
              </Animated.View>
            ))}
          </YStack>
        )}

        <AnimatePresence>
          {showForm ? (
            <Animated.View
              entering={SlideInDown.duration(250)}
              exiting={SlideOutDown.duration(250)}
              style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 24 }}
            >
              <YStack bg="$surface" borderRadius="$4" px="$4" py="$4" gap="$3">
                <Text fontFamily="$heading" fontSize="$5" color="$text">
                  Nueva solicitud
                </Text>
                <AnimatedInput
                  label="Motivo"
                  placeholder="Descripción breve"
                  value={form.description}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
                />
                <XStack gap="$3">
                  <AnimatedInput
                    flex={1}
                    label="Fecha"
                    value={form.request_date}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, request_date: value }))}
                  />
                  <AnimatedInput
                    flex={1}
                    label="Hora"
                    value={form.request_time}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, request_time: value }))}
                  />
                </XStack>
                <AnimatedInput
                  label="Documento (opcional)"
                  placeholder="Ruta o enlace"
                  value={form.document_path ?? ""}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, document_path: value }))}
                />
                <XStack gap="$3">
                  <AnimatedButton flex={1} onPress={() => setShowForm(false)}>
                    Cancelar
                  </AnimatedButton>
                  <AnimatedButton flex={1} bg="$success" onPress={handleSubmit} disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Spinner color="$text" /> : "Guardar"}
                  </AnimatedButton>
                </XStack>
              </YStack>
            </Animated.View>
          ) : null}
        </AnimatePresence>
      </YStack>
    </Screen>
  );
}
