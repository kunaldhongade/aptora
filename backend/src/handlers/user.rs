use crate::{
    auth::extract_user_id_from_token,
    db::DbPool,
    models::{Balance, BalanceResponse, User, UserResponse},
    schema::{balances, users},
    utils::{AppError, success_response},
};
use actix_web::{get, put, web, HttpRequest, HttpResponse};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateProfileRequest {
    #[validate(length(min = 3, max = 50))]
    pub username: Option<String>,
}

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

#[put("/profile")]
pub async fn update_profile(
    pool: web::Data<DbPool>,
    req: HttpRequest,
    profile_req: web::Json<UpdateProfileRequest>,
) -> Result<HttpResponse, AppError> {
    // Validate request
    profile_req.validate().map_err(|e| AppError::ValidationError(e.to_string()))?;
    
    // Extract user ID from token
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::AuthenticationError("Missing authorization header".to_string()))?;
    
    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::AuthenticationError("Invalid authorization header format".to_string()))?;
    
    let user_id = extract_user_id_from_token(token)
        .map_err(|_| AppError::AuthenticationError("Invalid token".to_string()))?;
    
    let conn = &mut pool.get().map_err(|_| AppError::InternalServerError("Database connection failed".to_string()))?;
    
    // Check if username is being updated and if it's already taken
    if let Some(ref new_username) = profile_req.username {
        let existing_user = users::table
            .filter(users::username.eq(new_username))
            .filter(users::id.ne(user_id))
            .first::<User>(conn)
            .optional()?;
        
        if existing_user.is_some() {
            return Err(AppError::ValidationError("Username is already taken".to_string()));
        }
    }
    
    // Update user profile
    let mut update_data = diesel::dsl::update(users::table.filter(users::id.eq(user_id)));
    
    if let Some(ref username) = profile_req.username {
        update_data = update_data.set(users::username.eq(username));
    }
    
    update_data = update_data.set(users::updated_at.eq(chrono::Utc::now()));
    
    let updated_user: User = update_data.get_result(conn)?;
    
    Ok(success_response(updated_user.into()))
}

#[get("/balance")]
pub async fn get_balance(
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
    
    let user_id = extract_user_id_from_token(token)
        .map_err(|_| AppError::AuthenticationError("Invalid token".to_string()))?;
    
    let conn = &mut pool.get().map_err(|_| AppError::InternalServerError("Database connection failed".to_string()))?;
    
    // Get user balances
    let balances = balances::table
        .filter(balances::user_id.eq(user_id))
        .load::<Balance>(conn)?;
    
    let balance_responses: Vec<BalanceResponse> = balances.into_iter().map(|b| b.into()).collect();
    
    Ok(success_response(balance_responses))
}
