import { useCallback, useMemo, useState } from "react";
import { Linking, Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent
} from "@react-native-community/datetimepicker";
import { Stack } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { Screen } from "@/components/ui/Screen";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { InteractiveCard } from "@/components/ui/InteractiveCard";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { AnimatedNotice } from "@/components/ui/AnimatedNotice";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { HybridSelect } from "@/components/ui/HybridSelect";
import {
  adminService,
  CreateDocumentPayload,
  UpdateDocumentPayload
} from "@/services/adminService";
import { Branch, Department, Document, Role, User } from "@/types/api";
import { DocumentType, documentTypeLabels } from "@/types/documents";
import { useConfirm } from "@/hooks/useConfirm";
import { LinearGradient } from "expo-linear-gradient";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
  FileText, 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  Edit3, 
  Plus, 
  RefreshCw, 
  Upload,
  Calendar,
  XCircle
} from "@tamagui/lucide-icons";
import {
  AnimatePresence,
  Paragraph,
  Spinner,
  ScrollView,
  Separator,
  Sheet,
  Text,
  XStack,
  YStack,
  H2,
  Button,
  Input
} from "tamagui";

type DocumentFilters = {
  branchId: string;
  departmentId: string;
  roleId: string;
  employeeId: string;
  docType: DocumentType | "all";
  search: string;
  dateFrom: string;
  dateTo: string;
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
  search: "",
  dateFrom: format(addDays(new Date(), -30), "yyyy-MM-dd"),
  dateTo: format(new Date(), "yyyy-MM-dd")
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
  const [datePicker, setDatePicker] = useState<{ field: "dateFrom" | "dateTo" | null; visible: boolean }>({
    field: null,
    visible: false
  });

  const invalidateDocuments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin", "documents", "list"] });
  }, [queryClient]);

  const handleFeedback = useCallback((entry: { type: "success" | "error"; message: string }) => {
    setFeedback(entry);
    setTimeout(() => setFeedback(null), 2600);
  }, []);

  const toDateValue = useCallback((value: string): Date => {
    const [year, month, day] = value.split("-").map(Number);
    if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
      return new Date(year, (month as number) - 1, day);
    }
    return new Date();
  }, []);

  const handleDateChange = useCallback((field: "dateFrom" | "dateTo", date: Date) => {
    setFilters((prev) => ({ ...prev, [field]: format(date, "yyyy-MM-dd") }));
    if (Platform.OS === "ios") {
      setDatePicker({ field: null, visible: false });
    }
  }, []);

  const openDatePicker = useCallback((field: "dateFrom" | "dateTo") => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        mode: "date",
        value: toDateValue(filters[field]),
        onChange: (_event: DateTimePickerEvent, selectedDate?: Date) => {
          if (selectedDate) {
            handleDateChange(field, selectedDate);
          }
        }
      });
      return;
    }
    setDatePicker({ field, visible: true });
  }, [filters, handleDateChange, toDateValue]);

  const closeIOSPicker = useCallback(() => {
    setDatePicker({ field: null, visible: false });
  }, []);

  const renderIOSPicker = (): JSX.Element | null => {
    if (Platform.OS !== "ios" || !datePicker.visible || !datePicker.field) {
      return null;
    }
    const activeField = datePicker.field;
    return (
      <YStack gap="$2" backgroundColor="$color2" p="$3" borderRadius="$5">
        <Text fontFamily="$heading" fontWeight="600" color="$text">
          Selecciona {activeField === "dateFrom" ? "fecha inicial" : "fecha final"}
        </Text>
        <DateTimePicker
          value={toDateValue(filters[activeField])}
          mode="date"
          display="spinner"
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            if (event.type === "dismissed") return;
            if (selectedDate) {
              handleDateChange(activeField, selectedDate);
            }
          }}
        />
        <AnimatedButton onPress={closeIOSPicker}>Cerrar</AnimatedButton>
      </YStack>
    );
  };

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
        search: filters.search,
        date_from: filters.dateFrom,
        date_to: filters.dateTo
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

  const handleDownload = useCallback(async (documentId: number, fileName: string) => { 
    try {
      if (Platform.OS === 'web') {
        // En web usamos blob y createObjectURL para pasar el token de auth
        const blob = await adminService.downloadDocument(documentId);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // En nativo por ahora usamos Linking (requerirá manejo de token en backend o signed URL)
        // TODO: Implementar expo-file-system para soporte completo en nativo con auth
        const url = adminService.getDocumentDownloadUrl(documentId);
        await Linking.openURL(url);
      }
    } catch (error) {
       console.error("Error downloading", error);
       alert("Error al descargar el archivo");
    }
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
          mimeType: formState.file.mimeType ?? "application/pdf",
          file: formState.file.file
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
    <HybridSelect
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      disabled={disabled}
    />
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
    <HybridSelect
      options={documentTypeOptions}
      value={value}
      onValueChange={(selected) => onValueChange(selected as DocumentType | "all")}
      placeholder={placeholder}
    />
  );

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <YStack gap="$4" pt="$safe" px="$0">
          
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center" mb="$2">
             <YStack>
                <H2 fontFamily="$heading" fontWeight="800" fontSize={26} color="$color">Documentos</H2>
                <Paragraph color="$color" opacity={0.6}>Gestión de archivos firmados</Paragraph>
             </YStack>
             
             <XStack gap="$2">
                <Button 
                    size="$3" 
                    circular 
                    icon={RefreshCw} 
                    chromeless 
                    onPress={() => void refetchDocuments()}
                 />
                 <Button 
                    size="$3" 
                    circular 
                    icon={Plus} 
                    backgroundColor="$green10" 
                    color="white"
                    onPress={openCreateForm}
                 />
             </XStack>
          </XStack>

          {/* Stats Cards */}
           <XStack gap="$3" flexWrap="wrap">
              <GlassCard flex={1} minWidth={100} p="$3" borderRadius="$4">
                <Text fontFamily="$heading" fontSize="$2" color="$color" opacity={0.6} mb="$1">TOTAL</Text>
                <Text fontFamily="$heading" fontWeight="800" fontSize="$6" color="$green10">
                  {documentInsights.total}
                </Text>
              </GlassCard>
              <GlassCard flex={1} minWidth={100} p="$3" borderRadius="$4">
                <Text fontFamily="$heading" fontSize="$2" color="$color" opacity={0.6} mb="$1">FILTRADOS</Text>
                <Text fontFamily="$heading" fontWeight="800" fontSize="$6" color="$blue10">
                  {documentInsights.filteredByType}
                </Text>
              </GlassCard>
            </XStack>

          
          {/* Filters Block */}
          <YStack gap="$2">
            
             {/* Search Bar */}
            <XStack 
                bg="$background" 
                borderRadius="$6" 
                height={50} 
                alignItems="center" 
                px="$4" 
                borderWidth={1}
                borderColor="$borderColor"
            >
                <Search size={20} color="$color" opacity={0.5} />
                <Input 
                    flex={1} 
                    borderWidth={0} 
                    backgroundColor="transparent" 
                    placeholder="Buscar documento..." 
                    placeholderTextColor="$color"
                    opacity={0.8}
                    value={filters.search}
                    onChangeText={(text) => setFilters((prev) => ({ ...prev, search: text }))}
                />
            </XStack>

            <GlassCard gap="$3" p="$4" borderRadius="$6">
                <XStack justifyContent="space-between" alignItems="center" onPress={() => setIsFilterBarOpen((prev) => !prev)}>
                <XStack gap="$2" alignItems="center">
                    <Filter size={18} color="$color" />
                    <Text fontFamily="$heading" fontWeight="700" fontSize="$4" color="$text">
                        Filtros
                    </Text>
                </XStack>
                <Text fontFamily="$heading" color="$blue10" fontSize="$3">{isFilterBarOpen ? "Ocultar" : "Mostrar"}</Text>
                </XStack>
                
                {isFilterBarOpen ? (
                <YStack gap="$3" pt="$3">
                     <YStack gap="$1">
                        <Text fontFamily="$heading" fontSize="$3" color="$color" opacity={0.7}>Tipo de documento</Text>
                        {renderDocumentTypeSelect(filters.docType, handleDocTypeChange, "Todos")}
                    </YStack>
                    
                    <XStack gap="$3" flexWrap="wrap">
                      <YStack flex={1} minWidth={150} gap="$1">
                        <Text fontFamily="$heading" fontSize="$3" fontWeight="600" color="$color" opacity={0.7}>Desde</Text>
                        <Button
                          variant="outlined"
                          size="$3"
                          borderColor="$borderColor"
                          color="$color"
                          icon={Calendar}
                          onPress={() => openDatePicker("dateFrom")}
                        >
                          {filters.dateFrom}
                        </Button>
                      </YStack>
                      <YStack flex={1} minWidth={150} gap="$1">
                        <Text fontFamily="$heading" fontSize="$3" fontWeight="600" color="$color" opacity={0.7}>Hasta</Text>
                        <Button
                          variant="outlined"
                          size="$3"
                          borderColor="$borderColor"
                          color="$color"
                          icon={Calendar}
                          onPress={() => openDatePicker("dateTo")}
                        >
                          {filters.dateTo}
                        </Button>
                      </YStack>
                    </XStack>
                    
                    {renderIOSPicker()}

                    <YStack gap="$1">
                         <Text fontFamily="$heading" fontSize="$3" color="$color" opacity={0.7}>Sucursal</Text>
                         {renderSelect(filters.branchId, branchOptions, "Todas", handleBranchChange, isMetaLoading)}
                    </YStack>
                    <YStack gap="$1">
                        <Text fontFamily="$heading" fontSize="$3" color="$color" opacity={0.7}>Departamento</Text>
                        {renderSelect(filters.departmentId, departmentOptions, "Todos", handleDepartmentChange, isMetaLoading)}
                    </YStack>
                     <YStack gap="$1">
                        <Text fontFamily="$heading" fontSize="$3" color="$color" opacity={0.7}>Rol</Text>
                        {renderSelect(filters.roleId, roleOptions, "Todos", handleRoleChange, isMetaLoading)}
                    </YStack>
                    <YStack gap="$1">
                        <Text fontFamily="$heading" fontSize="$3" color="$color" opacity={0.7}>Empleado</Text>
                        {renderSelect(filters.employeeId, employeeSelectOptions, "Todos", handleEmployeeChange, isMetaLoading)}
                    </YStack>
                    
                    <AnimatedButton
                      size="$6"
                      paddingVertical="$3"
                      paddingHorizontal="$5"
                      backgroundColor="linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)"
                      color="white"
                      borderRadius="$8"
                      icon={<XCircle color="white" />}
                      onPress={resetFilters}
                    />
                </YStack>
                ) : null}
            </GlassCard>
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
             <YStack gap="$3">
               {documents.map((item, index) => {
                const employeeName = `${item.user?.first_name ?? ""} ${item.user?.last_name ?? ""}`.trim() || "Sin asignar";
                const departmentName = item.user?.employeeDetail?.department?.name ?? "Sin departamento";
                const branchName = item.user?.employeeDetail?.department?.branch?.name ?? "Sin sucursal";
                const roleName = item.user?.employeeDetail?.role?.name ?? "Sin rol";
                const typeLabel = isDocumentType(item.doc_type)
                  ? documentTypeLabels[item.doc_type]
                  : item.doc_type ?? "Sin tipo";

                return (
                  <Animated.View key={item.document_id} entering={FadeInDown.delay(index * 50).springify()}>
                     <GlassCard p="$4" gap="$3">
                        <XStack gap="$3" alignItems="center">
                             <GlassCard p="$3" borderRadius="$4" backgroundColor="$backgroundPress">
                                <FileText size={24} color="$blue10" />
                             </GlassCard>
                             <YStack flex={1}>
                                <Text fontFamily="$heading" fontWeight="700" fontSize="$5" color="$color">{item.file_name}</Text>
                                <Paragraph color="$color" opacity={0.6} numberOfLines={1}>{typeLabel}</Paragraph>
                             </YStack>
                        </XStack>
                        
                        <Separator borderColor="$borderColor" opacity={0.5} />

                        <YStack gap="$2" px="$1">
                            <XStack justifyContent="space-between">
                                <Text fontFamily="$heading" fontSize="$3" color="$color" opacity={0.6}>Empleado:</Text>
                                <Text fontFamily="$heading" fontSize="$3" color="$color" fontWeight="600">{employeeName}</Text>
                            </XStack>
                             <XStack justifyContent="space-between">
                                <Text fontFamily="$heading" fontSize="$3" color="$color" opacity={0.6}>Fecha:</Text>
                                <Text fontFamily="$heading" fontSize="$3" color="$color" fontWeight="600">{formatDate(item.created_at)}</Text>
                            </XStack>
                        </YStack>

                        <XStack gap="$3" mt="$2">
                          <AnimatedButton
                            flex={1}
                            size="$6"
                            paddingVertical="$3"
                            paddingHorizontal="$5"
                            backgroundColor="rgba(255,255,255,0.10)"
                            color="$text"
                            borderRadius="$8"
                            icon={<Download color="$blue10" />}
                            onPress={() => handleDownload(item.document_id)}
                          >
                            Descargar
                          </AnimatedButton>
                          <AnimatedButton
                            flex={1}
                            size="$6"
                            paddingVertical="$3"
                            paddingHorizontal="$5"
                            backgroundColor="linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)"
                            color="white"
                            borderRadius="$8"
                            icon={<Edit3 color="white" />}
                            onPress={() => openEditForm(item)}
                          >
                            Editar
                          </AnimatedButton>
                          <AnimatedButton
                            flex={1}
                            size="$6"
                            paddingVertical="$3"
                            paddingHorizontal="$5"
                            backgroundColor="linear-gradient(90deg, #ef4444 0%, #f87171 100%)"
                            color="white"
                            borderRadius="$8"
                            icon={<Trash2 color="white" />}
                            disabled={removeMutation.isPending && removeMutation.variables === item.document_id}
                            onPress={() => confirmDelete(item.document_id)}
                          >
                            {removeMutation.isPending && removeMutation.variables === item.document_id ? (
                              <Spinner color="white" size="small" />
                            ) : "Eliminar"}
                          </AnimatedButton>
                        </XStack>
                        <LinearGradient
                            colors={["transparent", "$green2"]}
                            start={[1, 0]}
                            end={[0, 1]}
                            style={{ position: 'absolute', right: 0, top: 0, width: 100, height: 100, opacity: 0.1, borderRadius: 50 }}
                        />
                     </GlassCard>
                  </Animated.View>
                );
               })}
             </YStack>
          )}

          <Sheet
            modal
            open={sheetOpen}
            onOpenChange={(open: boolean) => (open ? setSheetOpen(open) : closeSheet())}
            snapPoints={[85]}
            dismissOnSnapToBottom
          >
            <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
            <Sheet.Frame padding="$4" backgroundColor="$background">
              <Sheet.Handle bg="$borderColor" />
              <Sheet.ScrollView showsVerticalScrollIndicator={false}>
                <YStack gap="$4" pb="$8">
                  <H2 fontSize={22} color="$color">
                    {formMode === "edit" ? "Editar documento" : "Nuevo documento"}
                  </H2>
                  <Paragraph color="$color" opacity={0.6}>{helperText}</Paragraph>

                  {formMode === "create" ? (
                    <YStack gap="$2">
                      <Text fontWeight="600" color="$color">
                        Empleado
                      </Text>
                      {renderSelect(
                        formState.userId,
                        [{ label: "Selecciona", value: "" }, ...employeeSelectOptions],
                        "Selecciona",
                        (value) => updateFormState("userId", value)
                      )}
                      {formErrors.userId ? (
                        <Paragraph color="$red10" fontSize={12}>{formErrors.userId}</Paragraph>
                      ) : null}
                    </YStack>
                  ) : (
                    <YStack gap="$2">
                      <Text fontWeight="600" color="$color">
                        Empleado
                      </Text>
                      <Paragraph color="$color" opacity={0.8}>
                        {`${selectedDocument?.user?.first_name ?? ""} ${selectedDocument?.user?.last_name ?? ""}`.trim() || "Sin asignar"}
                      </Paragraph>
                    </YStack>
                  )}

                  <YStack gap="$2">
                    <Text fontWeight="600" color="$color">
                      Tipo de documento
                    </Text>
                    <HybridSelect
                      options={DOCUMENT_TYPE_OPTIONS.map(([value, label]) => ({ label, value }))}
                      value={formState.docType}
                      onValueChange={(value) => updateFormState("docType", value as DocumentType)}
                      placeholder="Selecciona"
                    />
                    {formErrors.docType ? (
                      <Paragraph color="$red10" fontSize={12}>{formErrors.docType}</Paragraph>
                    ) : null}
                  </YStack>

                  <YStack gap="$2">
                    <Text fontWeight="600" color="$color">Observaciones</Text>
                    <Input
                        placeholder="Opcional"
                        backgroundColor="$backgroundPress"
                        borderColor="$borderColor"
                        value={formState.description}
                        onChangeText={(value) => setFormState((prev) => ({ ...prev, description: value }))}
                    />
                  </YStack>

                  {formMode === "create" ? (
                    <YStack gap="$2">
                      <Button 
                        icon={Upload} 
                        onPress={handleFilePick} 
                        backgroundColor="$backgroundPress" 
                        color="$color"
                        borderColor="$borderColor"
                        borderWidth={1}
                        borderStyle="dashed"
                        height={60}
                      >
                        {formState.file ? "Reemplazar archivo" : "Seleccionar PDF"}
                      </Button>
                      <Paragraph color={formErrors.file ? "$red10" : "$muted"}>
                        {formErrors.file
                          ? formErrors.file
                          : formState.file
                            ? `${formState.file.name} · ${((formState.file.size ?? 0) / 1024 / 1024).toFixed(2)} MB`
                            : "PDF requerido (máx. 5MB)"}
                      </Paragraph>
                    </YStack>
                  ) : null}

                  <XStack gap="$3" mt="$4">
                    <Button flex={1} chromeless color="$color" disabled={isMutating} onPress={closeSheet}>
                      Cancelar
                    </Button>
                    <Button flex={1} backgroundColor="$blue10" color="white" disabled={!formIsValid || isMutating} onPress={handleSubmit}>
                      {formMode === "edit" ? "Guardar cambios" : "Registrar documento"}
                    </Button>
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
      <AdminNavbar />
    </Screen>
  );
}

