import { api } from "@/services/http";
import { API_URL } from "@/config/api";
import {
  ApiResponse,
  Branch,
  Company,
  Department,
  Document,
  EarlyDepartureRequest,
  EmployeeDetail,
  EmployeeState,
  Role,
  Schedule,
  User,
  WorkSession
} from "@/types/api";
import { DocumentType } from "@/types/documents";



//SERVICIO DE ADMINISTRACIÓN QUE SIRVE PARA REALIZAR OPERACIONES RELACIONADAS CON LA GESTIÓN DE USUARIOS, COMPAÑÍAS, SUCURSALES, DEPARTAMENTOS, ROLES, HORARIOS, ESTADOS DE EMPLEADOS, DETALLES DE EMPLEADOS, ASISTENCIA Y DOCUMENTOS.

//Funcion que asegura que la URL base no termine con una barra

const sanitizeBaseUrl = (): string => {
  const base = api.defaults.baseURL ?? API_URL;
  return base.endsWith("/") ? base.slice(0, -1) : base;
};

// Payload interfaces

// Para crear o actualizar una compañia
export interface CompanyPayload {
  name: string;
  ruc: string;
  address: string;
  phone: string;
  email: string;
}

// Para crear o actualizar una sucursal
export interface BranchPayload {
  company_id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  matrix: boolean;
}

// Para crear o actualizar un departamento

export interface DepartmentPayload {
  branch_id: number;
  name: string;
}

// Para crear o actualizar un rol

export interface RolePayload {
  name: string;
  description: string;
  salary: string;
  admin: boolean;
}

// Para crear o actualizar un horario

export interface SchedulePayload {
  name: string;
  start_time: string;
  end_time: string;
  lunch_start: string;
  lunch_end: string;
  active: boolean;
}

// Para crear o actualizar un estado de empleado

export interface EmployeeStatePayload {
  name: string;
  description: string;
  active: boolean;
}

// Para crear o actualizar detalles de un empleado

export interface EmployeeDetailPayload {
  user_id: number;
  role_id: number;
  department_id: number;
  schedule_id: number;
  national_id: string;
  address: string;
  phone: string;
  hire_date: string;
  birth_date: string;
}

// Para crear un usuario junto con su detalle requerido por el backend
export interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  employee_state_id: number;
  role_id: number;
  department_id: number;
  schedule_id: number;
  national_id: string;
  address: string;
  phone: string;
  hire_date: string;
  birth_date: string;
}

// Para actualizar un usuario

export interface UpdateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  employee_state_id: number;
}

// Query parameters para obtener documentos

export interface DocumentQueryParams {
  branch_id?: string;
  department_id?: string;
  role_id?: string;
  employee_id?: string;
  doc_type?: DocumentType | "all";
  search?: string;
}

// Payload para crear un documento

export interface AdminDocumentFile {
  uri: string;
  name: string;
  mimeType?: string;
}

// Payload para crear un documento

export interface CreateDocumentPayload {
  userId: number;
  docType: DocumentType;
  description?: string | null;
  file: AdminDocumentFile;
}

// Payload para actualizar un documento

export interface UpdateDocumentPayload {
  docType: DocumentType;
  description?: string | null;
}



