import { useCallback, useMemo, useState } from "react";
import { Linking } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Stack } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Screen } from "@/components/ui/Screen";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { InteractiveCard } from "@/components/ui/InteractiveCard";
import { RoleSwitcher } from "@/components/admin/RoleSwitcher";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import {
  adminService,
  CreateDocumentPayload,
  UpdateDocumentPayload
} from "@/services/adminService";
import { Branch, Department, Document, Role, User } from "@/types/api";
import { DocumentType, documentTypeLabels } from "@/types/documents";
import { useConfirm } from "@/hooks/useConfirm";
import {
  Adapt,
  AnimatePresence,
  Paragraph,
  Spinner,
  ScrollView,
  Select,
  Separator,
  Sheet,
  Text,
  XStack,
  YStack
} from "tamagui";

type DocumentFilters = {
  branchId: string;
  departmentId: string;
  roleId: string;
  employeeId: string;
  docType: DocumentType | "all";
  search: string;
};

type DocumentFormMode = "create" | "edit";

type DocumentFormState = {
  userId: string;
  docType: DocumentType;
  description: string;
  file: DocumentPicker.DocumentPickerAsset | null;
};

type MetaDataResponse = {
  branches: Branch[];
  departments: Department[];
  roles: Role[];
  employees: User[];
};

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string[] | string>;
};

const DOCUMENT_TYPE_OPTIONS = (Object.entries(documentTypeLabels) as [DocumentType, string][]);

const DEFAULT_FILTERS: DocumentFilters = {
  branchId: "all",
  departmentId: "all",
  roleId: "all",
  employeeId: "all",
  docType: "all",
  search: ""
};

const EMPTY_FORM: DocumentFormState = {
  userId: "",
  docType: "other",
  description: "",
  file: null
};

type DocumentFormErrors = Partial<Record<"userId" | "docType" | "file", string>>;

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const isDocumentType = (value?: string | null): value is DocumentType =>
  Boolean(value && Object.keys(documentTypeLabels).includes(value));

const formatDate = (value?: string | null): string => {
  if (!value) return "Sin registro";
  try {
    return format(new Date(value), "dd/MM/yyyy HH:mm");
  } catch (error) {
    return value;
  }
};

const extractErrorMessage = (error: unknown): string => {
  if ((error as AxiosError<ApiErrorResponse>)?.response) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const message = axiosError.response?.data?.message;
    if (message) return message;
    const errors = axiosError.response?.data?.errors;
    if (errors) {
      const firstKey = Object.keys(errors)[0];
      const value = errors[firstKey];
      if (Array.isArray(value)) return value[0];
      if (typeof value === "string") return value;
    }
  }
  return "Ocurrió un error inesperado.";
};

