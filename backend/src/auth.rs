use crate::models::{User, NewUser, Session, NewSession, UserProfile, AuthUser};
use crate::schema::{users, sessions};
use crate::DbPool;
use crate::utils::AppError;
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier, password_hash::SaltString};
use chrono::{Duration, Utc};
use diesel::prelude::*;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation, Algorithm};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // user_id
    pub exp: i64,    // expiration time
    pub iat: i64,    // issued at
    pub email: String,
    pub username: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub username: String,
    pub password: String,
    pub referral_code: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub token_type: String,
    pub expires_in: i64,
    pub user: UserProfile,
}

#[derive(Debug, Serialize)]
pub struct RefreshResponse {
    pub access_token: String,
    pub token_type: String,
    pub expires_in: i64,
}

pub struct AuthService;

impl AuthService {
    pub fn new() -> Self {
        Self
    }
    // Hash password using Argon2id
    pub fn hash_password(password: &str) -> Result<String, AppError> {
        let salt = SaltString::generate(&mut rand::thread_rng());
        let argon2 = Argon2::default();
        
        argon2
            .hash_password(password.as_bytes(), &salt)
            .map(|hash| hash.to_string())
            .map_err(|e| AppError::InternalServerError(format!("Password hashing failed: {}", e)))
    }

    // Verify password against hash
    pub fn verify_password(password: &str, hash: &str) -> Result<bool, AppError> {
        let parsed_hash = PasswordHash::new(hash)
            .map_err(|e| AppError::InternalServerError(format!("Invalid hash format: {}", e)))?;
        
        Ok(Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok())
    }

