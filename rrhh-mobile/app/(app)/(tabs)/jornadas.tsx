import React, { useMemo, useState } from "react";
import { Screen } from "@/components/ui/Screen";
import { employeeService } from "@/services/employeeService";
import { formatDateLabel, formatHour } from "@/utils/datetime";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { Pressable } from "react-native";
import { 
  Paragraph, 
  Spinner, 
  Text, 
  XStack, 
  YStack, 
  Separator,
  Circle 
} from "tamagui";
import Animated, { FadeInDown, Layout, withSpring, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { 
  Calendar, 
  ChevronDown, 
  Clock, 
  LogIn, 
  LogOut, 
  Coffee, 
  Briefcase 
} from "@tamagui/lucide-icons";

// --- COMPONENTES AUXILIARES ---

// 1. Renglón de la línea de tiempo (El efecto logístico)
const TimelineRow = ({ 
  icon: Icon, 
  label, 
  time, 
  color, 
  isLast = false 
}: { 
  icon: any, 
  label: string, 
  time: string, 
  color: string, 
  isLast?: boolean 
}) => {
  const isPending = time === "--:--";
  
  return (
    <XStack gap="$3" alignItems="flex-start">
      {/* Columna Izquierda: Icono y Línea */}
      <YStack alignItems="center" width={24}>
        <Circle size={28} backgroundColor={isPending ? "$gray5" : color} elevation="$1">
          <Icon size={14} color="white" />
        </Circle>
        {!isLast && (
          <YStack 
            width={2} 
            flex={1} 
            minHeight={20} 
            backgroundColor={isPending ? "$gray5" : color} 
            opacity={0.5} 
            marginVertical="$1"
          />
        )}
      </YStack>

      {/* Columna Derecha: Datos */}
      <YStack paddingBottom={isLast ? 0 : "$3"}>
        <Text color="$text" fontSize="$3" fontWeight="bold" opacity={isPending ? 0.5 : 1}>
          {label}
        </Text>
        <Text fontFamily="$mono" color={isPending ? "$muted" : "$text"} fontSize="$5">
          {time}
        </Text>
      </YStack>
    </XStack>
  );
};

export default function JornadasScreen(): JSX.Element {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["attendance"],
    queryFn: employeeService.getAttendance
  });

  const sessions = useMemo(() => data?.data ?? [], [data?.data]);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      
      <YStack gap="$4" flex={1} paddingTop="$4">
        {/* Cabecera con estilo */}
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
          <YStack>
            <Text fontFamily="$heading" fontSize="$7" color="$text" fontWeight="bold">
              Historial
            </Text>
            <Text color="$muted" fontSize="$3">Registro de actividades</Text>
          </YStack>
          <Calendar color="#2563EB" size={28} opacity={0.8} />
        </XStack>

        {isLoading ? (
          <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
            <Spinner size="large" color="#2563EB" />
            <Text color="$text" opacity={0.7}>Sincronizando datos...</Text>
          </YStack>
        ) : (
          <Animated.FlatList
            data={sessions}
            contentContainerStyle={{ gap: 12, paddingBottom: 100 }}
            keyExtractor={(item) => String(item.session_id)}
            refreshing={isRefetching}
            onRefresh={refetch}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const expanded = expandedId === item.session_id;
              const isFinished = Boolean(item.end_time);
              const isActive = !isFinished;

              return (
                <AnimatedPressableCard
                  index={index}
                  expanded={expanded}
                  onPress={() => setExpandedId(expanded ? null : item.session_id)}
                >
                  {/* --- VISTA RESUMIDA (Tarjeta cerrada) --- */}
                  <XStack justifyContent="space-between" alignItems="center">
                    <XStack gap="$3" alignItems="center">
                      {/* Indicador de Estado Lateral */}
                      <YStack 
                        width={4} 
                        height={40} 
                        borderRadius="$4" 
                        backgroundColor={isActive ? "#22c55e" : "#2563EB"} 
                      />
                      
                      <YStack>
                        <XStack alignItems="center" gap="$2">
                          <Text color="$text" fontSize="$5" fontWeight="bold">
                            {formatDateLabel(item.work_date)}
                          </Text>
                          {isActive && (
                            <YStack 
                              backgroundColor="rgba(34, 197, 94, 0.2)" 
                              paddingHorizontal="$2" 
                              borderRadius="$4"
                            >
                              <Text fontSize={10} color="#4ade80" fontWeight="bold">EN CURSO</Text>
                            </YStack>
                          )}
                        </XStack>
                        
                        <XStack alignItems="center" gap="$2" opacity={0.7}>
                          <Clock size={12} color="$text" />
                          <Paragraph color="$text" fontSize="$3">
                            {formatHour(item.start_time)} - {item.end_time ? formatHour(item.end_time) : "..."}
                          </Paragraph>
                        </XStack>
                      </YStack>
                    </XStack>

                    {/* Flecha de expansión */}
                    <ChevronRotator expanded={expanded} />
                  </XStack>

                  {/* --- VISTA DETALLADA (Cronología) --- */}
                  {expanded && (
                    <Animated.View 
                      entering={FadeInDown.duration(200)} 
                      style={{ marginTop: 16 }}
                    >
                      <Separator borderColor="$gray5" marginBottom="$4" />
                      
                      <YStack paddingLeft="$2">
                        {/* 1. Entrada */}
                        <TimelineRow 
                          icon={LogIn} 
                          label="Entrada de turno" 
                          time={formatHour(item.start_time)} 
                          color="#2563EB" // Azul
                        />
                        
                        {/* 2. Inicio Almuerzo */}
                        <TimelineRow 
                          icon={Coffee} 
                          label="Inicio de almuerzo" 
                          time={formatHour(item.lunch_start)} 
                          color="#f59e0b" // Naranja
                        />
                        
                        {/* 3. Fin Almuerzo */}
                        <TimelineRow 
                          icon={Briefcase} 
                          label="Regreso de almuerzo" 
                          time={formatHour(item.lunch_end)} 
                          color="#8b5cf6" // Violeta
                        />
                        
                        {/* 4. Salida */}
                        <TimelineRow 
                          icon={LogOut} 
                          label="Fin de jornada" 
                          time={formatHour(item.end_time)} 
                          color="#ef4444" // Rojo
                          isLast
                        />
                      </YStack>

                      <XStack justifyContent="flex-end" marginTop="$2">
                        <Text fontSize="$2" opacity={0.3} color="$text">
                          ID: #{item.session_id}
                        </Text>
                      </XStack>
                    </Animated.View>
                  )}
                </AnimatedPressableCard>
              );
            }}
          />
        )}
      </YStack>
    </Screen>
  );
}

// --- ANIMACIONES Y ESTILOS ---

const ChevronRotator = ({ expanded }: { expanded: boolean }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: withTiming(expanded ? "180deg" : "0deg") }],
    };
  });
  return (
    <Animated.View style={animatedStyle}>
      <ChevronDown color="#94a3b8" />
    </Animated.View>
  );
};

interface PressableCardProps {
  children: React.ReactNode;
  index: number;
  expanded: boolean;
  onPress: () => void;
}

const AnimatedPressableCard = ({ children, index, expanded, onPress }: PressableCardProps): JSX.Element => (
  <Animated.View
    entering={FadeInDown.delay(index * 100).springify()}
    layout={Layout.springify()}
    style={{ 
      backgroundColor: "#1e293b", // Gris azulado oscuro (Slate 800)
      borderRadius: 16, 
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: expanded ? "#2563EB" : "rgba(255,255,255,0.05)",
      marginHorizontal: 4
    }}
  >
    <Pressable 
      onPress={onPress} 
      style={({ pressed }) => ({ 
        padding: 16,
        backgroundColor: pressed ? "rgba(255,255,255,0.02)" : "transparent"
      })}
    >
      {children}
    </Pressable>
  </Animated.View>
);