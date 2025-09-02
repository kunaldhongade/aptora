use actix_web::{web, HttpResponse, HttpRequest};
use crate::DbPool;
use crate::auth::{AuthService, RegisterRequest as AuthRegisterRequest, LoginRequest as AuthLoginRequest};
use crate::utils::{AppError, ApiResponse};

use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 3, max = 50))]
    pub username: String,
    #[validate(length(min = 6))]
    pub password: String,
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

#[actix_web::post("/register")]
pub async fn register(
    pool: web::Data<DbPool>,
    request: web::Json<RegisterRequest>,
) -> Result<HttpResponse, AppError> {
    // Validate request
    request.validate()
        .map_err(|e| AppError::BadRequest(format!("Validation error: {}", e)))?;

    // Convert to auth service request
    let auth_request = AuthRegisterRequest {
        email: request.email.clone(),
        username: request.username.clone(),
        password: request.password.clone(),
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
    request.validate()
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


pub async fn me(
    pool: web::Data<DbPool>,
    req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    // Extract user ID from token
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::AuthenticationError("Missing authorization header".to_string()))?;
    
    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::AuthenticationError("Invalid authorization header format".to_string()))?;
    
    let claims = AuthService::verify_access_token(token)?;
    let user_profile = AuthService::get_user_profile(&pool, claims.sub.parse().unwrap()).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(user_profile)))
}
