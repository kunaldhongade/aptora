use crate::auth::{
    AuthService, LoginRequest as AuthLoginRequest, RegisterRequest as AuthRegisterRequest,
};
use crate::email::{EmailService, PasswordResetEmail};
use crate::models::PasswordResetToken;
use crate::schema::{password_reset_tokens, users};
use crate::utils::{ApiResponse, AppError};
use crate::DbPool;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{Duration, Utc};
use diesel::prelude::*;
use rand::distributions::Alphanumeric;
use rand::{thread_rng, Rng};
use uuid::Uuid;

use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 3, max = 50))]
    pub username: String,
    #[validate(length(min = 6))]
    pub password: String,
    pub referral_code: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(email)]
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

#[derive(Debug, Deserialize)]
pub struct LogoutRequest {
    pub refresh_token: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct ForgotPasswordRequest {
    #[validate(email)]
    pub email: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct ResetPasswordRequest {
    pub token: String,
    #[validate(length(min = 6))]
    pub new_password: String,
}

#[actix_web::post("/register")]
pub async fn register(
    pool: web::Data<DbPool>,
    request: web::Json<RegisterRequest>,
) -> Result<HttpResponse, AppError> {
    // Validate request
    request
        .validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {}", e)))?;

    // Convert to auth service request
    let auth_request = AuthRegisterRequest {
        email: request.email.clone(),
        username: request.username.clone(),
        password: request.password.clone(),
        referral_code: request.referral_code.clone(),
    };

    // Register user using auth service
    let auth_response = AuthService::register(&pool, auth_request).await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(auth_response)))
}

#[actix_web::post("/login")]
pub async fn login(
    pool: web::Data<DbPool>,
    request: web::Json<LoginRequest>,
) -> Result<HttpResponse, AppError> {
    // Validate request
    request
        .validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {}", e)))?;

    // Convert to auth service request
    let auth_request = AuthLoginRequest {
        email: request.email.clone(),
        password: request.password.clone(),
    };

    // Login user using auth service
    let auth_response = AuthService::login(&pool, auth_request).await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(auth_response)))
}

#[actix_web::post("/refresh")]
pub async fn refresh(
    pool: web::Data<DbPool>,
    request: web::Json<RefreshRequest>,
) -> Result<HttpResponse, AppError> {
    // Refresh token using auth service
    let refresh_response = AuthService::refresh_token(&pool, &request.refresh_token).await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(refresh_response)))
}

#[actix_web::post("/logout")]
pub async fn logout(
    pool: web::Data<DbPool>,
    request: web::Json<LogoutRequest>,
) -> Result<HttpResponse, AppError> {
    // Logout user using auth service
    AuthService::logout(&pool, &request.refresh_token).await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(())))
}

#[derive(Debug, Serialize)]
struct UsernameAvailabilityResponse {
    username: String,
    available: bool,
}

#[actix_web::get("/check-username/{username}")]
pub async fn check_username(
    pool: web::Data<DbPool>,
    username: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    let is_available = AuthService::check_username_availability(&pool, &username).await?;

    let response = UsernameAvailabilityResponse {
        username: username.to_string(),
        available: is_available,
    };

    Ok(HttpResponse::Ok().json(ApiResponse::success(response)))
}

pub async fn me(pool: web::Data<DbPool>, req: HttpRequest) -> Result<HttpResponse, AppError> {
    // Extract user ID from token
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::AuthenticationError("Missing authorization header".to_string()))?;

    let token = auth_header.strip_prefix("Bearer ").ok_or_else(|| {
        AppError::AuthenticationError("Invalid authorization header format".to_string())
    })?;

    let claims = AuthService::verify_access_token(token)?;
    let user_profile = AuthService::get_user_profile(&pool, claims.sub.parse().unwrap()).await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(user_profile)))
}

