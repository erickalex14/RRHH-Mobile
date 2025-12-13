import { api } from "@/services/http";
import { User } from "@/types/api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/login", payload);
    return data;
  },
  async me(): Promise<User> {
    const { data } = await api.get<{ user: User }>("/auth/me");
    return data.user;
  },
  async logout(): Promise<void> {
    await api.post("/auth/logout");
  }
};
