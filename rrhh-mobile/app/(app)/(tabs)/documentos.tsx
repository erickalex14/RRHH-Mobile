import { useCallback, useState } from "react";
import { Linking, Platform } from "react-native"; 
import axios from "axios";
import Animated, { FadeInDown, FadeOutUp, Layout } from "react-native-reanimated";
import * as DocumentPicker from "expo-document-picker";
import { Stack } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Paragraph,
  Spinner,
  Text,
  XStack,
  YStack,
  Button,
  Separator
} from "tamagui";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { Screen } from "@/components/ui/Screen";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { employeeService, DocumentType } from "@/services/employeeService";
import { useConfirm } from "@/hooks/useConfirm";
import { 
  FileText, 
  Trash2, 
  UploadCloud, 
  ShieldCheck, 
  FileBadge, 
  UserSquare, 
  File,
  Download
} from "@tamagui/lucide-icons";

// --- CONFIGURACIÓN VISUAL ---
const typeConfig: Record<DocumentType, { label: string; icon: any }> = {
  cv: { label: "CV / Hoja de Vida", icon: FileText },
  certificate: { label: "Certificado", icon: FileBadge },
  id: { label: "Identificación", icon: UserSquare },
  other: { label: "Otro Documento", icon: File }
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

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

// --- COMPONENTE DE BOTÓN (CHIP) CORREGIDO ---
const TypeChip = ({ type, isSelected, onPress }: { type: DocumentType, isSelected: boolean, onPress: () => void }) => {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Button
      // TAMAÑO GRANDE
      height="$8"
      flexBasis="48%"
      flexGrow={1}
      
      // COLOR: SIEMPRE AZUL SÓLIDO (Sin transparencia)
      backgroundColor="#2563EB"
      
      // SELECCIÓN: Solo por borde blanco grueso
      borderWidth={isSelected ? 3 : 0}
      borderColor={isSelected ? "white" : "transparent"}
      // Un poco de elevación al seleccionado para que resalte
      elevation={isSelected ? "$4" : "$0"}

      onPress={onPress}
      animation="bouncy"
      pressStyle={{ scale: 0.97, opacity: 0.9 }} // Pequeño efecto al pulsar
      paddingHorizontal="$2"
      justifyContent="center"
    >
      <XStack alignItems="center" gap="$3">
        <Icon size={24} color="white" /> 
        <Text 
          color="white" 
          fontSize="$4"
          fontWeight="bold"
        >
          {config.label}
        </Text>
      </XStack>
    </Button>
  );
};

