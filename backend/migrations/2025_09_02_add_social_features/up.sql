-- Add referral fields to users table
ALTER TABLE users 
ADD COLUMN referred_by UUID REFERENCES users(id),
ADD COLUMN referral_count INTEGER DEFAULT 0,
ADD COLUMN total_referral_rewards DOUBLE PRECISION DEFAULT 0,
ADD COLUMN bio TEXT,
ADD COLUMN avatar_url TEXT,
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN last_active TIMESTAMPTZ DEFAULT NOW();

-- Create follows table for social graph
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Create referral_rewards table to track referral rewards
CREATE TABLE referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_amount DOUBLE PRECISION NOT NULL,
    reward_type VARCHAR(50) NOT NULL, -- 'signup', 'trade', 'deposit', etc.
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    UNIQUE(referred_user_id) -- Each user can only be referred once
);

-- Create indexes for better performance
CREATE INDEX idx_users_referred_by ON users(referred_by);
CREATE INDEX idx_users_referral_count ON users(referral_count);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_follows_created ON follows(created_at);
CREATE INDEX idx_referral_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX idx_referral_rewards_status ON referral_rewards(status);

-- Add trigger to update referral count when new follows are added
CREATE OR REPLACE FUNCTION update_referral_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users 
        SET referral_count = referral_count + 1 
        WHERE id = NEW.referred_by;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users 
        SET referral_count = referral_count - 1 
        WHERE id = OLD.referred_by;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_referral_count
    AFTER INSERT OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_referral_count();
