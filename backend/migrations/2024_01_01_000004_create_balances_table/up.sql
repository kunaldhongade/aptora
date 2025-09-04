-- Create balances table
CREATE TABLE balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset VARCHAR NOT NULL,
    available DOUBLE PRECISION NOT NULL DEFAULT 0,
    locked DOUBLE PRECISION NOT NULL DEFAULT 0,
    total DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, asset)
);

-- Create indexes for better query performance
CREATE INDEX idx_balances_user_id ON balances(user_id);
CREATE INDEX idx_balances_asset ON balances(asset);
CREATE INDEX idx_balances_user_asset ON balances(user_id, asset);
