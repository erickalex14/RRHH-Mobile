import { useMemo, useState } from "react";
import axios from "axios";
import Animated, { FadeInDown, SlideInDown, SlideOutDown, Layout } from "react-native-reanimated";
import { format } from "date-fns";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AnimatePresence,
  Paragraph,
  Spinner,
  Text,
  XStack,
  YStack,
  Button,
  Separator,
  View
} from "tamagui";
import { Screen } from "@/components/ui/Screen";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { employeeService, EarlyDeparturePayload } from "@/services/employeeService";
import { 
  FileText, 
  Plus, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  FileEdit
} from "@tamagui/lucide-icons";

// --- CONFIGURACIÓN DE COLORES Y ESTADOS ---
const statusConfig: any = {
  pending: { color: "#fbbf24", label: "PENDIENTE", icon: AlertCircle, bg: "rgba(251, 191, 36, 0.15)" },
  approved: { color: "#4ade80", label: "APROBADO", icon: CheckCircle, bg: "rgba(74, 222, 128, 0.15)" },
  rejected: { color: "#f87171", label: "RECHAZADO", icon: XCircle, bg: "rgba(248, 113, 113, 0.15)" }
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

// --- COMPONENTES AUXILIARES ---

// 1. Tarjeta de Solicitud (Estilo Ticket)
const RequestCard = ({ item, index }: { item: any, index: number }) => {
  const status = statusConfig[item.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()} layout={Layout.springify()} style={{ marginBottom: 12 }}>
      <GlassCard glow={false} px="$4" py="$4" gap="$3" borderRadius="$5">
        <XStack justifyContent="space-between" alignItems="center">
          <XStack gap="$2" alignItems="center">
            <YStack backgroundColor="rgba(255,255,255,0.06)" padding="$2" borderRadius="$3">
              <FileText size={16} color="#94a3b8" />
            </YStack>
            <Text color="$text" fontSize="$3" fontWeight="bold" opacity={0.65}>
              SOLICITUD #{item.request_id || "NEW"}
            </Text>
          </XStack>

          <XStack
            backgroundColor={status.bg}
            paddingHorizontal="$2"
            paddingVertical="$1.5"
            borderRadius="$4"
            alignItems="center"
            gap="$1.5"
            borderWidth={1}
            borderColor="rgba(255,255,255,0.08)"
          >
            <StatusIcon size={12} color={status.color} />
            <Text color={status.color} fontSize={10} fontWeight="800" letterSpacing={1}>
              {status.label}
            </Text>
          </XStack>
        </XStack>

        <Separator borderColor="rgba(255,255,255,0.08)" />

        <YStack>
          <Text color="$text" fontSize="$5" fontWeight="bold" numberOfLines={1}>
            {item.description}
          </Text>
          <XStack gap="$4" marginTop="$2" opacity={0.7}>
            <XStack gap="$1.5" alignItems="center">
              <Calendar size={14} color="$text" />
              <Text color="$text" fontSize="$3">{item.request_date}</Text>
            </XStack>
            <XStack gap="$1.5" alignItems="center">
              <Clock size={14} color="$text" />
              <Text color="$text" fontSize="$3">{item.request_time}</Text>
            </XStack>
          </XStack>
        </YStack>
      </GlassCard>
    </Animated.View>
  );
};

