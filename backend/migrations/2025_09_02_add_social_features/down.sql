-- Drop trigger and function
DROP TRIGGER IF EXISTS trigger_update_referral_count ON users;
DROP FUNCTION IF EXISTS update_referral_count();

-- Drop indexes
DROP INDEX IF EXISTS idx_referral_rewards_status;
DROP INDEX IF EXISTS idx_referral_rewards_referrer;
DROP INDEX IF EXISTS idx_follows_created;
DROP INDEX IF EXISTS idx_follows_following;
DROP INDEX IF EXISTS idx_follows_follower;
DROP INDEX IF EXISTS idx_users_referral_count;
DROP INDEX IF EXISTS idx_users_referred_by;

-- Drop tables
DROP TABLE IF EXISTS referral_rewards;
DROP TABLE IF EXISTS follows;

-- Remove columns from users table
ALTER TABLE users 
DROP COLUMN IF EXISTS referred_by,
DROP COLUMN IF EXISTS referral_count,
DROP COLUMN IF EXISTS total_referral_rewards,
DROP COLUMN IF EXISTS bio,
DROP COLUMN IF EXISTS avatar_url,
DROP COLUMN IF EXISTS is_verified,
DROP COLUMN IF EXISTS last_active;

