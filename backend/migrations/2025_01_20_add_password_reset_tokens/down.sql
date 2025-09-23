-- Drop password reset tokens table
DROP TABLE IF EXISTS password_reset_tokens CASCADE;

-- Drop the cleanup function
DROP FUNCTION IF EXISTS cleanup_expired_password_reset_tokens();