export default function SolicitudesScreen(): JSX.Element {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [form, setForm] = useState<EarlyDeparturePayload>({
    description: "",
    request_date: format(new Date(), "yyyy-MM-dd"),
    request_time: format(new Date(), "HH:mm"),
    document_path: ""
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof EarlyDeparturePayload, string>>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["early-requests"],
    queryFn: employeeService.getRequests
  });

  const createMutation = useMutation({
    mutationFn: employeeService.createRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["early-requests"] });
      handleToggleForm(false);
      setForm({
        description: "",
        request_date: format(new Date(), "yyyy-MM-dd"),
        request_time: format(new Date(), "HH:mm"),
        document_path: ""
      });
    },
    onError: (err) => alert(parseApiError(err, "Error al crear solicitud"))
  });

  const requests = useMemo(() => data?.data ?? [], [data?.data]);

  const handleToggleForm = (visible: boolean) => {
    setShowForm(visible);
    if (!visible) setFormErrors({});
  };

  const handleChange = (key: keyof EarlyDeparturePayload, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setFormErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = () => {
    const nextErrors: Partial<Record<keyof EarlyDeparturePayload, string>> = {};
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!form.description.trim()) nextErrors.description = "El motivo es requerido";
    if (!dateRegex.test(form.request_date)) nextErrors.request_date = "Fecha en formato YYYY-MM-DD";
    if (!timeRegex.test(form.request_time)) nextErrors.request_time = "Hora en formato HH:MM";

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload: EarlyDeparturePayload = {
      description: form.description.trim(),
      request_date: form.request_date,
      request_time: form.request_time,
      document_path: form.document_path?.trim() || undefined
    };

    createMutation.mutate(payload);
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      
      <YStack flex={1} paddingTop="$4" paddingHorizontal="$1" backgroundColor="#070f1b" paddingBottom={insets.bottom + 8}>
        {/* CABECERA */}
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
          <YStack>
            <Text fontFamily="$heading" fontSize="$7" color="$text" fontWeight="bold">
              Permisos
            </Text>
            <Text color="$muted" fontSize="$3">Gestiona tus salidas anticipadas</Text>
          </YStack>
          
          <AnimatedButton
            size="$3"
            icon={<Plus size={18} color="white" />}
            onPress={() => handleToggleForm(true)}
            borderRadius="$10"
          >
            Nueva
          </AnimatedButton>
        </XStack>

        {/* ESTADO DE CARGA / LISTA */}
        {isLoading ? (
          <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
            <Spinner size="large" color="#2563EB" />
            <Text color="$text" opacity={0.7}>Consultando registros...</Text>
          </YStack>
        ) : (
          <YStack flex={1}>
            {requests.length === 0 ? (
              <YStack flex={1} justifyContent="center" alignItems="center" opacity={0.5} gap="$2">
                <FileText size={48} color="$text" />
                <Text color="$text" textAlign="center">No tienes solicitudes recientes</Text>
              </YStack>
            ) : (
              requests.map((req: any, i: number) => (
                <RequestCard key={req.request_id || i} item={req} index={i} />
              ))
            )}
          </YStack>
        )}

        {/* FORMULARIO DESLIZANTE (MODAL MEJORADO) */}
        <AnimatePresence>
          {showForm && (
            <>
              {/* Fondo oscuro backdrop */}
              <Animated.View
                entering={FadeInDown.duration(200)}
                exiting={FadeInDown.duration(200).withCallback((finished) => {
                  "worklet";
                })} 
                style={{
                  position: "absolute", top: -50, bottom: -50, left: -20, right: -20,
                  backgroundColor: "rgba(0,0,0,0.6)", zIndex: 10
                }}
              >
                <Button
                  unstyled
                  width="100%" height="100%"
                  onPress={() => handleToggleForm(false)}
                />
              </Animated.View>

              {/* Panel del Formulario */}
              <Animated.View
                entering={SlideInDown.springify().damping(16).stiffness(140)}
                exiting={SlideOutDown.duration(200)}
                style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  backgroundColor: "#0F172A", // Slate 900
                  borderTopLeftRadius: 32, borderTopRightRadius: 32,
                  padding: 24, zIndex: 20,
                  borderTopWidth: 1, borderColor: "rgba(255,255,255,0.1)",
                  shadowColor: "#000",
                  shadowOpacity: 0.5,
                  shadowRadius: 24,
                  shadowOffset: { width: 0, height: -10 },
                  paddingBottom: insets.bottom + 24
                }}
              >
                 {/* Grabber Handle */}
                 <XStack justifyContent="center" marginBottom="$4" opacity={0.5}>
                    <View width={48} height={5} borderRadius={10} backgroundColor="white" />
                 </XStack>

                <XStack justifyContent="space-between" alignItems="center" marginBottom="$5">
                  <XStack gap="$3" alignItems="center">
                    <YStack backgroundColor="rgba(37, 99, 235, 0.2)" padding="$2" borderRadius="$4">
                      <FileEdit size={20} color="#60a5fa" />
                    </YStack>
                    <YStack>
                      <Text fontSize="$5" fontWeight="bold" color="$text">Nueva Solicitud</Text>
                      <Text fontSize="$2" color="$muted">Completa los datos requeridos</Text>
                    </YStack>
                  </XStack>
                </XStack>

                <YStack gap="$4">
                  <AnimatedInput
                    label="Motivo de la solicitud"
                    placeholder="Ej. Cita médica, Trámite bancario..."
                    value={form.description}
                    onChangeText={(t) => handleChange("description", t)}
                    status={formErrors.description ? "error" : undefined}
                    helperText={formErrors.description}
                  />

                  <XStack gap="$3">
                    <AnimatedInput
                      flex={1}
                      label="Fecha"
                      placeholder="YYYY-MM-DD"
                      value={form.request_date}
                      onChangeText={(t) => handleChange("request_date", t)}
                      status={formErrors.request_date ? "error" : undefined}
                      helperText={formErrors.request_date}
                    />
                    <AnimatedInput
                      flex={1}
                      label="Hora"
                      placeholder="HH:MM"
                      value={form.request_time}
                      onChangeText={(t) => handleChange("request_time", t)}
                      status={formErrors.request_time ? "error" : undefined}
                      helperText={formErrors.request_time}
                    />
                  </XStack>

                  <AnimatedButton
                    height="$6"
                    marginTop="$4"
                    status="default"
                    icon={createMutation.isPending ? <Spinner color="white" /> : <CheckCircle color="white" size={18} />}
                    onPress={handleSubmit}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Procesando..." : "Crear Solicitud"}
                  </AnimatedButton>
                  
                  <Button 
                    unstyled 
                    alignSelf="center" 
                    marginTop="$2" 
                    onPress={() => handleToggleForm(false)}
                  >
                    <Text color="$muted" fontSize="$3">Cancelar</Text>
                  </Button>
                </YStack>
              </Animated.View>
            </>
          )}
        </AnimatePresence>

      </YStack>
    </Screen>
  );
}