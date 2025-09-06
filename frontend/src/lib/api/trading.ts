import type {
  MarketResponse,
  OrderbookResponse,
  OrderResponse,
  PositionResponse,
} from "../api";
import { apiClient } from "../api";

// Trading-specific API methods
export const tradingApi = {
  getMarkets: () => apiClient.getMarkets(),
  getMarketPrice: (symbol: string) => apiClient.getMarketPrice(symbol),
  getOrderbook: (symbol: string) => apiClient.getOrderbook(symbol),
  getOrders: () => apiClient.getOrders(),
  getPositions: () => apiClient.getPositions(),
  placeOrder: (orderData: any) => apiClient.placeOrder(orderData),
  cancelOrder: (orderId: string) => apiClient.cancelOrder(orderId),
};

export type {
  MarketResponse,
  OrderbookResponse,
  OrderResponse,
  PositionResponse,
};
