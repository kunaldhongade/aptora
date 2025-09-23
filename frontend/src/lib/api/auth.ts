import type { AuthResponse, RefreshResponse } from "../../contexts/AuthContext";
import { apiClient } from "../api";

// Auth-specific API methods
export const authApi = {
  login: (email: string, password: string) => apiClient.login(email, password),
  register: (
    email: string,
    username: string,
    password: string,
    referralCode?: string
  ) => apiClient.register(email, username, password, referralCode),
  refreshToken: (refreshToken: string) => apiClient.refreshToken(refreshToken),
  logout: (refreshToken: string) => apiClient.logout(refreshToken),
  forgotPassword: (email: string) => apiClient.forgotPassword(email),
  resetPassword: (token: string, newPassword: string) =>
    apiClient.resetPassword(token, newPassword),
};

export type { AuthResponse, RefreshResponse };