    // Generate JWT access token (15 minutes)
    pub fn generate_access_token(user: &AuthUser) -> Result<String, AppError> {
        let secret = env::var("JWT_SECRET")
            .map_err(|_| AppError::ConfigurationError("JWT_SECRET not set".to_string()))?;
        
        let now = Utc::now();
        let expires_at = now + Duration::minutes(15);
        
        let claims = Claims {
            sub: user.id.to_string(),
            exp: expires_at.timestamp(),
            iat: now.timestamp(),
            email: user.email.clone(),
            username: user.username.clone(),
        };
        
        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(secret.as_ref()),
        )
        .map_err(|e| AppError::InternalServerError(format!("Token generation failed: {}", e)))
    }

    // Generate refresh token (30 days)
    pub fn generate_refresh_token() -> String {
        Uuid::new_v4().to_string()
    }

    // Verify JWT access token
    pub fn verify_access_token(token: &str) -> Result<Claims, AppError> {
        let secret = env::var("JWT_SECRET")
            .map_err(|_| AppError::ConfigurationError("JWT_SECRET not set".to_string()))?;
        
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_ref()),
            &Validation::new(Algorithm::HS256),
        )
        .map_err(|e| AppError::Unauthorized(format!("Invalid token: {}", e)))?;
        
        Ok(token_data.claims)
    }

    // Register new user
    pub async fn register(
        pool: &DbPool,
        request: RegisterRequest,
    ) -> Result<AuthResponse, AppError> {
        let conn = &mut pool.get()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get connection: {}", e)))?;

        // Check if email already exists
        let existing_user = users::table
            .filter(users::email.eq(&request.email))
            .select((users::id, users::email, users::password_hash, users::username))
            .first::<AuthUser>(conn)
            .optional()
            .map_err(|e| AppError::InternalServerError(format!("Database error: {}", e)))?;

        if existing_user.is_some() {
            return Err(AppError::BadRequest("Email already exists".to_string()));
        }

        // Check if username already exists
        let existing_username = users::table
            .filter(users::username.eq(&request.username))
            .select((users::id, users::email, users::password_hash, users::username))
            .first::<AuthUser>(conn)
            .optional()
            .map_err(|e| AppError::InternalServerError(format!("Database error: {}", e)))?;

        if existing_username.is_some() {
            return Err(AppError::BadRequest("Username already exists".to_string()));
        }

        // Handle referral if provided
        let mut referred_by = None;
        if let Some(ref referral_code) = request.referral_code {
            // Find referrer by username
            let referrer = users::table
                .filter(users::username.eq(referral_code))
                .select((users::id, users::email, users::password_hash, users::username))
                .first::<AuthUser>(conn)
                .optional()
                .map_err(|e| AppError::InternalServerError(format!("Database error: {}", e)))?;

            if let Some(referrer_user) = referrer {
                referred_by = Some(referrer_user.id);
            } else {
                return Err(AppError::BadRequest("Invalid referral code".to_string()));
            }
        }

        // Hash password
        let password_hash = Self::hash_password(&request.password)?;

        // Create new user with referral info
        let new_user = NewUser {
            email: request.email,
            username: request.username,
            password_hash,
            referred_by,
            referral_count: Some(0),
            total_referral_rewards: None,
            bio: None,
            avatar_url: None,
            is_verified: Some(false),
            last_active: Some(Utc::now()),
        };

        let user: User = diesel::insert_into(users::table)
            .values(&new_user)
            .get_result(conn)
            .map_err(|e| AppError::InternalServerError(format!("Failed to create user: {}", e)))?;

        // Generate tokens (using minimal user data for token)
        let auth_user = AuthUser {
            id: user.id,
            email: user.email.clone(),
            password_hash: user.password_hash.clone(),
            username: user.username.clone(),
        };
        let access_token = Self::generate_access_token(&auth_user)?;
        let refresh_token = Self::generate_refresh_token();
        let refresh_token_hash = Self::hash_password(&refresh_token)?;

        // Store refresh token in sessions table
        let session = NewSession {
            user_id: auth_user.id,
            refresh_token_hash,
            expires_at: Utc::now() + Duration::days(30),
        };

        diesel::insert_into(sessions::table)
            .values(&session)
            .execute(conn)
            .map_err(|e| AppError::InternalServerError(format!("Failed to create session: {}", e)))?;

        // Create user profile
        let user_profile = UserProfile {
            id: user.id,
            email: user.email,
            username: user.username,
            bio: user.bio,
            avatar_url: user.avatar_url,
            is_verified: user.is_verified,
            referral_count: user.referral_count,
            total_referral_rewards: user.total_referral_rewards,
            last_active: user.last_active,
            created_at: user.created_at,
            updated_at: user.updated_at,
        };

        Ok(AuthResponse {
            access_token,
            refresh_token,
            token_type: "Bearer".to_string(),
            expires_in: 900, // 15 minutes in seconds
            user: user_profile,
        })
    }

    // Login user
    pub async fn login(
        pool: &DbPool,
        request: LoginRequest,
    ) -> Result<AuthResponse, AppError> {
        let conn = &mut pool.get()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get connection: {}", e)))?;

        // Find user by email
        let user = users::table
            .filter(users::email.eq(&request.email))
            .select((users::id, users::email, users::password_hash, users::username))
            .first::<AuthUser>(conn)
            .optional()
            .map_err(|e| AppError::InternalServerError(format!("Database error: {}", e)))?
            .ok_or_else(|| AppError::Unauthorized("Invalid credentials".to_string()))?;

        // Verify password
        if !Self::verify_password(&request.password, &user.password_hash)? {
            return Err(AppError::Unauthorized("Invalid credentials".to_string()));
        }

        // Get full user profile data
        let full_user = users::table
            .find(user.id)
            .first::<User>(conn)
            .map_err(|e| AppError::InternalServerError(format!("Failed to get user profile: {}", e)))?;

        // Generate tokens
        let access_token = Self::generate_access_token(&user)?;
        let refresh_token = Self::generate_refresh_token();
        let refresh_token_hash = Self::hash_password(&refresh_token)?;

        // Store refresh token in sessions table
        let session = NewSession {
            user_id: user.id,
            refresh_token_hash,
            expires_at: Utc::now() + Duration::days(30),
        };

        diesel::insert_into(sessions::table)
            .values(&session)
            .execute(conn)
            .map_err(|e| AppError::InternalServerError(format!("Failed to create session: {}", e)))?;

        // Create user profile
        let user_profile = UserProfile {
            id: full_user.id,
            email: full_user.email,
            username: full_user.username,
            bio: full_user.bio,
            avatar_url: full_user.avatar_url,
            is_verified: full_user.is_verified,
            referral_count: full_user.referral_count,
            total_referral_rewards: full_user.total_referral_rewards,
            last_active: full_user.last_active,
            created_at: full_user.created_at,
            updated_at: full_user.updated_at,
        };

        Ok(AuthResponse {
            access_token,
            refresh_token,
            token_type: "Bearer".to_string(),
            expires_in: 900, // 15 minutes in seconds
            user: user_profile,
        })
    }

    // Refresh access token
    pub async fn refresh_token(
        pool: &DbPool,
        refresh_token: &str,
    ) -> Result<RefreshResponse, AppError> {
        let conn = &mut pool.get()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get connection: {}", e)))?;

        // Find session by refresh token hash
        let session = sessions::table
            .filter(sessions::refresh_token_hash.eq(&Self::hash_password(refresh_token)?))
            .filter(sessions::expires_at.gt(Utc::now()))
            .first::<Session>(conn)
            .optional()
            .map_err(|e| AppError::InternalServerError(format!("Database error: {}", e)))?
            .ok_or_else(|| AppError::Unauthorized("Invalid or expired refresh token".to_string()))?;

        // Get user
        let user_id = session.user_id.ok_or_else(|| AppError::InternalServerError("Session has no user_id".to_string()))?;
        let user = users::table
            .find(user_id)
            .select((users::id, users::email, users::password_hash, users::username))
            .first::<AuthUser>(conn)
            .map_err(|e| AppError::InternalServerError(format!("Failed to get user: {}", e)))?;

        // Generate new access token
        let access_token = Self::generate_access_token(&user)?;

        Ok(RefreshResponse {
            access_token,
            token_type: "Bearer".to_string(),
            expires_in: 900, // 15 minutes in seconds
        })
    }

    // Logout user (invalidate refresh token)
    pub async fn logout(
        pool: &DbPool,
        refresh_token: &str,
    ) -> Result<(), AppError> {
        let conn = &mut pool.get()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get connection: {}", e)))?;

        let refresh_token_hash = Self::hash_password(refresh_token)?;

        // Delete session
        diesel::delete(sessions::table)
            .filter(sessions::refresh_token_hash.eq(refresh_token_hash))
            .execute(conn)
            .map_err(|e| AppError::InternalServerError(format!("Failed to delete session: {}", e)))?;

        Ok(())
    }

    // Get user profile by ID
    pub async fn get_user_profile(
        pool: &DbPool,
        user_id: Uuid,
    ) -> Result<UserProfile, AppError> {
        let conn = &mut pool.get()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get connection: {}", e)))?;

        let user = users::table
            .find(user_id)
            .first::<User>(conn)
            .map_err(|e| AppError::InternalServerError(format!("Failed to get user: {}", e)))?;

        Ok(UserProfile {
            id: user.id,
            email: user.email,
            username: user.username,
            bio: user.bio,
            avatar_url: user.avatar_url,
            is_verified: user.is_verified,
            referral_count: user.referral_count,
            total_referral_rewards: user.total_referral_rewards,
            last_active: user.last_active,
            created_at: user.created_at,
            updated_at: user.updated_at,
        })
    }

    // Clean up expired sessions
    pub async fn cleanup_expired_sessions(pool: &DbPool) -> Result<usize, AppError> {
        let conn = &mut pool.get()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get connection: {}", e)))?;

        let deleted_count = diesel::delete(sessions::table)
            .filter(sessions::expires_at.lt(Utc::now()))
            .execute(conn)
            .map_err(|e| AppError::InternalServerError(format!("Failed to cleanup sessions: {}", e)))?;

        Ok(deleted_count)
    }

    // Check if username is available
    pub async fn check_username_availability(pool: &DbPool, username: &str) -> Result<bool, AppError> {
        let conn = &mut pool.get()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get connection: {}", e)))?;

        let existing_user = users::table
            .filter(users::username.eq(username))
            .select((users::id, users::email, users::password_hash, users::username))
            .first::<AuthUser>(conn)
            .optional()
            .map_err(|e| AppError::InternalServerError(format!("Database error: {}", e)))?;

        Ok(existing_user.is_none())
    }
}
