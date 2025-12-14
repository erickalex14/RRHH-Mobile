import axios, { AxiosError } from "axios";
import { API_URL } from "@/config/api";

let authToken: string | null = null;
let onUnauthorized: (() => Promise<void> | void) | null = null;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json"
  },
  timeout: 15000
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const isLogoutAttempt = error.config?.url?.includes("/auth/logout");

    if (error.response?.status === 401 && authToken && onUnauthorized && !isLogoutAttempt) {
      await onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token?: string | null): void => {
  authToken = token ?? null;
  if (authToken) {
    api.defaults.headers.common.Authorization = `Bearer ${authToken}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const getAuthToken = (): string | null => authToken;

export const setUnauthorizedHandler = (handler: (() => Promise<void> | void) | null): void => {
  onUnauthorized = handler;
};
