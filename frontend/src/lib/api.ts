import axios, { AxiosInstance, AxiosResponse } from "axios";
import { AuthResponse, RefreshResponse, User } from "../contexts/AuthContext";

export interface MarketResponse {
  id: string;
  symbol: string;
  base_asset: string;
  quote_asset: string;
  min_order_size: number;
  max_order_size: number;
  tick_size: number;
  is_active: boolean;
}

export interface OrderbookResponse {
  market_id: string;
  bids: Array<{
    price: number;
    quantity: number;
    total: number;
  }>;
  asks: Array<{
    price: number;
    quantity: number;
    total: number;
  }>;
  last_updated: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  error: string | null;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: "http://localhost:8080/api",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config: any) => {
        const token = localStorage.getItem("access_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          try {
            const refreshToken = localStorage.getItem("refresh_token");
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem("access_token", response.access_token);

              // Retry original request
              error.config.headers.Authorization = `Bearer ${response.access_token}`;
              return this.client.request(error.config);
            }
          } catch (_refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async login(email: string, password: string): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> =
      await this.client.post("/auth/login", { email, password });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Login failed");
    }
    return response.data.data;
  }

  async register(
    email: string,
    username: string,
    password: string
  ): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> =
      await this.client.post("/auth/register", { email, username, password });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Registration failed");
    }
    return response.data.data;
  }

  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    const response: AxiosResponse<ApiResponse<RefreshResponse>> =
      await this.client.post("/auth/refresh", { refresh_token: refreshToken });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Token refresh failed");
    }
    return response.data.data;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.client.post("/auth/logout", { refresh_token: refreshToken });
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.get(
      "/auth/me"
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get profile");
    }
    return response.data.data;
  }

  // Trading methods
  async getMarkets(): Promise<MarketResponse[]> {
    const response: AxiosResponse<ApiResponse<MarketResponse[]>> =
      await this.client.get("/trading/markets");
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get markets");
    }
    return response.data.data;
  }

  async getOrderbook(
    symbol: string,
    depth: number = 20
  ): Promise<OrderbookResponse> {
    const response: AxiosResponse<ApiResponse<OrderbookResponse>> =
      await this.client.get(
        `/trading/orderbook?market_id=${symbol}&depth=${depth}`
      );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get orderbook");
    }
    return response.data.data;
  }

  async placeOrder(
    orderData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const response: AxiosResponse<ApiResponse<Record<string, unknown>>> =
      await this.client.post("/trading/orders", orderData);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to place order");
    }
    return response.data.data;
  }

  async getOrders(): Promise<Record<string, unknown>[]> {
    const response: AxiosResponse<ApiResponse<Record<string, unknown>[]>> =
      await this.client.get("/trading/orders");
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get orders");
    }
    return response.data.data;
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.client.delete(`/trading/orders/${orderId}`);
  }

  async getPositions(): Promise<Record<string, unknown>[]> {
    const response: AxiosResponse<ApiResponse<Record<string, unknown>[]>> =
      await this.client.get("/trading/positions");
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get positions");
    }
    return response.data.data;
  }

  async getFundingRate(symbol: string): Promise<Record<string, unknown>> {
    const response: AxiosResponse<ApiResponse<Record<string, unknown>>> =
      await this.client.get(`/trading/funding-rate?market_id=${symbol}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get funding rate");
    }
    return response.data.data;
  }

  async getMarketPrice(symbol: string): Promise<Record<string, unknown>> {
    const response: AxiosResponse<ApiResponse<Record<string, unknown>>> =
      await this.client.get(`/trading/market-price?market_id=${symbol}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get market price");
    }
    return response.data.data;
  }
}

export const apiClient = new ApiClient();
