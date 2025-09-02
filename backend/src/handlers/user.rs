use crate::{
    DbPool,
    models::User,
    schema::users,
    utils::{ApiResponse, AppError},
    kana_client::KanaClient,
};
use actix_web::{get, put, web, HttpRequest, HttpResponse};
use diesel::prelude::*;
use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateProfileRequest {
    #[validate(length(min = 3, max = 50))]
    pub username: Option<String>,
}

// Get user profile
#[get("/profile")]
pub async fn get_profile(
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
    
    let claims = crate::auth::AuthService::verify_access_token(token)
        .map_err(|_| AppError::AuthenticationError("Invalid token".to_string()))?;
    let user_id = claims.sub.parse::<uuid::Uuid>()
        .map_err(|_| AppError::AuthenticationError("Invalid user ID in token".to_string()))?;
    
    let conn = &mut pool.get().map_err(|_| AppError::InternalServerError("Database connection failed".to_string()))?;
    
    let user = users::table
        .find(user_id)
        .first::<User>(conn)
        .optional()?
        .ok_or_else(|| AppError::NotFoundError("User not found".to_string()))?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(user)))
}

// Update user profile
#[put("/profile")]
pub async fn update_profile(
    pool: web::Data<DbPool>,
    req: HttpRequest,
    profile_data: web::Json<UpdateProfileRequest>,
) -> Result<HttpResponse, AppError> {
    // Validate request
    profile_data.validate().map_err(|e| AppError::ValidationError(e.to_string()))?;
    
    // Extract user ID from token
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::AuthenticationError("Missing authorization header".to_string()))?;
    
    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::AuthenticationError("Invalid authorization header format".to_string()))?;
    
    let claims = crate::auth::AuthService::verify_access_token(token)
        .map_err(|_| AppError::AuthenticationError("Invalid token".to_string()))?;
    let user_id = claims.sub.parse::<uuid::Uuid>()
        .map_err(|_| AppError::AuthenticationError("Invalid user ID in token".to_string()))?;
    
    let conn = &mut pool.get().map_err(|_| AppError::InternalServerError("Database connection failed".to_string()))?;
    
    // Update user profile
    let updated_user = diesel::update(users::table.find(user_id))
        .set((
            users::username.eq(profile_data.username.as_ref().unwrap_or(&"".to_string())),
            users::updated_at.eq(chrono::Utc::now()),
        ))
        .get_result::<User>(conn)?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(updated_user)))
}

// Get user balance from Kana Labs
#[get("/balance")]
pub async fn get_balance(
    _pool: web::Data<DbPool>,
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
    
    let claims = crate::auth::AuthService::verify_access_token(token)
        .map_err(|_| AppError::AuthenticationError("Invalid token".to_string()))?;
    let _user_id = claims.sub.parse::<uuid::Uuid>()
        .map_err(|_| AppError::AuthenticationError("Invalid user ID in token".to_string()))?;
    
    // For now, we'll need to get the wallet address from the user
    // This is a placeholder - you'll need to implement proper wallet address mapping
    let wallet_address = "placeholder_wallet_address"; // TODO: Get from user session
    
    let kana_client = KanaClient::new()?;
    let balances = kana_client.get_balance(wallet_address).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(balances)))
}
