use crate::{
    auth::{create_token, hash_password, verify_password, extract_user_id_from_token},
    db::DbPool,
    models::{NewUser, User, UserResponse},
    schema::{users},
    utils::{AppError, success_response},
};
use actix_web::{get, post, web, HttpRequest, HttpResponse};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
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

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub user: UserResponse,
    pub token: String,
    pub token_type: String,
    pub expires_in: i64,
}

#[post("/register")]
pub async fn register(
    pool: web::Data<DbPool>,
    req: web::Json<RegisterRequest>,
) -> Result<HttpResponse, AppError> {
    // Validate request
    req.validate().map_err(|e| AppError::ValidationError(e.to_string()))?;
    
    let conn = &mut pool.get().map_err(|_| AppError::InternalServerError("Database connection failed".to_string()))?;
    
    // Check if user already exists
    let existing_user = users::table
        .filter(users::email.eq(&req.email))
        .or_filter(users::username.eq(&req.username))
        .first::<User>(conn)
        .optional()?;
    
    if existing_user.is_some() {
        return Err(AppError::ValidationError("User with this email or username already exists".to_string()));
    }
    
    // Hash password
    let password_hash = hash_password(&req.password)
        .map_err(|_| AppError::InternalServerError("Failed to hash password".to_string()))?;
    
    // Create new user
    let new_user = NewUser {
        email: req.email.clone(),
        username: req.username.clone(),
        password_hash,
    };
    
    let user: User = diesel::insert_into(users::table)
        .values(&new_user)
        .get_result(conn)?;
    
    // Generate token
    let token = create_token(user.id)
        .map_err(|_| AppError::InternalServerError("Failed to create token".to_string()))?;
    
    let response = AuthResponse {
        user: user.into(),
        token,
        token_type: "Bearer".to_string(),
        expires_in: 86400, // 24 hours
    };
    
    Ok(success_response(response))
}

#[post("/login")]
pub async fn login(
    pool: web::Data<DbPool>,
    req: web::Json<LoginRequest>,
) -> Result<HttpResponse, AppError> {
    // Validate request
    req.validate().map_err(|e| AppError::ValidationError(e.to_string()))?;
    
    let conn = &mut pool.get().map_err(|_| AppError::InternalServerError("Database connection failed".to_string()))?;
    
    // Find user by email
    let user = users::table
        .filter(users::email.eq(&req.email))
        .first::<User>(conn)
        .optional()?
        .ok_or_else(|| AppError::AuthenticationError("Invalid email or password".to_string()))?;
    
    // Verify password
    let is_valid = verify_password(&req.password, &user.password_hash)
        .map_err(|_| AppError::InternalServerError("Failed to verify password".to_string()))?;
    
    if !is_valid {
        return Err(AppError::AuthenticationError("Invalid email or password".to_string()));
    }
    
    // Generate token
    let token = create_token(user.id)
        .map_err(|_| AppError::InternalServerError("Failed to create token".to_string()))?;
    
    let response = AuthResponse {
        user: user.into(),
        token,
        token_type: "Bearer".to_string(),
        expires_in: 86400, // 24 hours
    };
    
    Ok(success_response(response))
}

#[get("/me")]
pub async fn me(
    pool: web::Data<DbPool>,
    req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    // Extract token from Authorization header
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::AuthenticationError("Missing authorization header".to_string()))?;
    
    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::AuthenticationError("Invalid authorization header format".to_string()))?;
    
    // Extract user ID from token
    let user_id = extract_user_id_from_token(token)
        .map_err(|_| AppError::AuthenticationError("Invalid token".to_string()))?;
    
    let conn = &mut pool.get().map_err(|_| AppError::InternalServerError("Database connection failed".to_string()))?;
    
    // Get user from database
    let user = users::table
        .find(user_id)
        .first::<User>(conn)
        .optional()?
        .ok_or_else(|| AppError::NotFoundError("User not found".to_string()))?;
    
    Ok(success_response(user.into()))
}
