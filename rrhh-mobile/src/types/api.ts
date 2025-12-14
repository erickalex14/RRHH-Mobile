export interface EmployeeState {
  employee_state_id: number;
  name: string;
  description: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Company {
  company_id: number;
  name: string;
  ruc: string;
  address: string;
  phone: string;
  email: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number | null;
}

export interface Branch {
  branch_id: number;
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
  created_at?: string;
  updated_at?: string;
  company?: Company;
}

export interface Department {
  department_id: number;
  branch_id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
  branch?: Branch;
}

export interface Role {
  role_id: number;
  name: string;
  description: string;
  salary: string;
  admin: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Schedule {
  schedule_id: number;
  name: string;
  start_time: string;
  end_time: string;
  lunch_start: string;
  lunch_end: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeDetail {
  employee_detail_id: number;
  user_id: number;
  role_id: number;
  department_id: number;
  schedule_id: number;
  national_id: string;
  address: string;
  phone: string;
  hire_date: string;
  birth_date: string;
  created_at?: string;
  updated_at?: string;
  first_name?: string;
  last_name?: string;
  role?: Role;
  department?: Department & { branch?: Branch & { company?: Company } };
  schedule?: Schedule;
  user?: User;
}

export interface User {
  user_id: number;
  employee_state_id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_by?: number | null;
  created_at?: string;
  updated_at?: string;
  employeeState?: EmployeeState | null;
  employeeDetail?: EmployeeDetail | null;
}

export interface WorkSession {
  session_id: number;
  user_id: number;
  work_date: string;
  start_time: string;
  end_time?: string | null;
  lunch_start?: string | null;
  lunch_end?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  created_at?: string;
  updated_at?: string;
  employee_detail?: EmployeeDetail | null;
  user?: User | null;
}

export interface Document {
  document_id: number;
  user_id: number;
  file_name: string;
  doc_type: string;
  description?: string | null;
  file_path: string;
  file_size: number | string;
  uploaded_by?: number | null;
  created_at?: string;
  updated_at?: string;
  file_url?: string;
  user?: User;
}

export type EarlyDepartureStatus = "pending" | "approved" | "rejected";

export interface EarlyDepartureRequest {
  request_id: number;
  user_id: number;
  description: string;
  request_date: string;
  request_time: string;
  document_path?: string | null;
  status: EarlyDepartureStatus;
  approved_by?: number | null;
  created_at?: string;
  updated_at?: string;
  employee_detail?: EmployeeDetail | null;
  user?: User | null;
}

export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<{
  items: T[];
  meta?: Record<string, unknown>;
}> {}
