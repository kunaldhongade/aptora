-- Create markets table
CREATE TABLE markets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR NOT NULL UNIQUE,
    base_asset VARCHAR NOT NULL,
    quote_asset VARCHAR NOT NULL,
    min_order_size DOUBLE PRECISION NOT NULL,
    max_order_size DOUBLE PRECISION NOT NULL,
    tick_size DOUBLE PRECISION NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on symbol for faster lookups
CREATE INDEX idx_markets_symbol ON markets(symbol);

-- Create index on is_active for filtering active markets
CREATE INDEX idx_markets_is_active ON markets(is_active);
