-- Insert sample markets
INSERT INTO markets (symbol, base_asset, quote_asset, min_order_size, max_order_size, tick_size, is_active) VALUES
('BTC/USDT', 'BTC', 'USDT', 0.001, 1000.0, 0.01, true),
('ETH/USDT', 'ETH', 'USDT', 0.01, 10000.0, 0.01, true),
('SOL/USDT', 'SOL', 'USDT', 0.1, 100000.0, 0.01, true),
('ADA/USDT', 'ADA', 'USDT', 1.0, 1000000.0, 0.0001, true),
('DOT/USDT', 'DOT', 'USDT', 0.1, 100000.0, 0.01, true);

-- Insert sample user balances (you can modify these as needed)
-- Note: This will only work if you have a user with the specified ID
-- You may want to create a user first and then update this migration with the actual user ID
