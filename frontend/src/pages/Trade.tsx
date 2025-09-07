import React, { useEffect, useState } from 'react';
import { Chart } from '../components/trading/Chart';
import { Orderbook } from '../components/trading/Orderbook';
import { OrderEntry } from '../components/trading/OrderEntry';
import { Card } from '../components/ui/Card';
import { apiClient, MarketResponse, OrderbookResponse } from '../lib/api';

const Trade: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState<MarketResponse | null>(null);
  const [markets, setMarkets] = useState<MarketResponse[]>([]);
  const [orderbook, setOrderbook] = useState<OrderbookResponse | null>(null);
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
      fetchChartData(selectedMarket.symbol);
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

  const fetchChartData = async (symbol: string) => {
    try {
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
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Trade</h1>
        <p className="text-gray-400">Trade perpetual futures with leverage</p>
      </div>

      {/* Market Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Market</label>
        <select
          value={selectedMarket?.symbol || ''}
          onChange={(e) => {
            const market = markets.find(m => m.symbol === e.target.value);
            setSelectedMarket(market || null);
          }}
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {markets.map((market) => (
            <option key={market.symbol} value={market.symbol}>
              {market.symbol} ({market.base_asset}/{market.quote_asset})
            </option>
          ))}
        </select>
      </div>

      {selectedMarket && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">{selectedMarket.symbol} Chart</h3>
                <Chart
                  data={chartData}
                  symbol={selectedMarket.symbol}
                />
              </div>
            </Card>
          </div>

          {/* Order Entry */}
          <div>
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">Place Order</h3>
                <OrderEntry
                  symbol={selectedMarket.symbol}
                  price={50000} // TODO: Get real-time price
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
                    currentPrice={50000} // TODO: Get real-time price
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