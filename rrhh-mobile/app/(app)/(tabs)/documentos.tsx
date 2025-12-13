import { Screen } from "@/components/ui/Screen";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { employeeService, DocumentType } from "@/services/employeeService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { Stack } from "expo-router";
import { useState } from "react";
import {
  Paragraph,
  SizableText,
  Spinner,
  Text,
  XStack,
  YStack
} from "tamagui";
import Animated, { FadeInDown, FadeOutUp, Layout } from "react-native-reanimated";

const typeLabels: Record<DocumentType, string> = {
  cv: "CV",
  certificate: "Certificado",
  id: "Identificación",
  other: "Otro"
};

export default function DocumentosScreen(): JSX.Element {
  const [selectedType, setSelectedType] = useState<DocumentType>("other");
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: employeeService.getDocuments
  });

  const invalidateDocuments = () => queryClient.invalidateQueries({ queryKey: ["documents"] });

  const uploadMutation = useMutation({
    mutationFn: employeeService.uploadDocument,
    onSuccess: invalidateDocuments
  });

  const deleteMutation = useMutation({
    mutationFn: employeeService.deleteDocument,
    onSuccess: invalidateDocuments
  });

  const handlePick = async (): Promise<void> => {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
    if (result.canceled || !result.assets?.length) return;
    const file = result.assets[0];
    uploadMutation.mutate({
      uri: file.uri,
      name: file.name ?? `document-${Date.now()}.pdf`,
      mimeType: file.mimeType ?? "application/pdf",
      type: selectedType
    });
  };

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

        <XStack gap="$2">
          {Object.entries(typeLabels).map(([type, label]) => (
            <AnimatedButton
              key={type}
              flex={1}
              bg={selectedType === type ? "$brandPrimary" : "$muted"}
              onPress={() => setSelectedType(type as DocumentType)}
            >
              {label}
            </AnimatedButton>
          ))}
        </XStack>

        <AnimatedButton
          bg="$success"
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
          ) : (
            data?.data?.map((doc) => (
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
                    bg="$danger"
                    size="$3"
                    onPress={() => deleteMutation.mutate(doc.document_id)}
                  >
                    {deleteMutation.isPending && deleteMutation.variables === doc.document_id ? (
                      <Spinner color="$text" size="small" />
                    ) : (
                      "Eliminar"
                    )}
                  </AnimatedButton>
                </XStack>
              </Animated.View>
            ))
          )}
        </YStack>
      </YStack>
    </Screen>
  );
}
