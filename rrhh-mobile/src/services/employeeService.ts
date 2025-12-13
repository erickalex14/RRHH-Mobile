import { api } from "@/services/http";
import {
  ApiResponse,
  Document,
  EarlyDepartureRequest,
  EarlyDepartureStatus,
  User,
  WorkSession
} from "@/types/api";

export type DocumentType = "cv" | "certificate" | "id" | "other";

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

type RNFile = {
  uri: string;
  name: string;
  type: string;
};

export const employeeService = {
  getAttendance: async (): Promise<AttendanceResponse> => {
    const { data } = await api.get<AttendanceResponse>("/employee/attendance");
    return data;
  },
  startWork: async (): Promise<ApiResponse<WorkSession>> => {
    const { data } = await api.post<ApiResponse<WorkSession>>("/employee/attendance/start");
    return data;
  },
  endWork: async (): Promise<ApiResponse<WorkSession>> => {
    const { data } = await api.post<ApiResponse<WorkSession>>("/employee/attendance/end");
    return data;
  },
  startLunch: async (): Promise<ApiResponse<WorkSession>> => {
    const { data } = await api.post<ApiResponse<WorkSession>>("/employee/attendance/lunch-start");
    return data;
  },
  endLunch: async (): Promise<ApiResponse<WorkSession>> => {
    const { data } = await api.post<ApiResponse<WorkSession>>("/employee/attendance/lunch-end");
    return data;
  },
  getDocuments: async (): Promise<ApiResponse<Document[]>> => {
    const { data } = await api.get<ApiResponse<Document[]>>("/employee/documents");
    return data;
  },
  uploadDocument: async (payload: { uri: string; name: string; mimeType?: string; type: DocumentType }): Promise<ApiResponse<Document>> => {
    const form = new FormData();
    form.append("document", {
      uri: payload.uri,
      name: payload.name,
      type: payload.mimeType ?? "application/pdf"
    } as unknown as RNFile);
    form.append("document_type", payload.type);
    const { data } = await api.post<ApiResponse<Document>>("/employee/documents", form, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data;
  },
  deleteDocument: async (documentId: number): Promise<ApiResponse<null>> => {
    const { data } = await api.delete<ApiResponse<null>>(`/employee/documents/${documentId}`);
    return data;
  },
  getRequests: async (): Promise<ApiResponse<EarlyDepartureRequest[]>> => {
    const { data } = await api.get<ApiResponse<EarlyDepartureRequest[]>>(
      "/employee/early-departure-requests"
    );
    return data;
  },
  createRequest: async (payload: EarlyDeparturePayload): Promise<ApiResponse<EarlyDepartureRequest>> => {
    const { data } = await api.post<ApiResponse<EarlyDepartureRequest>>(
      "/employee/early-departure-requests",
      payload
    );
    return data;
  },
  getProfile: async (): Promise<User> => {
    const { data } = await api.get<User>("/employee/profile");
    return data;
  },
  updateProfile: async (payload: ProfileUpdatePayload): Promise<ApiResponse<User>> => {
    const { data } = await api.put<ApiResponse<User>>("/employee/profile", payload);
    return data;
  }
};
