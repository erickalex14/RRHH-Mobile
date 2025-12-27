import axios from "axios";
import { Alert } from "react-native";
import { create } from "zustand";
import { authService, LoginPayload } from "@/services/authService";
import { deleteToken, getToken, saveToken } from "@/services/storage";
import { setAuthToken, setUnauthorizedHandler } from "@/services/http";
import { User } from "@/types/api";
import { employeeService, ProfileUpdatePayload } from "@/services/employeeService";

export type AuthStatus = "checking" | "idle" | "loading" | "authenticated";

interface AuthState {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: ProfileUpdatePayload) => Promise<User>;
  handleUnauthorized: () => Promise<void>;
}

let isHandlingUnauthorized = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  status: "checking",
  error: null,
  bootstrap: async () => {
    try {
      const storedToken = await getToken();
      if (!storedToken) {
        set({ status: "idle", token: null, user: null });
        return;
      }
      setAuthToken(storedToken);
      const profile = await authService.me();
      set({ user: profile, token: storedToken, status: "authenticated" });
    } catch (error) {
      await deleteToken();
      setAuthToken(null);
      set({ status: "idle", token: null, user: null });
    }
  },
  login: async (payload) => {
    set({ status: "loading", error: null });
    try {
      const response = await authService.login(payload);
      console.log("Login response user:", JSON.stringify(response.user, null, 2));
      await saveToken(response.access_token);
      setAuthToken(response.access_token);
      set({ user: response.user, token: response.access_token, status: "authenticated" });
      return response.user;
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ||
          (error.response?.data as { message?: string; errors?: Record<string, string[]> })?.errors?.email?.[0] ||
          "Credenciales inválidas"
        : "Error inesperado. Intenta nuevamente.";
      set({ error: message, status: "idle" });
      throw new Error(message);
    }
  },
  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      // ignore network failures on logout
    } finally {
      await deleteToken();
      setAuthToken(null);
      set({ user: null, token: null, status: "idle", error: null });
    }
  },
  handleUnauthorized: async () => {
    if (isHandlingUnauthorized) {
      return;
    }

    isHandlingUnauthorized = true;
    const currentStatus = get().status;

    try {
      await deleteToken();
      setAuthToken(null);
      set({ user: null, token: null, status: "idle", error: null });

      if (currentStatus === "authenticated") {
        Alert.alert("Sesión expirada", "Tu sesión caducó. Ingresa nuevamente para continuar.");
      }
    } finally {
      setTimeout(() => {
        isHandlingUnauthorized = false;
      }, 400);
    }
  },
  refreshProfile: async () => {
    try {
      const profile = await employeeService.getProfile();
      set({ user: profile });
    } catch (error) {
      // ignore profile refresh errors
    }
  },
  updateProfile: async (payload) => {
    const response = await employeeService.updateProfile(payload);
    set({ user: response.data });
    return response.data;
  },
  clearError: () => {
    if (get().error) {
      set({ error: null });
    }
  }
}));

setUnauthorizedHandler(async () => {
  await useAuthStore.getState().handleUnauthorized();
});