// Forgot Password - Send reset email
#[actix_web::post("/forgot-password")]
pub async fn forgot_password(
    pool: web::Data<DbPool>,
    request: web::Json<ForgotPasswordRequest>,
) -> Result<HttpResponse, AppError> {
    // Validate request
    request
        .validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {}", e)))?;

    let conn = &mut pool
        .get()
        .map_err(|_| AppError::InternalServerError("Database connection failed".to_string()))?;

    // Check if user exists
    let user = users::table
        .filter(users::email.eq(&request.email))
        .first::<crate::models::User>(conn)
        .optional()
        .map_err(|_| AppError::InternalServerError("Database error".to_string()))?;

    // Always return success to prevent email enumeration attacks
    if user.is_none() {
        return Ok(HttpResponse::Ok().json(ApiResponse::success_with_message(
            (),
            "If an account with that email exists, a password reset link has been sent."
                .to_string(),
        )));
    }

    let user = user.unwrap();

    // Generate secure reset token
    let reset_token: String = thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .map(char::from)
        .collect();

    // Set token expiration (1 hour from now)
    let expires_at = Utc::now() + Duration::hours(1);

    // Invalidate any existing reset tokens for this user
    // Note: We'll continue even if this fails to prevent blocking password resets
    if let Err(e) = diesel::delete(password_reset_tokens::table)
        .filter(password_reset_tokens::user_id.eq(user.id))
        .execute(conn)
    {
        log::warn!(
            "Failed to invalidate existing tokens for user {}: {}",
            user.id,
            e
        );
        // Continue with creating new token instead of failing
    }

    // Create new reset token
    let new_reset_token = PasswordResetToken {
        id: Uuid::new_v4(),
        user_id: user.id,
        token: reset_token.clone(),
        expires_at,
        used: Some(false),
        created_at: Utc::now(),
    };

    diesel::insert_into(password_reset_tokens::table)
        .values(&new_reset_token)
        .execute(conn)
        .map_err(|e| {
            log::error!("Failed to create reset token: {}", e);
            AppError::InternalServerError("Failed to create reset token".to_string())
        })?;

    // Send reset email
    let email_service = EmailService::new().map_err(|_| {
        AppError::InternalServerError("Email service initialization failed".to_string())
    })?;

    let email_data = PasswordResetEmail {
        to: user.email.clone(),
        username: user.username.clone(),
        reset_token: reset_token.clone(),
        reset_url: format!(
            "https://aptora-kana.netlify.app/reset-password?token={}",
            reset_token
        ),
    };

    if let Err(e) = email_service.send_password_reset_email(email_data).await {
        log::error!("Failed to send password reset email: {}", e);
        // Don't fail the request, just log the error
    }

    Ok(HttpResponse::Ok().json(ApiResponse::success_with_message(
        (),
        "If an account with that email exists, a password reset link has been sent.".to_string(),
    )))
}

// Reset Password - Validate token and update password
#[actix_web::post("/reset-password")]
pub async fn reset_password(
    pool: web::Data<DbPool>,
    request: web::Json<ResetPasswordRequest>,
) -> Result<HttpResponse, AppError> {
    // Validate request
    request
        .validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {}", e)))?;

    let conn = &mut pool
        .get()
        .map_err(|_| AppError::InternalServerError("Database connection failed".to_string()))?;

    // Find valid reset token
    let reset_token = password_reset_tokens::table
        .filter(password_reset_tokens::token.eq(&request.token))
        .filter(
            password_reset_tokens::used
                .eq(false)
                .or(password_reset_tokens::used.is_null()),
        )
        .filter(password_reset_tokens::expires_at.gt(Utc::now()))
        .first::<PasswordResetToken>(conn)
        .optional()
        .map_err(|_| AppError::InternalServerError("Database error".to_string()))?;

    if reset_token.is_none() {
        return Err(AppError::BadRequest(
            "Invalid or expired reset token".to_string(),
        ));
    }

    let reset_token = reset_token.unwrap();

    // Hash new password
    use argon2::{
        password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
        Argon2,
    };
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(request.new_password.as_bytes(), &salt)
        .map_err(|_| AppError::InternalServerError("Password hashing failed".to_string()))?;

    // Update user password
    diesel::update(users::table.find(reset_token.user_id))
        .set((
            users::password_hash.eq(password_hash.to_string()),
            users::updated_at.eq(Utc::now()),
        ))
        .execute(conn)
        .map_err(|_| AppError::InternalServerError("Failed to update password".to_string()))?;

    // Mark reset token as used
    diesel::update(password_reset_tokens::table.find(reset_token.id))
        .set(password_reset_tokens::used.eq(true))
        .execute(conn)
        .map_err(|_| AppError::InternalServerError("Failed to mark token as used".to_string()))?;

    // Invalidate all user sessions (force re-login)
    diesel::delete(crate::schema::sessions::table)
        .filter(crate::schema::sessions::user_id.eq(reset_token.user_id))
        .execute(conn)
        .map_err(|_| AppError::InternalServerError("Failed to invalidate sessions".to_string()))?;

    Ok(HttpResponse::Ok().json(ApiResponse::success_with_message(
        (),
        "Password has been reset successfully. Please log in with your new password.".to_string(),
    )))
}