export default function AdminDocumentosScreen(): JSX.Element {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DocumentFilters>(DEFAULT_FILTERS);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isFilterBarOpen, setIsFilterBarOpen] = useState(true);
  const [formMode, setFormMode] = useState<DocumentFormMode>("create");
  const [formState, setFormState] = useState<DocumentFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<DocumentFormErrors>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const invalidateDocuments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin", "documents", "list"] });
  }, [queryClient]);

  const handleFeedback = useCallback((entry: { type: "success" | "error"; message: string }) => {
    setFeedback(entry);
    setTimeout(() => setFeedback(null), 2600);
  }, []);

  const confirm = useConfirm();

  const { data: metaData, isLoading: isMetaLoading, isError: isMetaError } = useQuery<MetaDataResponse>({
    queryKey: ["admin", "documents", "meta"],
    queryFn: async () => {
      const [branchesRes, departmentsRes, rolesRes, usersRes] = await Promise.all([
        adminService.getBranches(),
        adminService.getDepartments(),
        adminService.getRoles(),
        adminService.getUsers()
      ]);
      return {
        branches: branchesRes.data ?? [],
        departments: departmentsRes.data ?? [],
        roles: rolesRes.data ?? [],
        employees: usersRes.data ?? []
      };
    }
  });

  const {
    data: documentData,
    isLoading: isLoadingDocuments,
    isRefetching,
    isError: isDocumentsError,
    refetch: refetchDocuments
  } = useQuery({
    queryKey: ["admin", "documents", "list", filters],
    queryFn: () =>
      adminService.getDocuments({
        branch_id: filters.branchId !== "all" ? filters.branchId : undefined,
        department_id: filters.departmentId !== "all" ? filters.departmentId : undefined,
        role_id: filters.roleId !== "all" ? filters.roleId : undefined,
        employee_id: filters.employeeId !== "all" ? filters.employeeId : undefined,
        doc_type: filters.docType !== "all" ? filters.docType : undefined,
        search: filters.search
      })
  });

  const branches = metaData?.branches ?? [];
  const departments = metaData?.departments ?? [];
  const roles = metaData?.roles ?? [];
  const employees = metaData?.employees ?? [];
  const documents = documentData?.data ?? [];

  const documentInsights = useMemo(() => {
    const total = documents.length;
    const filteredByType =
      filters.docType === "all"
        ? total
        : documents.filter((doc) => doc.doc_type === filters.docType).length;
    let latestTimestamp: number | null = null;
    documents.forEach((doc) => {
      if (!doc.created_at) {
        return;
      }
      const timestamp = Date.parse(doc.created_at);
      if (!Number.isNaN(timestamp) && (latestTimestamp === null || timestamp > latestTimestamp)) {
        latestTimestamp = timestamp;
      }
    });
    return {
      total,
      filteredByType,
      lastUpload: latestTimestamp ? format(new Date(latestTimestamp), "dd/MM/yyyy HH:mm") : "Sin registros"
    };
  }, [documents, filters.docType]);

  const filteredDepartments = useMemo(() => {
    if (filters.branchId === "all") return departments;
    return departments.filter((department) => String(department.branch_id) === filters.branchId);
  }, [departments, filters.branchId]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const detail = employee.employeeDetail;
      const matchesBranch = filters.branchId === "all" ? true : String(detail?.department?.branch_id ?? "") === filters.branchId;
      const matchesDepartment = filters.departmentId === "all" ? true : String(detail?.department_id ?? "") === filters.departmentId;
      const matchesRole = filters.roleId === "all" ? true : String(detail?.role_id ?? "") === filters.roleId;
      return matchesBranch && matchesDepartment && matchesRole;
    });
  }, [employees, filters.branchId, filters.departmentId, filters.roleId]);

  const branchOptions = useMemo(
    () => [{ label: "Todas", value: "all" }, ...branches.map((branch) => ({
      label: branch.name ?? "Sin nombre",
      value: String(branch.branch_id)
    }))],
    [branches]
  );

  const departmentOptions = useMemo(
    () => [{ label: "Todos", value: "all" }, ...filteredDepartments.map((department) => ({
      label: department.name ?? "Sin nombre",
      value: String(department.department_id)
    }))],
    [filteredDepartments]
  );

  const roleOptions = useMemo(
    () => [{ label: "Todos", value: "all" }, ...roles.map((role) => ({
      label: role.name ?? "Sin nombre",
      value: String(role.role_id)
    }))],
    [roles]
  );

  const employeeOptions = useMemo(
    () => [{ label: "Todos", value: "all" }, ...filteredEmployees.map((employee) => ({
      label: `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "Sin nombre",
      value: String(employee.user_id)
    }))],
    [filteredEmployees]
  );

  const documentTypeOptions = useMemo(
    () => [{ label: "Todos", value: "all" }, ...DOCUMENT_TYPE_OPTIONS.map(([value, label]) => ({ label, value }))],
    []
  );

  const activeFilterSummary = useMemo(() => {
    const descriptors: string[] = [];
    if (filters.branchId !== "all") {
      const branchLabel = branchOptions.find((option) => option.value === filters.branchId)?.label;
      descriptors.push(`Sucursal: ${branchLabel ?? filters.branchId}`);
    }
    if (filters.departmentId !== "all") {
      const departmentLabel = departmentOptions.find((option) => option.value === filters.departmentId)?.label;
      descriptors.push(`Departamento: ${departmentLabel ?? filters.departmentId}`);
    }
    if (filters.roleId !== "all") {
      const roleLabel = roleOptions.find((option) => option.value === filters.roleId)?.label;
      descriptors.push(`Rol: ${roleLabel ?? filters.roleId}`);
    }
    if (filters.employeeId !== "all") {
      descriptors.push("Empleado filtrado");
    }
    if (filters.docType !== "all") {
      const typeLabel = documentTypeOptions.find((option) => option.value === filters.docType)?.label;
      descriptors.push(`Tipo: ${typeLabel ?? filters.docType}`);
    }
    if (filters.search.trim()) {
      descriptors.push(`Búsqueda: "${filters.search.trim()}"`);
    }
    return descriptors.length ? `Filtros activos: ${descriptors.join(" · ")}` : "Sin filtros activos";
  }, [branchOptions, departmentOptions, documentTypeOptions, filters, roleOptions]);

  const handleBranchChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      branchId: value,
      departmentId: "all",
      employeeId: "all"
    }));
  }, []);

  const handleDepartmentChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      departmentId: value,
      employeeId: "all"
    }));
  }, []);

  const handleRoleChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      roleId: value,
      employeeId: "all"
    }));
  }, []);

  const handleEmployeeChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      employeeId: value
    }));
  }, []);

  const handleDocTypeChange = useCallback((value: DocumentType | "all") => {
    setFilters((prev) => ({
      ...prev,
      docType: value
    }));
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setFormState(EMPTY_FORM);
    setSelectedDocument(null);
    setFormMode("create");
    setFormErrors({});
  }, []);

  const openCreateForm = useCallback(() => {
    setFormMode("create");
    setFormState(EMPTY_FORM);
    setSheetOpen(true);
  }, []);

  const openEditForm = useCallback((document: Document) => {
    setFormMode("edit");
    setSelectedDocument(document);
    setFormState({
      userId: String(document.user_id),
      docType: isDocumentType(document.doc_type) ? document.doc_type : "other",
      description: document.description ?? "",
      file: null
    });
    setFormErrors({});
    setSheetOpen(true);
  }, []);

  const updateFormState = useCallback(<K extends keyof DocumentFormState>(key: K, value: DocumentFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    if (key === "userId" || key === "docType" || key === "file") {
      setFormErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: DocumentFormErrors = {};
    if (!formState.docType) {
      errors.docType = "Selecciona el tipo";
    }
    if (formMode === "create") {
      if (!formState.userId) {
        errors.userId = "Asigna el documento a un colaborador";
      }
      if (!formState.file) {
        errors.file = "Adjunta el PDF antes de guardar";
      }
    }
    setFormErrors(errors);
    if (Object.keys(errors).length) {
      handleFeedback({ type: "error", message: "Revisa los campos marcados para continuar." });
      return false;
    }
    return true;
  }, [formMode, formState, handleFeedback]);

  const handleFilePick = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: false
      });
      if (result.canceled || !result.assets?.length) {
        return;
      }
      const file = result.assets[0];
      if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
        setFormErrors((prev) => ({ ...prev, file: "El PDF supera el límite de 5MB." }));
        handleFeedback({ type: "error", message: "El archivo es demasiado pesado." });
        return;
      }
      if (file.mimeType && file.mimeType !== "application/pdf") {
        setFormErrors((prev) => ({ ...prev, file: "Solo se aceptan archivos PDF." }));
        handleFeedback({ type: "error", message: "Formato no permitido." });
        return;
      }
      setFormErrors((prev) => ({ ...prev, file: undefined }));
      updateFormState("file", file);
    } catch (error) {
      handleFeedback({ type: "error", message: "No pudimos procesar el archivo seleccionado." });
    }
  }, [handleFeedback, updateFormState]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateDocumentPayload) => adminService.createDocument(payload),
    onSuccess: () => {
      closeSheet();
      invalidateDocuments();
      handleFeedback({ type: "success", message: "Documento registrado" });
    },
    onError: (error: unknown) => {
      handleFeedback({ type: "error", message: extractErrorMessage(error) });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ documentId, payload }: { documentId: number; payload: UpdateDocumentPayload }) =>
      adminService.updateDocument(documentId, payload),
    onSuccess: () => {
      closeSheet();
      invalidateDocuments();
      handleFeedback({ type: "success", message: "Documento actualizado" });
    },
    onError: (error: unknown) => {
      handleFeedback({ type: "error", message: extractErrorMessage(error) });
    }
  });

  const removeMutation = useMutation({
    mutationFn: adminService.deleteDocument,
    onSuccess: () => {
      invalidateDocuments();
      handleFeedback({ type: "success", message: "Documento eliminado" });
    },
    onError: (error: unknown) => {
      handleFeedback({ type: "error", message: extractErrorMessage(error) });
    }
  });

  const confirmDelete = useCallback(
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
      removeMutation.mutate(documentId);
    },
    [confirm, removeMutation]
  );

  const handleDownload = useCallback(async (documentId: number) => {
    const url = adminService.getDocumentDownloadUrl(documentId);
    await Linking.openURL(url);
  }, []);

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const formIsValid = useMemo(() => {
    if (formMode === "create") {
      return Boolean(formState.userId && formState.docType && formState.file);
    }
    return Boolean(formState.docType && selectedDocument);
  }, [formMode, formState.docType, formState.file, formState.userId, selectedDocument]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) {
      return;
    }
    if (formMode === "create" && formState.file) {
      createMutation.mutate({
        userId: Number(formState.userId),
        docType: formState.docType,
        description: formState.description.trim() || undefined,
        file: {
          uri: formState.file.uri,
          name: formState.file.name ?? `document-${Date.now()}.pdf`,
          mimeType: formState.file.mimeType ?? "application/pdf"
        }
      });
      return;
    }
    if (formMode === "edit" && selectedDocument) {
      updateMutation.mutate({
        documentId: selectedDocument.document_id,
        payload: {
          docType: formState.docType,
          description: formState.description.trim() || null
        }
      });
    }
  }, [createMutation, formMode, formState, selectedDocument, updateMutation, validateForm]);

  const helperText = useMemo(() => (
    formMode === "edit"
      ? "Solo puedes ajustar el tipo y las observaciones."
      : "Selecciona un empleado y adjunta el PDF correspondiente."
  ), [formMode]);

  const renderSelect = (
    value: string,
    options: { label: string; value: string }[],
    placeholder: string,
    onValueChange: (value: string) => void,
    disabled?: boolean
  ): JSX.Element => (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger borderColor="$borderColor">
        <Select.Value placeholder={placeholder} />
      </Select.Trigger>
      <Adapt when="sm" platform="touch">
        <Sheet modal dismissOnSnapToBottom>
          <Sheet.Frame>
            <Sheet.ScrollView>
              <Adapt.Contents />
            </Sheet.ScrollView>
          </Sheet.Frame>
          <Sheet.Overlay enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        </Sheet>
      </Adapt>
      <Select.Content>
        <Select.ScrollUpButton />
        <Select.Viewport>
          {options.map((option) => (
            <Select.Item key={option.value} value={option.value}>
              <Select.ItemText>{option.label}</Select.ItemText>
            </Select.Item>
          ))}
        </Select.Viewport>
        <Select.ScrollDownButton />
      </Select.Content>
    </Select>
  );

  const employeeSelectOptions = useMemo(
    () => employees.map((employee) => ({
      label: `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "Sin nombre",
      value: String(employee.user_id)
    })),
    [employees]
  );

  const renderDocumentTypeSelect = (
    value: DocumentType | "all",
    onValueChange: (value: DocumentType | "all") => void,
    placeholder: string
  ): JSX.Element => (
    <Select value={value} onValueChange={(selected) => onValueChange(selected as DocumentType | "all")}>
      <Select.Trigger borderColor="$borderColor">
        <Select.Value placeholder={placeholder} />
      </Select.Trigger>
      <Select.Content>
        <Select.ScrollUpButton />
        <Select.Viewport>
          {documentTypeOptions.map((option) => (
            <Select.Item key={option.value} value={option.value}>
              <Select.ItemText>{option.label}</Select.ItemText>
            </Select.Item>
          ))}
        </Select.Viewport>
        <Select.ScrollDownButton />
      </Select.Content>
    </Select>
  );

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 72 }}>
        <YStack gap="$4">
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$7" color="$text">
              Documentos corporativos
            </Text>
            <Paragraph color="$muted">
              Gestiona cargas y descargas de todos los colaboradores.
            </Paragraph>
          </YStack>

          <RoleSwitcher target="employee" />

          <YStack gap="$3" backgroundColor="$brandBg" p="$4" borderRadius="$6">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontFamily="$heading" fontSize="$5" color="$text">
                Filtros avanzados
              </Text>
              <AnimatedButton backgroundColor="$color4" color="$text" onPress={() => setIsFilterBarOpen((prev) => !prev)}>
                {isFilterBarOpen ? "Ocultar" : "Mostrar"}
              </AnimatedButton>
            </XStack>
            {isFilterBarOpen ? (
              <YStack gap="$3">
                <YStack gap="$1">
                  <Text fontWeight="600" color="$text">
                    Búsqueda
                  </Text>
                  <AnimatedInput
                    placeholder="Nombre de archivo"
                    value={filters.search}
                    onChangeText={handleSearchChange}
                  />
                </YStack>
                <YStack gap="$1">
                  <Text fontWeight="600" color="$text">
                    Sucursal
                  </Text>
                  {renderSelect(filters.branchId, branchOptions, "Todas", handleBranchChange, isMetaLoading)}
                </YStack>
                <YStack gap="$1">
                  <Text fontWeight="600" color="$text">
                    Departamento
                  </Text>
                  {renderSelect(filters.departmentId, departmentOptions, "Todos", handleDepartmentChange, isMetaLoading)}
                </YStack>
                <YStack gap="$1">
                  <Text fontWeight="600" color="$text">
                    Rol
                  </Text>
                  {renderSelect(filters.roleId, roleOptions, "Todos", handleRoleChange, isMetaLoading)}
                </YStack>
                <YStack gap="$1">
                  <Text fontWeight="600" color="$text">
                    Empleado
                  </Text>
                  {renderSelect(filters.employeeId, employeeOptions, "Todos", handleEmployeeChange, isMetaLoading)}
                </YStack>
                <YStack gap="$1">
                  <Text fontWeight="600" color="$text">
                    Tipo de documento
                  </Text>
                  {renderDocumentTypeSelect(filters.docType, handleDocTypeChange, "Todos")}
                </YStack>
                <AnimatedButton backgroundColor="$color4" color="$text" onPress={resetFilters}>
                  Limpiar filtros
                </AnimatedButton>
              </YStack>
            ) : null}
          </YStack>

          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$5" color="$text">
              Estado general
            </Text>
            <Paragraph color="$muted">{activeFilterSummary}</Paragraph>
            <XStack gap="$3" flexWrap="wrap">
              <InteractiveCard flex={1} minWidth={180} backgroundColor="$color2">
                <Text fontSize="$3" color="$muted">Documentos totales</Text>
                <Text fontFamily="$heading" fontSize="$6" color="$text">
                  {documentInsights.total}
                </Text>
              </InteractiveCard>
              <InteractiveCard flex={1} minWidth={180} backgroundColor="$color2">
                <Text fontSize="$3" color="$muted">Coinciden con filtros</Text>
                <Text fontFamily="$heading" fontSize="$6" color="$text">
                  {documentInsights.filteredByType}
                </Text>
              </InteractiveCard>
              <InteractiveCard flex={1} minWidth={180} backgroundColor="$color2">
                <Text fontSize="$3" color="$muted">Última carga registrada</Text>
                <Text fontFamily="$heading" fontSize="$6" color="$text">
                  {documentInsights.lastUpload}
                </Text>
              </InteractiveCard>
            </XStack>
          </YStack>

          {isMetaError ? (
            <AnimatedNotice
              variant="error"
              title="Error de catálogos"
              message="No pudimos cargar sucursales, departamentos o empleados."
              actionLabel="Reintentar"
              onAction={() => void queryClient.invalidateQueries({ queryKey: ["admin", "documents", "meta"] })}
            />
          ) : null}

          <XStack gap="$3">
            <AnimatedButton
              flex={1}
              backgroundColor="$color4"
              color="$text"
              disabled={isLoadingDocuments || isRefetching}
              onPress={() => void refetchDocuments()}
            >
              {isRefetching ? "Sincronizando..." : "Actualizar"}
            </AnimatedButton>
            <AnimatedButton flex={1} onPress={openCreateForm}>
              Nuevo documento
            </AnimatedButton>
          </XStack>

          {isLoadingDocuments || isRefetching ? (
            <ListSkeleton items={4} height={180} />
          ) : isDocumentsError ? (
            <AnimatedNotice
              variant="error"
              title="Error al cargar"
              message="No pudimos cargar los documentos. Intenta nuevamente."
              actionLabel="Reintentar"
              onAction={() => void refetchDocuments()}
            />
          ) : documents.length === 0 ? (
            <AnimatedNotice variant="info" message="No encontramos documentos con los filtros actuales." />
          ) : (
            <Animated.FlatList<Document>
              data={documents}
              keyExtractor={(item) => String(item.document_id)}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <YStack height={16} />}
              renderItem={({ item, index }) => {
                const employeeName = `${item.user?.first_name ?? ""} ${item.user?.last_name ?? ""}`.trim() || "Sin asignar";
                const departmentName = item.user?.employeeDetail?.department?.name ?? "Sin departamento";
                const branchName = item.user?.employeeDetail?.department?.branch?.name ?? "Sin sucursal";
                const roleName = item.user?.employeeDetail?.role?.name ?? "Sin rol";
                const typeLabel = isDocumentType(item.doc_type)
                  ? documentTypeLabels[item.doc_type]
                  : item.doc_type ?? "Sin tipo";
                return (
                  <Animated.View entering={FadeInDown.delay(index * 80)}>
                    <InteractiveCard>
                      <YStack gap="$2">
                        <Text fontWeight="600" fontSize="$5" color="$text">
                          {item.file_name}
                        </Text>
                        <Paragraph color="$muted">Tipo: {typeLabel}</Paragraph>
                        <Paragraph color="$muted">Empleado: {employeeName}</Paragraph>
                        <Paragraph color="$muted">
                          Departamento: {departmentName} · Sucursal: {branchName}
                        </Paragraph>
                        <Paragraph color="$muted">Rol: {roleName}</Paragraph>
                        <Paragraph color="$muted">Registrado: {formatDate(item.created_at)}</Paragraph>
                        {item.description ? (
                          <Paragraph color="$muted">Observaciones: {item.description}</Paragraph>
                        ) : null}
                        <Separator backgroundColor="$color4" />
                        <XStack gap="$2">
                          <AnimatedButton flex={1} backgroundColor="$color4" color="$text" onPress={() => handleDownload(item.document_id)}>
                            Descargar
                          </AnimatedButton>
                          <AnimatedButton flex={1} backgroundColor="$brandPrimary" color="$text" onPress={() => openEditForm(item)}>
                            Editar
                          </AnimatedButton>
                          <AnimatedButton
                            flex={1}
                            backgroundColor="$danger"
                            color="#fff"
                            disabled={removeMutation.isPending && removeMutation.variables === item.document_id}
                            onPress={() => confirmDelete(item.document_id)}
                          >
                            {removeMutation.isPending && removeMutation.variables === item.document_id ? (
                              <Spinner color="$text" size="small" />
                            ) : (
                              "Eliminar"
                            )}
                          </AnimatedButton>
                        </XStack>
                      </YStack>
                    </InteractiveCard>
                  </Animated.View>
                );
              }}
            />
          )}

          <Sheet
            modal
            open={sheetOpen}
            onOpenChange={(open: boolean) => (open ? setSheetOpen(open) : closeSheet())}
            snapPoints={[80]}
          >
            <Sheet.Overlay enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
            <Sheet.Frame padding="$4" backgroundColor="$color2">
              <Sheet.ScrollView>
                <YStack gap="$3">
                  <Text fontFamily="$heading" fontSize="$5" color="$text">
                    {formMode === "edit" ? "Editar documento" : "Nuevo documento"}
                  </Text>
                  <Paragraph color="$muted">{helperText}</Paragraph>

                  {formMode === "create" ? (
                    <YStack gap="$1">
                      <Text fontWeight="600" color="$text">
                        Empleado
                      </Text>
                      {renderSelect(
                        formState.userId,
                        [{ label: "Selecciona", value: "" }, ...employeeSelectOptions],
                        "Selecciona",
                        (value) => updateFormState("userId", value)
                      )}
                      {formErrors.userId ? (
                        <Paragraph color="$danger" fontSize={12}>{formErrors.userId}</Paragraph>
                      ) : null}
                    </YStack>
                  ) : (
                    <YStack gap="$1">
                      <Text fontWeight="600" color="$text">
                        Empleado
                      </Text>
                      <Paragraph color="$muted">
                        {`${selectedDocument?.user?.first_name ?? ""} ${selectedDocument?.user?.last_name ?? ""}`.trim() || "Sin asignar"}
                      </Paragraph>
                    </YStack>
                  )}

                  <YStack gap="$1">
                    <Text fontWeight="600" color="$text">
                      Tipo de documento
                    </Text>
                    <Select value={formState.docType} onValueChange={(value) => updateFormState("docType", value as DocumentType)}>
                      <Select.Trigger borderColor="$borderColor">
                        <Select.Value placeholder="Selecciona" />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.ScrollUpButton />
                        <Select.Viewport>
                          {DOCUMENT_TYPE_OPTIONS.map(([value, label]) => (
                            <Select.Item key={value} value={value}>
                              <Select.ItemText>{label}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                        <Select.ScrollDownButton />
                      </Select.Content>
                    </Select>
                    {formErrors.docType ? (
                      <Paragraph color="$danger" fontSize={12}>{formErrors.docType}</Paragraph>
                    ) : null}
                  </YStack>

                  <AnimatedInput
                    label="Observaciones"
                    placeholder="Opcional"
                    value={formState.description}
                    onChangeText={(value) => setFormState((prev) => ({ ...prev, description: value }))}
                  />

                  {formMode === "create" ? (
                    <YStack gap="$2">
                      <AnimatedButton onPress={handleFilePick} backgroundColor="$color4" color="$text">
                        {formState.file ? "Reemplazar archivo" : "Seleccionar PDF"}
                      </AnimatedButton>
                      <Paragraph color={formErrors.file ? "$danger" : "$muted"}>
                        {formErrors.file
                          ? formErrors.file
                          : formState.file
                            ? `${formState.file.name} · ${((formState.file.size ?? 0) / 1024 / 1024).toFixed(2)} MB`
                            : "PDF requerido (máx. 5MB)"}
                      </Paragraph>
                    </YStack>
                  ) : null}

                  <XStack gap="$3" mt="$2">
                    <AnimatedButton flex={1} backgroundColor="$color4" color="$text" disabled={isMutating} onPress={closeSheet}>
                      Cancelar
                    </AnimatedButton>
                    <AnimatedButton flex={1} disabled={!formIsValid || isMutating} onPress={handleSubmit}>
                      {formMode === "edit" ? "Guardar" : "Registrar"}
                    </AnimatedButton>
                  </XStack>
                </YStack>
              </Sheet.ScrollView>
            </Sheet.Frame>
          </Sheet>

          <AnimatePresence>
            {feedback ? (
              <AnimatedNotice
                variant={feedback.type}
                message={feedback.message}
                actionLabel="Cerrar"
                onAction={() => setFeedback(null)}
              />
            ) : null}
          </AnimatePresence>
        </YStack>
      </ScrollView>
    </Screen>
  );
}

