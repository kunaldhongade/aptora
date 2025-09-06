import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { AuthResponse, RefreshResponse, User } from "../contexts/AuthContext";

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// Simple in-memory cache
class CacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

const cacheManager = new CacheManager();

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
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem("access_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: unknown) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Check if this is already a refresh request to avoid infinite loop
          if (error.config?.url?.includes("/auth/refresh")) {
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
              if (error.config) {
                error.config.headers = error.config.headers || {};
                error.config.headers.Authorization = `Bearer ${response.access_token}`;
                return this.client.request(error.config);
              }
            }
          } catch {
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
    const payload: {
      email: string;
      username: string;
      password: string;
      referral_code?: string;
    } = { email, username, password };
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
    try {
      const response: AxiosResponse<ApiResponse<RefreshResponse>> =
        await this.client.post(
          "/auth/refresh",
          { refresh_token: refreshToken },
          {
            timeout: 10000, // 10 second timeout
          }
        );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || "Token refresh failed");
      }

      return response.data.data;
    } catch (error: unknown) {
      // Enhanced error handling
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ECONNABORTED"
      ) {
        throw new Error("Token refresh timeout - please check your connection");
      }
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "status" in error.response
      ) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          throw new Error("Refresh token expired or invalid");
        }
        if (axiosError.response?.status === 500) {
          throw new Error("Server error during token refresh");
        }
      }
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        !error.response
      ) {
        throw new Error("Network error - please check your connection");
      }
      throw error;
    }
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
    const cacheKey = "markets";
    const cachedData = cacheManager.get<MarketResponse[]>(cacheKey);

    if (cachedData) {
      console.log("Using cached markets data");
      return cachedData;
    }

    console.log("Fetching markets data from API");
    const response: AxiosResponse<ApiResponse<MarketResponse[]>> =
      await this.client.get("/trading/markets");
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get markets");
    }

    // Cache for 10 minutes (markets don't change frequently)
    cacheManager.set(cacheKey, response.data.data, 10 * 60 * 1000);
    return response.data.data;
  }

  async getOrderbook(
    symbol: string,
    depth?: number
  ): Promise<OrderbookResponse> {
    const cacheKey = `orderbook_${symbol}_${depth || 20}`;
    const cachedData = cacheManager.get<OrderbookResponse>(cacheKey);

    if (cachedData) {
      console.log(`Using cached orderbook data for ${symbol}`);
      return cachedData;
    }

    console.log(`Fetching orderbook data for ${symbol} from API`);
    const response: AxiosResponse<ApiResponse<OrderbookResponse>> =
      await this.client.get(
        `/trading/orderbook/${symbol}${depth ? `?depth=${depth}` : ""}`
      );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get orderbook");
    }

    // Cache for 10 seconds (orderbook changes very frequently)
    cacheManager.set(cacheKey, response.data.data, 10 * 1000);
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

    // Invalidate orders and positions cache
    cacheManager.delete("orders");
    cacheManager.delete("positions");

    return response.data.data;
  }

  async getOrders(): Promise<Record<string, unknown>[]> {
    const cacheKey = "orders";
    const cachedData = cacheManager.get<Record<string, unknown>[]>(cacheKey);

    if (cachedData) {
      console.log("Using cached orders data");
      return cachedData;
    }

    console.log("Fetching orders data from API");
    const response: AxiosResponse<ApiResponse<Record<string, unknown>[]>> =
      await this.client.get("/trading/orders");
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get orders");
    }

    // Cache for 30 seconds (orders change frequently)
    cacheManager.set(cacheKey, response.data.data, 30 * 1000);
    return response.data.data;
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.client.delete(`/trading/orders/${orderId}`);

    // Invalidate orders cache
    cacheManager.delete("orders");
  }

  async getPositions(): Promise<Record<string, unknown>[]> {
    const cacheKey = "positions";
    const cachedData = cacheManager.get<Record<string, unknown>[]>(cacheKey);

    if (cachedData) {
      console.log("Using cached positions data");
      return cachedData;
    }

    console.log("Fetching positions data from API");
    const response: AxiosResponse<ApiResponse<Record<string, unknown>[]>> =
      await this.client.get("/trading/positions");
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get positions");
    }

    // Cache for 30 seconds (positions change frequently)
    cacheManager.set(cacheKey, response.data.data, 30 * 1000);
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
    const cacheKey = `market_price_${symbol}`;
    const cachedData = cacheManager.get<{
      symbol: string;
      price: number;
      timestamp: string;
    }>(cacheKey);

    if (cachedData) {
      console.log(`Using cached price data for ${symbol}`);
      return cachedData;
    }

    console.log(`Fetching price data for ${symbol} from API`);
    const encodedSymbol = encodeURIComponent(symbol);
    const response: AxiosResponse<
      ApiResponse<{ symbol: string; price: number; timestamp: string }>
    > = await this.client.get(`/trading/price/${encodedSymbol}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get market price");
    }

    // Cache for 30 seconds (prices change frequently)
    cacheManager.set(cacheKey, response.data.data, 30 * 1000);
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

    // Invalidate related caches
    cacheManager.delete(`followers_${username}`);
    cacheManager.delete(`following_${username}`);
    cacheManager.delete(`user_profile_${username}`);
  }

  async unfollowUser(username: string): Promise<void> {
    const response: AxiosResponse<ApiResponse<void>> = await this.client.delete(
      `/social/follow/${username}`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to unfollow user");
    }

    // Invalidate related caches
    cacheManager.delete(`followers_${username}`);
    cacheManager.delete(`following_${username}`);
    cacheManager.delete(`user_profile_${username}`);
  }

  async getFollowers(username: string): Promise<User[]> {
    const cacheKey = `followers_${username}`;
    const cachedData = cacheManager.get<User[]>(cacheKey);

    if (cachedData) {
      console.log(`Using cached followers data for ${username}`);
      return cachedData;
    }

    console.log(`Fetching followers data for ${username} from API`);
    const response: AxiosResponse<ApiResponse<User[]>> = await this.client.get(
      `/social/followers/${username}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get followers");
    }

    // Cache for 2 minutes (followers change moderately)
    cacheManager.set(cacheKey, response.data.data, 2 * 60 * 1000);
    return response.data.data;
  }

  async getFollowing(username: string): Promise<User[]> {
    const cacheKey = `following_${username}`;
    const cachedData = cacheManager.get<User[]>(cacheKey);

    if (cachedData) {
      console.log(`Using cached following data for ${username}`);
      return cachedData;
    }

    console.log(`Fetching following data for ${username} from API`);
    const response: AxiosResponse<ApiResponse<User[]>> = await this.client.get(
      `/social/following/${username}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get following");
    }

    // Cache for 2 minutes (following changes moderately)
    cacheManager.set(cacheKey, response.data.data, 2 * 60 * 1000);
    return response.data.data;
  }

  async getReferralLeaderboard(
    limit: number = 10
  ): Promise<ReferralLeaderboardEntry[]> {
    const cacheKey = `referral_leaderboard_${limit}`;
    const cachedData = cacheManager.get<ReferralLeaderboardEntry[]>(cacheKey);

    if (cachedData) {
      console.log("Using cached referral leaderboard data");
      return cachedData;
    }

    console.log("Fetching referral leaderboard data from API");
    const response: AxiosResponse<ApiResponse<ReferralLeaderboardEntry[]>> =
      await this.client.get(`/social/referral-leaderboard?limit=${limit}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error || "Failed to get referral leaderboard"
      );
    }

    // Cache for 5 minutes (leaderboard changes moderately)
    cacheManager.set(cacheKey, response.data.data, 5 * 60 * 1000);
    return response.data.data;
  }

  async getUserProfile(username: string): Promise<User> {
    const cacheKey = `user_profile_${username}`;
    const cachedData = cacheManager.get<User>(cacheKey);

    if (cachedData) {
      console.log(`Using cached user profile data for ${username}`);
      return cachedData;
    }

    console.log(`Fetching user profile data for ${username} from API`);
    const response: AxiosResponse<ApiResponse<User>> = await this.client.get(
      `/social/profile/${username}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get user profile");
    }

    // Cache for 5 minutes (user profiles change moderately)
    cacheManager.set(cacheKey, response.data.data, 5 * 60 * 1000);
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
    const cacheKey = "referral_info";
    const cachedData = cacheManager.get<{
      referral_code: string;
      referral_count: number;
      total_rewards?: number;
    }>(cacheKey);

    if (cachedData) {
      console.log("Using cached referral info data");
      return cachedData;
    }

    console.log("Fetching referral info data from API");
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

    // Cache for 5 minutes (referral info changes moderately)
    cacheManager.set(cacheKey, response.data.data, 5 * 60 * 1000);
    return response.data.data;
  }

  // Get users that the current user has referred
  async getReferredUsers(
    limit: number = 20,
    offset: number = 0
  ): Promise<User[]> {
    const cacheKey = `referred_users_${limit}_${offset}`;
    const cachedData = cacheManager.get<User[]>(cacheKey);

    if (cachedData) {
      console.log(`Using cached referred users data (${limit}, ${offset})`);
      return cachedData;
    }

    console.log(`Fetching referred users data (${limit}, ${offset}) from API`);
    const response: AxiosResponse<ApiResponse<User[]>> = await this.client.get(
      `/social/referred-users?limit=${limit}&offset=${offset}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get referred users");
    }

    // Cache for 5 minutes (referred users change moderately)
    cacheManager.set(cacheKey, response.data.data, 5 * 60 * 1000);
    return response.data.data;
  }

  // Get all users for discovery
  async getAllUsers(limit: number = 50, offset: number = 0): Promise<User[]> {
    const cacheKey = `all_users_${limit}_${offset}`;
    const cachedData = cacheManager.get<User[]>(cacheKey);

    if (cachedData) {
      console.log(`Using cached all users data (${limit}, ${offset})`);
      return cachedData;
    }

    console.log(`Fetching all users data (${limit}, ${offset}) from API`);
    const response: AxiosResponse<ApiResponse<User[]>> = await this.client.get(
      `/social/users?limit=${limit}&offset=${offset}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "Failed to get all users");
    }

    // Cache for 2 minutes (all users change frequently)
    cacheManager.set(cacheKey, response.data.data, 2 * 60 * 1000);
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

  // Cache management methods
  clearCache(): void {
    cacheManager.clear();
  }

  clearCacheForEndpoint(endpoint: string): void {
    cacheManager.delete(endpoint);
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
  async getCurrentUserProfile(): Promise<User> {
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

// Export cache manager for manual cache control
export { cacheManager };
