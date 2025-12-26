import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { TOKEN_KEY } from "@/config/api";

// Web usa localStorage, nativo usa SecureStore
const isWeb = Platform.OS === "web";

export const saveToken = async (token: string): Promise<void> => {
  if (isWeb) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
};

export const getToken = async (): Promise<string | null> => {
  if (isWeb) {
    return localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const deleteToken = async (): Promise<void> => {
  if (isWeb) {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
};