// Servicio de administración
// Contiene funciones para gestionar usuarios, compañías, sucursales, departamentos, roles, horarios, estados de empleados, detalles de empleados, asistencia y documentos.
export const adminService = {
    // Usuarios
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    const { data } = await api.get<ApiResponse<User[]>>("/admin/users");
    return data;
  },
  // Obtener un usuario por ID


  getUserById: async (userId: number): Promise<ApiResponse<User>> => {
    const { data } = await api.get<ApiResponse<User>>(`/admin/users/${userId}`);
    return data;
  },


    // Estados de empleados
  getEmployeeStates: async (): Promise<ApiResponse<EmployeeState[]>> => {
    const { data } = await api.get<ApiResponse<EmployeeState[]>>("/admin/employee-states");
    return data;
  },


  // Crear un nuevo estado de empleado
  createEmployeeState: async (payload: EmployeeStatePayload): Promise<ApiResponse<EmployeeState>> => {
    const { data } = await api.post<ApiResponse<EmployeeState>>("/admin/employee-states", payload);
    return data;
  },


  // Actualizar un estado de empleado existente
  updateEmployeeState: async (
    employeeStateId: number,
    payload: EmployeeStatePayload
  ): Promise<ApiResponse<EmployeeState>> => {
    const { data } = await api.put<ApiResponse<EmployeeState>>(
      `/admin/employee-states/${employeeStateId}`,
      payload
    );
    return data;
  },


  // Eliminar un estado de empleado
  deleteEmployeeState: async (employeeStateId: number): Promise<ApiResponse<null>> => {
    const { data } = await api.delete<ApiResponse<null>>(`/admin/employee-states/${employeeStateId}`);
    return data;
  },


  // Crear un nuevo usuario
  createUser: async (payload: CreateUserPayload): Promise<ApiResponse<User>> => {
    const { data } = await api.post<ApiResponse<User>>("/admin/users", payload);
    return data;
  },


  // Actualizar un usuario existente
  updateUser: async (userId: number, payload: UpdateUserPayload): Promise<ApiResponse<User>> => {
    const { data } = await api.put<ApiResponse<User>>(`/admin/users/${userId}`, payload);
    return data;
  },


    // Eliminar un usuario
    deleteUser: async (userId: number): Promise<ApiResponse<null>> => {
    const { data } = await api.delete<ApiResponse<null>>(`/admin/users/${userId}`);
    return data;
  },


  // Detalles de empleados
  getEmployeeDetails: async (): Promise<ApiResponse<EmployeeDetail[]>> => {
    const { data } = await api.get<ApiResponse<EmployeeDetail[]>>("/admin/employee-details");
    return data;
  },


  // Compañías
  getCompanies: async (): Promise<ApiResponse<Company[]>> => {
    const { data } = await api.get<ApiResponse<Company[]>>("/admin/companies");
    return data;
  },


  // Crear una nueva compañía
  createCompany: async (payload: CompanyPayload): Promise<ApiResponse<Company>> => {
    const { data } = await api.post<ApiResponse<Company>>("/admin/companies", payload);
    return data;
  },


  // Actualizar una compañía existente
  updateCompany: async (companyId: number, payload: CompanyPayload): Promise<ApiResponse<Company>> => {
    const { data } = await api.put<ApiResponse<Company>>(`/admin/companies/${companyId}`, payload);
    return data;
  },


  // Eliminar una compañía
  deleteCompany: async (companyId: number): Promise<ApiResponse<null>> => {
    const { data } = await api.delete<ApiResponse<null>>(`/admin/companies/${companyId}`);
    return data;
  },


  // Sucursales
  getBranches: async (): Promise<ApiResponse<Branch[]>> => {
    const { data } = await api.get<ApiResponse<Branch[]>>("/admin/branches");
    return data;
  },


  // Crear una nueva sucursal
  createBranch: async (payload: BranchPayload): Promise<ApiResponse<Branch>> => {
    const { data } = await api.post<ApiResponse<Branch>>("/admin/branches", payload);
    return data;
  },


  // Actualizar una sucursal existente
  updateBranch: async (branchId: number, payload: BranchPayload): Promise<ApiResponse<Branch>> => {
    const { data } = await api.put<ApiResponse<Branch>>(`/admin/branches/${branchId}`, payload);
    return data;
  },


    // Eliminar una sucursal
  deleteBranch: async (branchId: number): Promise<ApiResponse<null>> => {
    const { data } = await api.delete<ApiResponse<null>>(`/admin/branches/${branchId}`);
    return data;
  },
    // Departamentos
  getDepartments: async (): Promise<ApiResponse<Department[]>> => {
    const { data } = await api.get<ApiResponse<Department[]>>("/admin/departments");
    return data;
  },
  // Crear un nuevo departamento
  createDepartment: async (payload: DepartmentPayload): Promise<ApiResponse<Department>> => {
    const { data } = await api.post<ApiResponse<Department>>("/admin/departments", payload);
    return data;
  },
  // Actualizar un departamento existente
  updateDepartment: async (departmentId: number, payload: DepartmentPayload): Promise<ApiResponse<Department>> => {
    const { data } = await api.put<ApiResponse<Department>>(`/admin/departments/${departmentId}`, payload);
    return data;
  },
  // Eliminar un departamento
  deleteDepartment: async (departmentId: number): Promise<ApiResponse<null>> => {
    const { data } = await api.delete<ApiResponse<null>>(`/admin/departments/${departmentId}`);
    return data;
  },
  // Roles
  getRoles: async (): Promise<ApiResponse<Role[]>> => {
    const { data } = await api.get<ApiResponse<Role[]>>("/admin/roles");
    return data;
  },
    // Crear un nuevo rol
  createRole: async (payload: RolePayload): Promise<ApiResponse<Role>> => {
    const { data } = await api.post<ApiResponse<Role>>("/admin/roles", payload);
    return data;
  },
    // Actualizar un rol existente
  updateRole: async (roleId: number, payload: RolePayload): Promise<ApiResponse<Role>> => {
    const { data } = await api.put<ApiResponse<Role>>(`/admin/roles/${roleId}`, payload);
    return data;
  },
    // Eliminar un rol
  deleteRole: async (roleId: number): Promise<ApiResponse<null>> => {
    const { data } = await api.delete<ApiResponse<null>>(`/admin/roles/${roleId}`);
    return data;
  },
    // Horarios
  getSchedules: async (): Promise<ApiResponse<Schedule[]>> => {
    const { data } = await api.get<ApiResponse<Schedule[]>>("/admin/schedules");
    return data;
  },
    // Crear un nuevo horario
  createSchedule: async (payload: SchedulePayload): Promise<ApiResponse<Schedule>> => {
    const { data } = await api.post<ApiResponse<Schedule>>("/admin/schedules", payload);
    return data;
  },
    // Actualizar un horario existente
  updateSchedule: async (
    scheduleId: number,
    payload: SchedulePayload
  ): Promise<ApiResponse<Schedule>> => {
    const { data } = await api.put<ApiResponse<Schedule>>(`/admin/schedules/${scheduleId}`, payload);
    return data;
  },

        // Eliminar un horario
  deleteSchedule: async (scheduleId: number): Promise<ApiResponse<null>> => {
    const { data } = await api.delete<ApiResponse<null>>(`/admin/schedules/${scheduleId}`);
    return data;
  },

    // Detalles de empleados
  createEmployeeDetail: async (payload: EmployeeDetailPayload): Promise<ApiResponse<EmployeeDetail>> => {
    const { data } = await api.post<ApiResponse<EmployeeDetail>>("/admin/employee-details", payload);
    return data;
  },