export default function DocumentosScreen(): JSX.Element {
  const [selectedType, setSelectedType] = useState<DocumentType>("cv");
  const [feedback, setFeedback] = useState<{
    variant: "info" | "success" | "error";
    message: string;
  } | null>(null);
  
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["documents"],
    queryFn: employeeService.getDocuments
  });

  const invalidateDocuments = () => queryClient.invalidateQueries({ queryKey: ["documents"] });

  const uploadMutation = useMutation({
    mutationFn: employeeService.uploadDocument,
    onSuccess: (_, variables) => {
      invalidateDocuments();
      setFeedback({
        variant: "success",
        message: `Archivo subido correctamente.`
      });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err) =>
      setFeedback({ variant: "error", message: parseApiError(err, "Error al subir.") })
  });

  const deleteMutation = useMutation({
    mutationFn: employeeService.deleteDocument,
    onSuccess: () => {
      invalidateDocuments();
      setFeedback({ variant: "success", message: "Archivo eliminado." });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err) =>
      setFeedback({ variant: "error", message: parseApiError(err, "Error al eliminar.") })
  });

  const handlePick = async (): Promise<void> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        multiple: false,
        copyToCacheDirectory: true
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];

      if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
        setFeedback({ variant: "error", message: "El archivo supera 5MB." });
        return;
      }

      if (file.mimeType && file.mimeType !== "application/pdf") {
        setFeedback({ variant: "error", message: "Solo se permiten PDF." });
        return;
      }

      uploadMutation.mutate({
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType ?? "application/pdf",
        type: selectedType,
        file: file.file 
      });
    } catch (err) {
      setFeedback({ variant: "error", message: "Error al leer archivo." });
    }
  };

  const confirm = useConfirm();

  const handleDownload = useCallback(async (documentId: number, fileName: string) => {
    try {
      if (Platform.OS === 'web') {
        const blob = await employeeService.downloadDocument(documentId);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
        setFeedback({ variant: "success", message: "Descarga iniciada" });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        const url = employeeService.getDocumentDownloadUrl(documentId);
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          setFeedback({ variant: "error", message: "No se puede abrir el enlace." });
        }
      }
    } catch (err) {
      setFeedback({ variant: "error", message: "Error al descargar." });
    }
  }, []);

  const handleDelete = useCallback(
    async (documentId: number) => {
      const accepted = await confirm({
        title: "Eliminar archivo",
        message: "¿Estás seguro? Esta acción es irreversible.",
        confirmLabel: "Eliminar",
        destructive: true
      });
      if (accepted) deleteMutation.mutate(documentId);
    },
    [confirm, deleteMutation]
  );

  const documents = data?.data ?? [];
  const queryErrorMessage = error ? parseApiError(error, "Error de conexión.") : null;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      
      <YStack gap="$4" flex={1} paddingTop="$4" paddingHorizontal="$1">
        
        {/* CABECERA */}
        <YStack>
          <Text fontFamily="$heading" fontSize="$7" color="$text" fontWeight="bold">
            Expediente Digital
          </Text>
          <XStack alignItems="center" gap="$2" opacity={0.6} marginTop="$1">
            <ShieldCheck size={16} color="$text" />
            <Text color="$text" fontSize="$3">Tus documentos están cifrados y seguros</Text>
          </XStack>
        </YStack>

        {/* FEEDBACK Y ERRORES */}
        {feedback && <AnimatedNotice variant={feedback.variant} message={feedback.message} />}
        {queryErrorMessage && (
          <AnimatedNotice
            variant="error"
            message={queryErrorMessage}
            actionLabel="Reintentar"
            onAction={invalidateDocuments}
          />
        )}

        {/* SELECTOR DE TIPO (Chips Grandes y Uniformes) */}
        <YStack gap="$3">
          <Text fontSize="$3" fontWeight="bold" color="$muted" letterSpacing={1}>
            SELECCIONA TIPO DE DOCUMENTO
          </Text>
          <XStack gap="$3" flexWrap="wrap">
            {(Object.keys(typeConfig) as DocumentType[]).map((type) => (
              <TypeChip
                key={type}
                type={type}
                isSelected={selectedType === type}
                onPress={() => setSelectedType(type)}
              />
            ))}
          </XStack>
        </YStack>

        {/* BOTÓN DE SUBIDA (Igual de grande) */}
        <AnimatedButton
          size="$6"
          height="$8"
          marginTop="$2"
          icon={uploadMutation.isPending ? <Spinner color="$text" /> : <UploadCloud size={32} />}
          onPress={handlePick}
          disabled={uploadMutation.isPending}
          borderRadius="$6"
          borderWidth={1}
          borderColor="rgba(255,255,255,0.2)"
        >
          {uploadMutation.isPending ? "Subiendo..." : "Subir Documento PDF"}
        </AnimatedButton>

        <Separator borderColor="rgba(255,255,255,0.1)" marginVertical="$2" />

        {/* LISTA DE DOCUMENTOS */}
        <YStack flex={1} gap="$3">
          <Text fontSize="$3" fontWeight="bold" color="$muted" letterSpacing={1}>
            ARCHIVOS GUARDADOS ({documents.length})
          </Text>

          {isLoading ? (
            <YStack flex={1} justifyContent="center" alignItems="center">
              <Spinner size="large" color="#2563EB" />
            </YStack>
          ) : documents.length === 0 ? (
            <YStack flex={1} justifyContent="center" alignItems="center" opacity={0.4} gap="$2">
              <FileText size={56} color="$text" />
              <Text color="$text" fontSize="$4">Tu expediente está vacío.</Text>
            </YStack>
          ) : (
            <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {documents.map((doc, index) => {
                const DocIcon = typeConfig[doc.doc_type as DocumentType]?.icon || File;
                const isDeleting = deleteMutation.isPending && deleteMutation.variables === doc.document_id;

                return (
                  <Animated.View
                    key={doc.document_id}
                    entering={FadeInDown.delay(index * 100).springify()}
                    exiting={FadeOutUp}
                    layout={Layout.springify()}
                    style={{ marginBottom: 12 }}
                  >
                    <GlassCard glow={false} px="$4" py="$4" borderRadius="$5">
                      <XStack alignItems="center" gap="$3"> 
                        <XStack gap="$3" alignItems="center" flex={1}>
                          <YStack backgroundColor="rgba(255,255,255,0.06)" padding="$3" borderRadius="$4">
                            <DocIcon size={28} color="#60a5fa" />
                          </YStack>
                          <YStack flex={1}>
                            <Text color="$text" fontWeight="bold" fontSize="$4" numberOfLines={1}>
                              {doc.file_name}
                            </Text>
                            <XStack gap="$2" opacity={0.65} marginTop={4}>
                              <Text color="$text" fontSize="$3" textTransform="uppercase">
                                {typeConfig[doc.doc_type as DocumentType]?.label || "DOC"}
                              </Text>
                              <Text color="$text" fontSize="$3">•</Text>
                              <Text color="$text" fontSize="$3">
                                {(Number(doc.file_size ?? 0) / 1024 / 1024).toFixed(2)} MB
                              </Text>
                            </XStack>
                          </YStack>
                        </XStack>
                        
                        <XStack gap="$2">
                          <Button
                            size="$4" 
                            circular
                            backgroundColor="rgba(37, 99, 235, 0.15)"
                            onPress={() => handleDownload(doc.document_id, doc.file_name)}
                            pressStyle={{ backgroundColor: "rgba(37, 99, 235, 0.3)" }}
                          >
                            <Download size={20} color="#60a5fa" />
                          </Button>

                          <Button
                            size="$4"
                            circular
                            backgroundColor="rgba(239, 68, 68, 0.15)"
                            onPress={() => handleDelete(doc.document_id)}
                            disabled={isDeleting}
                            pressStyle={{ backgroundColor: "rgba(239, 68, 68, 0.3)" }}
                          >
                            {isDeleting ? <Spinner size="small" color="#ef4444" /> : <Trash2 size={20} color="#ef4444" />}
                          </Button>
                        </XStack>
                      </XStack>
                    </GlassCard>
                  </Animated.View>
                );
              })}
            </Animated.ScrollView>
          )}
        </YStack>
      </YStack>
    </Screen>
  );
}