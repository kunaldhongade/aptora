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
      baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
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
          // Check if this is already a refresh request to avoid infinite loop
          if (error.config.url?.includes("/auth/refresh")) {
            // Refresh failed, redirect to login
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            window.location.href = "/login";
            return Promise.reject(error);
          }

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
    password: string,
    referralCode?: string
  ): Promise<AuthResponse> {
    const payload: any = { email, username, password };
    if (referralCode) {
      payload.referral_code = referralCode;
    }

    const response: AxiosResponse<ApiResponse<AuthResponse>> =
      await this.client.post("/auth/register", payload);
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

  async checkUsernameAvailability(
    username: string
  ): Promise<{ username: string; available: boolean }> {
    const response: AxiosResponse<
      ApiResponse<{ username: string; available: boolean }>
    > = await this.client.get(`/auth/check-username/${username}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error || "Failed to check username availability"
      );
    }
    return response.data.data;
  }

  // Trading methods - Now using real Kana Labs API through backend
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
    depth?: number
  ): Promise<OrderbookResponse> {
    const response: AxiosResponse<ApiResponse<OrderbookResponse>> =
      await this.client.get(
        `/trading/orderbook/${symbol}${depth ? `?depth=${depth}` : ""}`
      );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get orderbook");
    }
    return response.data.data;
  }

  async placeOrder(
    orderData: PlaceOrderRequest
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
      await this.client.get(`/trading/funding-rate/${symbol}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get funding rate");
    }
    return response.data.data;
  }

  async getMarketPrice(
    symbol: string
  ): Promise<{ symbol: string; price: number; timestamp: string }> {
    const encodedSymbol = encodeURIComponent(symbol);
    const response: AxiosResponse<
      ApiResponse<{ symbol: string; price: number; timestamp: string }>
    > = await this.client.get(`/trading/price/${encodedSymbol}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get market price");
    }
    return response.data.data;
  }

  // Social features methods
  async followUser(username: string): Promise<void> {
    const response: AxiosResponse<ApiResponse<void>> = await this.client.post(
      `/social/follow`,
      { username }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to follow user");
    }
  }

  async unfollowUser(username: string): Promise<void> {
    const response: AxiosResponse<ApiResponse<void>> = await this.client.delete(
      `/social/follow/${username}`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to unfollow user");
    }
  }

  async getFollowers(username: string): Promise<User[]> {
    const response: AxiosResponse<ApiResponse<User[]>> = await this.client.get(
      `/social/followers/${username}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get followers");
    }
    return response.data.data;
  }

  async getFollowing(username: string): Promise<User[]> {
    const response: AxiosResponse<ApiResponse<User[]>> = await this.client.get(
      `/social/following/${username}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get following");
    }
    return response.data.data;
  }

  async getReferralLeaderboard(
    limit: number = 10
  ): Promise<ReferralLeaderboardEntry[]> {
    const response: AxiosResponse<ApiResponse<ReferralLeaderboardEntry[]>> =
      await this.client.get(`/social/referral-leaderboard?limit=${limit}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error || "Failed to get referral leaderboard"
      );
    }
    return response.data.data;
  }

  async getUserProfile(username: string): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.get(
      `/social/profile/${username}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get user profile");
    }
    return response.data.data;
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.put(
      `/social/profile`,
      profileData
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to update profile");
    }
    return response.data.data;
  }

  // Get current user's referral information (includes private data like total rewards)
  async getReferralInfo(): Promise<{
    referral_code: string;
    referral_count: number;
    total_rewards?: number;
  }> {
    const response: AxiosResponse<
      ApiResponse<{
        referral_code: string;
        referral_count: number;
        total_rewards?: number;
      }>
    > = await this.client.get(`/social/referral-info`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get referral info");
    }
    return response.data.data;
  }

  // Get users that the current user has referred
  async getReferredUsers(
    limit: number = 20,
    offset: number = 0
  ): Promise<User[]> {
    const response: AxiosResponse<ApiResponse<User[]>> = await this.client.get(
      `/social/referred-users?limit=${limit}&offset=${offset}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get referred users");
    }
    return response.data.data;
  }

  // Get follow statistics for a user
  async getFollowStats(username: string): Promise<FollowStats> {
    const response: AxiosResponse<ApiResponse<FollowStats>> =
      await this.client.get(`/social/follow-stats/${username}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get follow stats");
    }
    return response.data.data;
  }

  // Check if current user is following another user
  async checkFollowingStatus(
    userId: string
  ): Promise<{ is_following: boolean }> {
    const response: AxiosResponse<ApiResponse<{ is_following: boolean }>> =
      await this.client.get(`/social/check-following/${userId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error || "Failed to check following status"
      );
    }
    return response.data.data;
  }

  // User profile endpoints (different from social profile)
  async getUserProfile(): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.get(
      "/user/profile"
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get user profile");
    }
    return response.data.data;
  }

  async updateUserProfile(profileData: Partial<User>): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.put(
      "/user/profile",
      profileData
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to update user profile");
    }
    return response.data.data;
  }

  async getUserBalance(): Promise<
    { asset: string; available: number; locked: number; total: number }[]
  > {
    const response: AxiosResponse<
      ApiResponse<
        { asset: string; available: number; locked: number; total: number }[]
      >
    > = await this.client.get("/user/balance");
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get user balance");
    }
    return response.data.data;
  }

  // Health check endpoint
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response: AxiosResponse<
      ApiResponse<{ status: string; timestamp: string }>
    > = await this.client.get("/health");
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Health check failed");
    }
    return response.data.data;
  }
}

// Social feature interfaces
export interface ReferralLeaderboardEntry {
  username: string;
  referral_count: number;
  total_rewards: number;
}

export interface FollowStats {
  followers_count: number;
  following_count: number;
}

export interface PlaceOrderRequest {
  symbol: string;
  side: string; // "buy" or "sell"
  order_type: string; // "market" or "limit"
  size: number;
  price?: number;
  leverage?: number;
  margin_type?: string; // "isolated" or "cross"
}

export const apiClient = new ApiClient();