// Actualizar un detalle de empleado existente
  updateEmployeeDetail: async (
    employeeDetailId: number,
    payload: EmployeeDetailPayload
  ): Promise<ApiResponse<EmployeeDetail>> => {
    const { data } = await api.put<ApiResponse<EmployeeDetail>>(
      `/admin/employee-details/${employeeDetailId}`,
      payload
    );
    return data;
  },

  //Obtener registros de asistencia
  getAllAttendance: async (): Promise<ApiResponse<WorkSession[]>> => {
    const { data } = await api.get<ApiResponse<WorkSession[]>>("/admin/attendance/all");
    return data;
  },

  // Obtener registros de asistencia con filtros
  getAdminAttendanceByFilters: async (params: {
    branch_id?: string;
    department_id?: string;
    role_id?: string;
    employee_id?: string;
    date_from?: string;
    date_to?: string;
    status?: "open" | "closed" | "all";
  }): Promise<ApiResponse<WorkSession[]>> => {
    const { data } = await api.get<ApiResponse<WorkSession[]>>("/admin/attendance", { params });
    return data;
  },

  // Documentos
  getDocuments: async (params?: DocumentQueryParams): Promise<ApiResponse<Document[]>> => {
    const normalizedParams = {
      ...params,
      doc_type: params?.doc_type && params.doc_type !== "all" ? params.doc_type : undefined,
      search: params?.search?.trim() ? params.search.trim() : undefined
    };
    const { data } = await api.get<ApiResponse<Document[]>>("/admin/documents", {
      params: normalizedParams
    });
    return data;
  },

  // Crear un nuevo documento
  createDocument: async (payload: CreateDocumentPayload): Promise<ApiResponse<Document>> => {
    const form = new FormData();
    form.append("user_id", String(payload.userId));
    form.append("doc_type", payload.docType);
    form.append("document_type", payload.docType);
    if (payload.description?.trim()) {
      form.append("description", payload.description.trim());
    }
    form.append("document", {
      uri: payload.file.uri,
      name: payload.file.name,
      type: payload.file.mimeType ?? "application/pdf"
    } as unknown as Blob);

    const { data } = await api.post<ApiResponse<Document>>("/admin/documents", form, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data;
  },


  // Actualizar un documento existente
  updateDocument: async (
    documentId: number,
    payload: UpdateDocumentPayload
  ): Promise<ApiResponse<Document>> => {
    const body = {
      doc_type: payload.docType,
      description: payload.description ?? null
    };
    const { data } = await api.put<ApiResponse<Document>>(`/admin/documents/${documentId}`, body);
    return data;
  },

  // Eliminar un documento
  deleteDocument: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await api.delete<ApiResponse<null>>(`/admin/documents/${id}`);
    return data;
  },

  // Obtener la URL de descarga de un documento
  getDocumentDownloadUrl: (documentId: number): string =>
    `${sanitizeBaseUrl()}/admin/documents/${documentId}/download`,

  // Solicitudes de salida anticipada
  getEarlyRequests: async (): Promise<ApiResponse<EarlyDepartureRequest[]>> => {
    const { data } = await api.get<ApiResponse<EarlyDepartureRequest[]>>("/admin/early-departure-requests");
    return data;
  },

  // Aprobar una solicitud de salida anticipada
  approveEarlyRequest: async (id: number): Promise<ApiResponse<EarlyDepartureRequest>> => {
    const { data } = await api.put<ApiResponse<EarlyDepartureRequest>>(
      `/admin/early-departure-requests/${id}/approve`
    );
    return data;
  },

  // Rechazar una solicitud de salida anticipada
  rejectEarlyRequest: async ({
    id,
    reason
  }: {
    id: number;
    reason: string;
  }): Promise<ApiResponse<EarlyDepartureRequest>> => {
    const payload = reason?.trim() ? { reason: reason.trim() } : undefined;
    const { data } = await api.put<ApiResponse<EarlyDepartureRequest>>(
      `/admin/early-departure-requests/${id}/reject`,
      payload
    );
    return data;
  }
};
