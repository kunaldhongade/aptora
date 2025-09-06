// Re-export the main API client for backward compatibility
export { apiClient, cacheManager } from "./api";
export type {
  MarketResponse,
  OrderResponse,
  OrderbookResponse,
  PositionResponse,
  ReferralLeaderboardEntry,
  ReferralStats,
  User,
  UserProfile,
} from "./api";
