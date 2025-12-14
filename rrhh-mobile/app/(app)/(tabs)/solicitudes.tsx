import { useMemo, useState } from "react";
import axios from "axios";
import Animated, { FadeInDown, FadeOutUp, SlideInDown, SlideOutDown, Layout } from "react-native-reanimated";
import { format } from "date-fns";
import { Stack } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AnimatePresence,
  Paragraph,
  SizableText,
  Spinner,
  Text,
  XStack,
  YStack
} from "tamagui";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { Screen } from "@/components/ui/Screen";
import { employeeService, EarlyDeparturePayload } from "@/services/employeeService";

const statusColor = {
  pending: "#facc15",
  approved: "#22c55e",
  rejected: "#ef4444"
};

const parseApiError = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const responseMessage =
      (error.response?.data as { message?: string; errors?: Record<string, string[]> })?.message ??
      Object.values(
        (error.response?.data as { errors?: Record<string, string[]> })?.errors ?? {}
      )[0]?.[0];
    return responseMessage ?? fallback;
  }
  return fallback;
};

const validateForm = (values: EarlyDeparturePayload): Partial<Record<keyof EarlyDeparturePayload, string>> => {
  const issues: Partial<Record<keyof EarlyDeparturePayload, string>> = {};
  if (!values.description.trim()) {
    issues.description = "Describe brevemente el motivo";
  }
  if (!values.request_date.trim()) {
    issues.request_date = "Selecciona una fecha";
  }
  if (!values.request_time.trim()) {
    issues.request_time = "Selecciona una hora";
  }
  return issues;
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
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof EarlyDeparturePayload, string>>>({});
  const [feedback, setFeedback] = useState<{
    variant: "info" | "success" | "error";
    message: string;
  } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["early-requests"],
    queryFn: employeeService.getRequests
  });

  const createMutation = useMutation({
    mutationFn: employeeService.createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["early-requests"] });
      setShowForm(false);
      setForm({
        description: "",
        request_date: format(new Date(), "yyyy-MM-dd"),
        request_time: format(new Date(), "HH:mm"),
        document_path: ""
      });
      setFormErrors({});
      setFeedback({ variant: "success", message: "Solicitud enviada. Te avisaremos cuando se revise." });
    },
    onError: (err) =>
      setFeedback({ variant: "error", message: parseApiError(err, "No pudimos registrar la solicitud.") })
  });

  const requests = useMemo(() => data?.data ?? [], [data?.data]);
  const queryErrorMessage = error
    ? parseApiError(error, "No pudimos cargar tus solicitudes. Intenta nuevamente.")
    : null;

  const handleChange = <K extends keyof EarlyDeparturePayload>(key: K, value: EarlyDeparturePayload[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (): void => {
    const issues = validateForm(form);
    if (Object.keys(issues).length) {
      setFormErrors(issues);
      setFeedback({ variant: "error", message: "Revisa los campos marcados para continuar." });
      return;
    }
    createMutation.mutate(form);
  };

  const handleToggleForm = (visible: boolean): void => {
    setShowForm(visible);
    if (!visible) {
      setFormErrors({});
    }
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
            onPress={() => handleToggleForm(true)}
            backgroundColor="$brandSecondary"
          >
            Nueva
          </AnimatedButton>
        </XStack>

        {feedback ? <AnimatedNotice variant={feedback.variant} message={feedback.message} /> : null}
        {queryErrorMessage ? (
          <AnimatedNotice
            variant="error"
            message={queryErrorMessage}
            actionLabel="Reintentar"
            onAction={() => queryClient.invalidateQueries({ queryKey: ["early-requests"] })}
          />
        ) : null}

        {isLoading ? (
          <XStack alignItems="center" gap="$2">
            <Spinner color="$text" />
            <Text color="$text">Cargando solicitudes...</Text>
          </XStack>
        ) : (
          <YStack gap="$3" flex={1}>
            {requests.length ? (
              requests.map((request) => (
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
              ))
            ) : (
              <AnimatedNotice
                variant="info"
                title="Sin solicitudes registradas"
                message="Cuando necesites salir antes, crea una solicitud y podrás seguir su estado aquí."
                actionLabel="Nueva solicitud"
                onAction={() => handleToggleForm(true)}
              />
            )}
          </YStack>
        )}

        <AnimatePresence>
          {showForm ? (
            <Animated.View
              entering={SlideInDown.duration(250)}
              exiting={SlideOutDown.duration(250)}
              style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 24 }}
            >
              <YStack backgroundColor="$surface" borderRadius="$4" px="$4" py="$4" gap="$3">
                <Text fontFamily="$heading" fontSize="$5" color="$text">
                  Nueva solicitud
                </Text>
                <AnimatedInput
                  label="Motivo"
                  placeholder="Descripción breve"
                  value={form.description}
                  helperText={formErrors.description}
                  onChangeText={(value) => handleChange("description", value)}
                />
                <XStack gap="$3">
                  <AnimatedInput
                    flex={1}
                    label="Fecha"
                    value={form.request_date}
                    helperText={formErrors.request_date}
                    onChangeText={(value) => handleChange("request_date", value)}
                  />
                  <AnimatedInput
                    flex={1}
                    label="Hora"
                    value={form.request_time}
                    helperText={formErrors.request_time}
                    onChangeText={(value) => handleChange("request_time", value)}
                  />
                </XStack>
                <AnimatedInput
                  label="Documento (opcional)"
                  placeholder="Ruta o enlace"
                  value={form.document_path ?? ""}
                  helperText={formErrors.document_path ?? undefined}
                  onChangeText={(value) => handleChange("document_path", value)}
                />
                <XStack gap="$3">
                  <AnimatedButton flex={1} onPress={() => handleToggleForm(false)}>
                    Cancelar
                  </AnimatedButton>
                  <AnimatedButton
                    flex={1}
                    backgroundColor="$success"
                    onPress={handleSubmit}
                    disabled={createMutation.isPending}
                  >
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

