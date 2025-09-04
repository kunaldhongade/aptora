-- Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    order_type VARCHAR NOT NULL, -- 'market', 'limit', 'stop'
    side VARCHAR NOT NULL, -- 'buy', 'sell'
    quantity DOUBLE PRECISION NOT NULL,
    price DOUBLE PRECISION, -- NULL for market orders
    status VARCHAR NOT NULL, -- 'pending', 'filled', 'cancelled', 'rejected'
    filled_quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
    average_price DOUBLE PRECISION, -- NULL until order is filled
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_market_id ON orders(market_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_market_status ON orders(market_id, status);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
