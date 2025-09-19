// Token icon mapping utility
export interface TokenInfo {
  symbol: string;
  name: string;
  icon: string;
  color: string;
}

export const TOKEN_ICONS: Record<string, TokenInfo> = {
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    icon: "/tokens/btc.svg",
    color: "#f7931a",
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    icon: "/tokens/eth.svg",
    color: "#627eea",
  },
  APT: {
    symbol: "APT",
    name: "Aptos",
    icon: "/tokens/apt.svg",
    color: "#10B981",
  },
  SOL: {
    symbol: "SOL",
    name: "Solana",
    icon: "/tokens/sol.svg",
    color: "#9945ff",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether",
    icon: "/tokens/usdt.svg",
    color: "#26a17b",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    icon: "/tokens/usdt.svg", // Using USDT as fallback
    color: "#2775ca",
  },
  BNB: {
    symbol: "BNB",
    name: "Binance Coin",
    icon: "/tokens/btc.svg", // Using BTC as fallback
    color: "#f3ba2f",
  },
  ADA: {
    symbol: "ADA",
    name: "Cardano",
    icon: "/tokens/eth.svg", // Using ETH as fallback
    color: "#0033ad",
  },
  MATIC: {
    symbol: "MATIC",
    name: "Polygon",
    icon: "/tokens/eth.svg", // Using ETH as fallback
    color: "#8247e5",
  },
  AVAX: {
    symbol: "AVAX",
    name: "Avalanche",
    icon: "/tokens/sol.svg", // Using SOL as fallback
    color: "#e84142",
  },
};

// Function to get token info with fallback
export const getTokenInfo = (symbol: string): TokenInfo => {
  const cleanSymbol = symbol
    .replace(/[-/]/g, "")
    .split(/[-/]/)[0]
    .toUpperCase();

  return (
    TOKEN_ICONS[cleanSymbol] || {
      symbol: cleanSymbol,
      name: cleanSymbol,
      icon: "/tokens/btc.svg", // Default fallback
      color: "#10B981", // Default to our primary green
    }
  );
};

// Function to extract base symbol from trading pairs
export const getBaseSymbol = (symbol: string): string => {
  // Handle formats like "APT-USDC", "BTC/USDT", "ETH-USD"
  return symbol.split(/[-/]/)[0].toUpperCase();
};
