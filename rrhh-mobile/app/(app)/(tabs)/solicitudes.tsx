import { useMemo, useState } from "react";
import axios from "axios";
import Animated, { FadeInDown, SlideInDown, SlideOutDown, Layout } from "react-native-reanimated";
import { format } from "date-fns";
import { Stack } from "expo-router";
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
  Input,
  Label
} from "tamagui";
import { Screen } from "@/components/ui/Screen";
import { employeeService, EarlyDeparturePayload } from "@/services/employeeService";
import { 
  FileText, 
  Plus, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  MoreHorizontal 
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
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      layout={Layout.springify()}
      style={{
        backgroundColor: "#1e293b", // Gris oscuro profesional
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
        overflow: "hidden"
      }}
    >
      <YStack padding="$4" gap="$3">
        {/* Cabecera: Icono y Estado */}
        <XStack justifyContent="space-between" alignItems="center">
          <XStack gap="$2" alignItems="center">
            <YStack backgroundColor="#334155" padding="$2" borderRadius="$3">
              <FileText size={16} color="#94a3b8" />
            </YStack>
            <Text color="$text" fontSize="$3" fontWeight="bold" opacity={0.5}>
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
          >
            <StatusIcon size={12} color={status.color} />
            <Text color={status.color} fontSize={10} fontWeight="800" letterSpacing={1}>
              {status.label}
            </Text>
          </XStack>
        </XStack>

        <Separator borderColor="rgba(255,255,255,0.1)" />

        {/* Cuerpo: Descripción */}
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
      </YStack>
    </Animated.View>
  );
};

export default function SolicitudesScreen(): JSX.Element {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [form, setForm] = useState<EarlyDeparturePayload>({
    description: "",
    request_date: format(new Date(), "yyyy-MM-dd"),
    request_time: format(new Date(), "HH:mm"),
    document_path: ""
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof EarlyDeparturePayload, string>>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["early-requests"],
    queryFn: employeeService.getRequests
  });

  const createMutation = useMutation({
    mutationFn: employeeService.createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["early-requests"] });
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
    if (!form.description) {
      setFormErrors({ description: "El motivo es requerido" });
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      
      <YStack flex={1} paddingTop="$4" paddingHorizontal="$1">
        {/* CABECERA */}
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
          <YStack>
            <Text fontFamily="$heading" fontSize="$7" color="$text" fontWeight="bold">
              Permisos
            </Text>
            <Text color="$muted" fontSize="$3">Gestiona tus salidas</Text>
          </YStack>
          
          <Button 
            size="$3" 
            backgroundColor="#2563EB" 
            borderRadius="$4" 
            icon={<Plus size={18} color="white"/>}
            onPress={() => handleToggleForm(true)}
            pressStyle={{ opacity: 0.8, scale: 0.95 }}
          >
            Nuevo
          </Button>
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

        {/* FORMULARIO DESLIZANTE (MODAL INFERIOR) */}
        <AnimatePresence>
          {showForm && (
            <>
              {/* Fondo oscuro backdrop */}
              <Animated.View 
                entering={FadeInDown.duration(200)}
                style={{
                  position: "absolute", top: -50, bottom: -50, left: -20, right: -20,
                  backgroundColor: "rgba(0,0,0,0.7)", zIndex: 10
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
                entering={SlideInDown.springify().damping(15)}
                exiting={SlideOutDown.duration(200)}
                style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  backgroundColor: "#0f172a",
                  borderTopLeftRadius: 24, borderTopRightRadius: 24,
                  padding: 24, zIndex: 20,
                  borderTopWidth: 1, borderColor: "#334155"
                }}
              >
                <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
                  <Text fontSize="$5" fontWeight="bold" color="$text">Nueva Solicitud</Text>
                  <Button size="$2" circular unstyled onPress={() => handleToggleForm(false)}>
                    <XCircle color="$muted" />
                  </Button>
                </XStack>

                <YStack gap="$4">
                  <YStack gap="$2">
                    <Label color="$muted" fontSize="$2">MOTIVO</Label>
                    <Input 
                      backgroundColor="#1e293b" 
                      borderColor={formErrors.description ? "$red10" : "transparent"}
                      color="$text" 
                      placeholder="Ej. Cita médica" 
                      value={form.description}
                      onChangeText={(t) => handleChange("description", t)}
                    />
                  </YStack>

                  <XStack gap="$3">
                    <YStack flex={1} gap="$2">
                      <Label color="$muted" fontSize="$2">FECHA</Label>
                      <Input 
                        backgroundColor="#1e293b" 
                        borderColor="transparent"
                        color="$text" 
                        value={form.request_date}
                        onChangeText={(t) => handleChange("request_date", t)}
                      />
                    </YStack>
                    <YStack flex={1} gap="$2">
                      <Label color="$muted" fontSize="$2">HORA</Label>
                      <Input 
                        backgroundColor="#1e293b" 
                        borderColor="transparent"
                        color="$text" 
                        value={form.request_time}
                        onChangeText={(t) => handleChange("request_time", t)}
                      />
                    </YStack>
                  </XStack>

                  <Button 
                    backgroundColor="#2563EB" 
                    height="$5" 
                    marginTop="$2"
                    icon={createMutation.isPending ? <Spinner color="white"/> : undefined}
                    onPress={handleSubmit}
                    disabled={createMutation.isPending}
                  >
                    <Text color="white" fontWeight="bold">Enviar Solicitud</Text>
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