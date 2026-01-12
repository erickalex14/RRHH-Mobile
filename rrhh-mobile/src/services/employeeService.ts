import { Platform } from "react-native";
import { api } from "@/services/http";
import {
  ApiResponse,
  Document,
  EarlyDepartureRequest,
  EarlyDepartureStatus,
  User,
  WorkSession
} from "@/types/api";
import type { DocumentType } from "@/types/documents";

export interface AttendanceResponse extends ApiResponse<WorkSession[]> {}

export interface EarlyDeparturePayload {
  description: string;
  request_date: string;
  request_time: string;
  document_path?: string | null;
}

export interface ProfileUpdatePayload {
  email?: string;
  address?: string | null;
  phone?: string | null;
}

//SERVICIO DE EMPLEADO QUE PROPORCIONA FUNCIONES PARA GESTIONAR LA ASISTENCIA, DOCUMENTOS, SOLICITUDES DE SALIDA ANTICIPADA Y PERFIL DEL EMPLEADO.


const sanitizeBaseUrl = (): string => {
  const base = api.defaults.baseURL ?? "";
  return base.endsWith("/") ? base.slice(0, -1) : base;
};

//FUNCIONES DEL SERVICIO DE EMPLEADO
export const employeeService = {

  // Obtener URL de descarga (necesitará headers o gestión externa)
  getDocumentDownloadUrl: (documentId: number): string => 
    `${sanitizeBaseUrl()}/employee/documents/${documentId}/download`,

  // Función para descargar blob (alternativa segura)
  downloadDocument: async (documentId: number): Promise<Blob> => {
     const { data } = await api.get(`/employee/documents/${documentId}/download`, {
       responseType: 'blob'
     });
     return data;
  },

  // Obtener la asistencia del empleado
  getAttendance: async (): Promise<AttendanceResponse> => {
    const { data } = await api.get<AttendanceResponse>("/employee/attendance");
    return data;
  },

  // Iniciar jornada laboral
  startWork: async (): Promise<ApiResponse<WorkSession>> => {
    const { data } = await api.post<ApiResponse<WorkSession>>("/employee/attendance/start");
    return data;
  },

  // Finalizar jornada laboral
  endWork: async (): Promise<ApiResponse<WorkSession>> => {
    const { data } = await api.post<ApiResponse<WorkSession>>("/employee/attendance/end");
    return data;
  },

  // Iniciar almuerzo
  startLunch: async (): Promise<ApiResponse<WorkSession>> => {
    const { data } = await api.post<ApiResponse<WorkSession>>("/employee/attendance/lunch-start");
    return data;
  },

  // Finalizar almuerzo
  endLunch: async (): Promise<ApiResponse<WorkSession>> => {
    const { data } = await api.post<ApiResponse<WorkSession>>("/employee/attendance/lunch-end");
    return data;
  },

  // Obtener documentos del empleado
  getDocuments: async (): Promise<ApiResponse<Document[]>> => {
    const { data } = await api.get<ApiResponse<Document[]>>("/employee/documents");
    return data;
  },

  // Subir un documento
  uploadDocument: async (payload: { uri: string; name: string; mimeType?: string; type: DocumentType, file?: any }): Promise<ApiResponse<Document>> => {
    const form = new FormData();
    
    if (Platform.OS === "web") {
        if (payload.file) {
            form.append("document", payload.file);
        } else {
             const response = await fetch(payload.uri);
             const blob = await response.blob();
             form.append("document", blob, payload.name);
        }
    } else {
        form.append("document", {
            uri: payload.uri,
            name: payload.name,
            type: payload.mimeType ?? "application/pdf"
        } as unknown as Blob);
    }
    
    form.append("document_type", payload.type);
    const { data } = await api.post<ApiResponse<Document>>("/employee/documents", form, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data;
  },

  // Eliminar un documento
  deleteDocument: async (documentId: number): Promise<ApiResponse<null>> => {
    const { data } = await api.delete<ApiResponse<null>>(`/employee/documents/${documentId}`);
    return data;
  },

  // Obtener solicitudes de salida anticipada
  getRequests: async (): Promise<ApiResponse<EarlyDepartureRequest[]>> => {
    const { data } = await api.get<ApiResponse<EarlyDepartureRequest[]>>(
      "/employee/early-departure-requests"
    );
    return data;
  },

  // Crear una solicitud de salida anticipada
  createRequest: async (payload: EarlyDeparturePayload): Promise<ApiResponse<EarlyDepartureRequest>> => {
    const { data } = await api.post<ApiResponse<EarlyDepartureRequest>>(
      "/employee/early-departure-requests",
      payload
    );
    return data;
  },

  // Obtener el perfil del empleado
  getProfile: async (): Promise<User> => {
    const { data } = await api.get<User>("/employee/profile");
    return data;
  },
  // Actualizar el perfil del empleado
  updateProfile: async (payload: ProfileUpdatePayload): Promise<ApiResponse<User>> => {
    const { data } = await api.put<ApiResponse<User>>("/employee/profile", payload);
    return data;
  }
};

export type { DocumentType } from "@/types/documents";
