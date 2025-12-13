import axios from "axios";
import { API_URL } from "@/config/api";

let authToken: string | null = null;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json"
  },
  timeout: 15000
});

export const setAuthToken = (token?: string | null): void => {
  authToken = token ?? null;
  if (authToken) {
    api.defaults.headers.common.Authorization = `Bearer ${authToken}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const getAuthToken = (): string | null => authToken;
