import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;

export const API_URL = extra?.apiUrl ?? "http://127.0.0.1:8000/api";
export const TOKEN_KEY = "rrhh_auth_token";
