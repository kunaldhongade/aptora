import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Chart } from '../components/trading/Chart';
import { Orderbook } from '../components/trading/Orderbook';
import { OrderEntry } from '../components/trading/OrderEntry';
import { Card } from '../components/ui/Card';
import { apiClient, MarketResponse, OrderbookResponse } from '../lib/api';
import { getBaseSymbol, getTokenInfo } from '../utils/tokenIcons';

const Trade: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState<MarketResponse | null>(null);
  const [markets, setMarkets] = useState<MarketResponse[]>([]);
  const [orderbook, setOrderbook] = useState<OrderbookResponse | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [chartData, setChartData] = useState<Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarkets();
  }, []);

  useEffect(() => {
    if (selectedMarket) {
      fetchOrderbook(selectedMarket.symbol);
      fetchChartData();
    }
  }, [selectedMarket]);

  const fetchMarkets = async () => {
    try {
      setLoading(true);
      const marketsData = await apiClient.getMarkets();
      setMarkets(marketsData);
      if (marketsData.length > 0) {
        setSelectedMarket(marketsData[0]);
      }
    } catch (err) {
      setError('Failed to load markets data');
      console.error('Error loading markets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderbook = async (symbol: string) => {
    try {
      const orderbookData = await apiClient.getOrderbook(symbol, 20);
      setOrderbook(orderbookData);
    } catch (err) {
      console.error('Error loading orderbook:', err);
    }
  };

  const fetchChartData = async () => {
    try {
      // Clear existing chart data first to prevent showing old data
      setChartData([]);

      // For now, use a default market ID. In production, this should be dynamic based on symbol
      const marketId = "1338"; // APT-USD market ID
      const chartData = await apiClient.getChartData(marketId);
      setChartData(chartData);
    } catch (err) {
      console.error('Error loading chart data:', err);
      // Set empty chart data on error
      setChartData([]);
    }
  };

  // Convert API orderbook format to component format
  const convertOrderbookData = (apiOrderbook: OrderbookResponse) => {
    return {
      bids: apiOrderbook.bids.map(bid => ({
        price: bid.price,
        size: bid.quantity,
        total: bid.total
      })),
      asks: apiOrderbook.asks.map(ask => ({
        price: ask.price,
        size: ask.quantity,
        total: ask.total
      }))
    };
  };

  // Chart data is now fetched from the API

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">Loading markets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Elegant Header with Inline Market Selector */}
      <div className="mb-8 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-text-default mb-2">Trade</h1>
            <p className="text-muted">Trade perpetual futures with leverage</p>
          </div>

          {/* Compact Inline Market Selector */}
          <div className="relative">
            <div className="text-xs text-muted uppercase tracking-wider mb-2 text-right">Market</div>
            <div className="relative">
              {/* Compact Dropdown Button */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="min-w-[280px] p-3 bg-surface-700 border border-surface-600 rounded-xl text-left flex items-center justify-between hover:border-primary/50 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300 shadow-sm hover:shadow-glow"
              >
                <div className="flex items-center gap-2">
                  {selectedMarket ? (
                    <>
                      <img
                        src={getTokenInfo(getBaseSymbol(selectedMarket.symbol)).icon}
                        alt={getTokenInfo(getBaseSymbol(selectedMarket.symbol)).name}
                        className="w-6 h-6 rounded-full shadow-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-black text-xs font-bold shadow-glow">
                                ${selectedMarket.symbol.slice(0, 1)}
                              </div>
                            `;
                          }
                        }}
                      />
                      <div>
                        <div className="font-bold text-text-default text-sm">{selectedMarket.symbol}</div>
                        <div className="text-xs text-muted">{selectedMarket.base_asset}/{selectedMarket.quote_asset}</div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-surface-600 rounded-full flex items-center justify-center">
                        <Search className="w-3 h-3 text-muted" />
                      </div>
                      <div>
                        <div className="font-medium text-muted text-sm">Choose Market</div>
                        <div className="text-xs text-muted">Select pair</div>
                      </div>
                    </div>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Custom Dropdown Menu */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-full left-0 right-0 mt-2 bg-surface-700 border border-surface-600 rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-sm"
                  >
                    {/* Search Input */}
                    <div className="p-3 border-b border-surface-600">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                          type="text"
                          placeholder="Search markets..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-surface-600 border border-surface-500 rounded-lg text-text-default placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        />
                      </div>
                    </div>

                    {/* Market Options */}
                    <div className="max-h-64 overflow-y-auto">
                      {markets
                        .filter(market =>
                          market.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          market.base_asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          market.quote_asset.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((market, index) => {
                          const tokenInfo = getTokenInfo(getBaseSymbol(market.symbol));
                          return (
                            <motion.button
                              key={market.symbol}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.02 }}
                              onClick={() => {
                                setSelectedMarket(market);
                                setOrderbook(null);
                                setChartData([]);
                                setIsDropdownOpen(false);
                                setSearchTerm('');
                              }}
                              className={`w-full p-3 flex items-center gap-3 hover:bg-surface-600 transition-colors text-left ${selectedMarket?.symbol === market.symbol ? 'bg-primary/10 border-r-2 border-primary' : ''
                                }`}
                            >
                              <img
                                src={tokenInfo.icon}
                                alt={tokenInfo.name}
                                className="w-8 h-8 rounded-full shadow-lg"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                  <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-black text-sm font-bold shadow-glow">
                                    ${market.symbol.slice(0, 1)}
                                  </div>
                                `;
                                  }
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-text-default">{market.symbol}</div>
                                <div className="text-sm text-muted">{market.base_asset}/{market.quote_asset}</div>
                              </div>
                              {market.is_active && (
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                              )}
                            </motion.button>
                          );
                        })}

                      {markets.filter(market =>
                        market.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        market.base_asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        market.quote_asset.toLowerCase().includes(searchTerm.toLowerCase())
                      ).length === 0 && searchTerm && (
                          <div className="p-6 text-center text-muted">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No markets found matching "{searchTerm}"</p>
                          </div>
                        )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Click outside to close */}
              {isDropdownOpen && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setSearchTerm('');
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedMarket && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Chart */}
          <div className="lg:col-span-2 flex flex-col">
            <Chart
              data={chartData}
              symbol={selectedMarket.symbol}
              chartType="tradingview"
              className="flex-1 min-h-[400px]"
            />
          </div>

          {/* Order Entry */}
          <div>
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">Place Order</h3>
                <OrderEntry
                  symbol={selectedMarket.symbol}
                  price={8.5} // Default price, will be updated with real-time data
                />
              </div>
            </Card>
          </div>

          {/* Orderbook */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">Orderbook</h3>
                {orderbook ? (
                  <Orderbook
                    {...convertOrderbookData(orderbook)}
                    currentPrice={8.5} // Default price, will be updated with real-time data
                    onPriceClick={(price: number) => {
                      // TODO: Fill price in order entry
                      console.log('Selected price:', price);
                    }}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-400">Loading orderbook...</div>
                )}
              </div>
            </Card>
          </div>

          {/* Market Info */}
          <div>
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">Market Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Symbol:</span>
                    <span>{selectedMarket.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Base Asset:</span>
                    <span>{selectedMarket.base_asset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quote Asset:</span>
                    <span>{selectedMarket.quote_asset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Min Order:</span>
                    <span>{selectedMarket.min_order_size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Order:</span>
                    <span>{selectedMarket.max_order_size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tick Size:</span>
                    <span>{selectedMarket.tick_size}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trade;