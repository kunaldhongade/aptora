// API client for communicating with our Rust backend
class ApiClient {
  private baseUrl: string;
  private token: string | null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem("auth_token");
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "API request failed");
    }

    return response.json();
  }

  // Authentication endpoints
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getProfile(): Promise<UserResponse> {
    return this.request("/auth/me");
  }

  // Trading endpoints
  async getMarkets(): Promise<MarketResponse[]> {
    const response = await this.request<ApiResponse<MarketResponse[]>>(
      "/trading/markets"
    );
    return response.data || [];
  }

  async getOrderbook(symbol: string, depth = 20): Promise<OrderbookResponse> {
    const response = await this.request<ApiResponse<OrderbookResponse>>(
      `/trading/orderbook?symbol=${symbol}&depth=${depth}`
    );
    return response.data!;
  }

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    const response = await this.request<ApiResponse<OrderResponse>>(
      "/trading/orders",
      {
        method: "POST",
        body: JSON.stringify(order),
      }
    );
    return response.data!;
  }

  async getOrders(
    params?: OrdersQuery
  ): Promise<PaginatedResponse<OrderResponse>> {
    const queryString = params
      ? new URLSearchParams(params as any).toString()
      : "";
    const response = await this.request<PaginatedResponse<OrderResponse>>(
      `/trading/orders${queryString ? `?${queryString}` : ""}`
    );
    return response;
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.request(`/trading/orders/${orderId}`, {
      method: "DELETE",
    });
  }

  async getPositions(): Promise<PositionResponse[]> {
    const response = await this.request<ApiResponse<PositionResponse[]>>(
      "/trading/positions"
    );
    return response.data || [];
  }

  async getFundingRate(symbol: string): Promise<number> {
    const response = await this.request<ApiResponse<{ funding_rate: number }>>(
      `/trading/funding-rate/${symbol}`
    );
    return response.data!.funding_rate;
  }

  async getMarketPrice(symbol: string): Promise<number> {
    const response = await this.request<ApiResponse<{ price: number }>>(
      `/trading/price/${symbol}`
    );
    return response.data!.price;
  }

  // User endpoints
  async updateProfile(data: UpdateProfileRequest): Promise<UserResponse> {
    const response = await this.request<ApiResponse<UserResponse>>(
      "/user/profile",
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
    return response.data!;
  }

  async getBalance(): Promise<BalanceResponse[]> {
    const response = await this.request<ApiResponse<BalanceResponse[]>>(
      "/user/balance"
    );
    return response.data || [];
  }
}

// Type definitions
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: UserResponse;
    token: string;
    token_type: string;
    expires_in: number;
  };
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

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

export interface OrderbookEntry {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderbookResponse {
  market_id: string;
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
  last_updated: string;
}

export interface OrderRequest {
  symbol: string;
  side: "buy" | "sell";
  order_type: "market" | "limit";
  size: number;
  price?: number;
  leverage?: number;
  margin_type?: "isolated" | "cross";
}

export interface OrderResponse {
  id: string;
  market_id: string;
  order_type: string;
  side: string;
  quantity: number;
  price?: number;
  status: string;
  filled_quantity: number;
  average_price?: number;
  leverage?: number;
  margin_type?: string;
  created_at: string;
}

export interface PositionResponse {
  id: string;
  market_id: string;
  side: string;
  size: number;
  entry_price: number;
  mark_price: number;
  unrealized_pnl: number;
  realized_pnl: number;
  margin: number;
  leverage: number;
  liquidation_price?: number;
  created_at: string;
}

export interface BalanceResponse {
  asset: string;
  available: number;
  locked: number;
  total: number;
}

export interface UpdateProfileRequest {
  username?: string;
}

export interface OrdersQuery {
  symbol?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Create and export the API client instance
export const apiClient = new ApiClient(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"
);
