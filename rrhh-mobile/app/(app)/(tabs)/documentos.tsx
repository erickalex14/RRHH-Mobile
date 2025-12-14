import { useCallback, useState } from "react";
import axios from "axios";
import Animated, { FadeInDown, FadeOutUp, Layout } from "react-native-reanimated";
import * as DocumentPicker from "expo-document-picker";
import { Stack } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Paragraph,
  SizableText,
  Spinner,
  Text,
  XStack,
  YStack
} from "tamagui";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { Screen } from "@/components/ui/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { employeeService, DocumentType } from "@/services/employeeService";
import { useConfirm } from "@/hooks/useConfirm";

const typeLabels: Record<DocumentType, string> = {
  cv: "CV",
  certificate: "Certificado",
  id: "Identificación",
  other: "Otro"
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

export default function DocumentosScreen(): JSX.Element {
  const [selectedType, setSelectedType] = useState<DocumentType>("other");
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
        message: `Documento (${typeLabels[variables.type]}) cargado correctamente.`
      });
    },
    onError: (err) =>
      setFeedback({ variant: "error", message: parseApiError(err, "No pudimos subir el documento.") })
  });

  const deleteMutation = useMutation({
    mutationFn: employeeService.deleteDocument,
    onSuccess: () => {
      invalidateDocuments();
      setFeedback({ variant: "success", message: "Documento eliminado." });
    },
    onError: (err) =>
      setFeedback({ variant: "error", message: parseApiError(err, "No pudimos eliminar el documento.") })
  });

  const handlePick = async (): Promise<void> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        multiple: false,
        copyToCacheDirectory: true
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const file = result.assets[0];

      if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
        setFeedback({ variant: "error", message: "El archivo supera el límite de 5MB." });
        return;
      }

      if (file.mimeType && file.mimeType !== "application/pdf") {
        setFeedback({ variant: "error", message: "Solo se permiten archivos PDF." });
        return;
      }

      uploadMutation.mutate({
        uri: file.uri,
        name: file.name ?? `document-${Date.now()}.pdf`,
        mimeType: file.mimeType ?? "application/pdf",
        type: selectedType
      });
    } catch (err) {
      setFeedback({ variant: "error", message: "No pudimos leer el archivo seleccionado." });
    }
  };

  const confirm = useConfirm();

  const handleDelete = useCallback(
    async (documentId: number) => {
      const accepted = await confirm({
        title: "Eliminar documento",
        message: "Esta acción no se puede deshacer.",
        confirmLabel: "Eliminar",
        destructive: true
      });
      if (!accepted) {
        return;
      }
      deleteMutation.mutate(documentId);
    },
    [confirm, deleteMutation]
  );

  const documents = data?.data ?? [];
  const queryErrorMessage = error ? parseApiError(error, "No pudimos cargar tus documentos.") : null;
  const isDeletingDoc = (documentId: number): boolean =>
    deleteMutation.isPending && deleteMutation.variables === documentId;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <YStack gap="$4" flex={1}>
        <Text fontFamily="$heading" fontSize="$6" color="$text">
          Documentos personales
        </Text>
        <Paragraph color="$text" opacity={0.7}>
          Sube archivos PDF (máx. 5MB). Tus documentos quedan cifrados en el backend.
        </Paragraph>

        {feedback ? <AnimatedNotice variant={feedback.variant} message={feedback.message} /> : null}
        {queryErrorMessage ? (
          <AnimatedNotice
            variant="error"
            message={queryErrorMessage}
            actionLabel="Reintentar"
            onAction={invalidateDocuments}
          />
        ) : null}

        <XStack gap="$2">
          {Object.entries(typeLabels).map(([type, label]) => (
            <AnimatedButton
              key={type}
              flex={1}
              backgroundColor={selectedType === type ? "$brandPrimary" : "$muted"}
              onPress={() => setSelectedType(type as DocumentType)}
            >
              {label}
            </AnimatedButton>
          ))}
        </XStack>

        <AnimatedButton
          backgroundColor="$success"
          onPress={handlePick}
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? <Spinner color="$text" /> : "Seleccionar PDF"}
        </AnimatedButton>

        {uploadMutation.isPending ? (
          <Animated.View
            entering={FadeInDown}
            style={{ backgroundColor: "rgba(37,99,235,0.2)", borderRadius: 16, padding: 12 }}
          >
            <Text color="$text">Subiendo documento...</Text>
          </Animated.View>
        ) : null}

        <YStack gap="$3" flex={1}>
          {isLoading ? (
            <YStack gap="$2">
              {[...Array(4)].map((_, index) => (
                <Skeleton key={index} height={64} />
              ))}
            </YStack>
          ) : documents.length ? (
            documents.map((doc) => (
              <Animated.View
                key={doc.document_id}
                entering={FadeInDown}
                exiting={FadeOutUp}
                layout={Layout.springify()}
                style={{ backgroundColor: "#0f172a", padding: 16, borderRadius: 24 }}
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack>
                    <Text color="$text" fontSize="$4">
                      {doc.file_name}
                    </Text>
                    <SizableText size="$2" color="$text" opacity={0.6}>
                      {doc.doc_type.toUpperCase()} · {(
                        Number(doc.file_size ?? 0) / 1024 / 1024
                      ).toFixed(2)} MB
                    </SizableText>
                  </YStack>
                  <AnimatedButton
                    backgroundColor="$danger"
                    size="$3"
                    disabled={isDeletingDoc(doc.document_id)}
                    onPress={() => handleDelete(doc.document_id)}
                  >
                    {isDeletingDoc(doc.document_id) ? (
                      <Spinner color="$text" size="small" />
                    ) : (
                      "Eliminar"
                    )}
                  </AnimatedButton>
                </XStack>
              </Animated.View>
            ))
          ) : (
            <AnimatedNotice
              variant="info"
              title="Sin documentos todavía"
              message="Sube tu primera constancia para tenerla siempre a mano."
              actionLabel="Subir PDF"
              onAction={handlePick}
            />
          )}
        </YStack>
      </YStack>
    </Screen>
  );
}

