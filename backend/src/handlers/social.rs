use actix_web::{web, HttpResponse, HttpRequest};
use crate::DbPool;
use crate::social::SocialService;
use crate::utils::{AppError, ApiResponse};
use serde::{Deserialize, Serialize};
use serde_json;
use uuid::Uuid;
// use rust_decimal::Decimal;

// Request/Response structs
#[derive(Debug, Deserialize)]
pub struct FollowRequest {
    pub username: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfileRequest {
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ReferralInfoResponse {
    pub referral_code: String,
    pub referral_count: i32,
    pub total_rewards: Option<f64>,
}

// Follow a user
#[actix_web::post("/follow")]
pub async fn follow_user(
    pool: web::Data<DbPool>,
    req: HttpRequest,
    request: web::Json<FollowRequest>,
) -> Result<HttpResponse, AppError> {
    // Extract user ID from token
    let user_id = extract_user_id_from_token(&req)?;
    
    // Follow the user
    SocialService::follow_user(&pool, user_id, &request.username).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(
        serde_json::json!({
            "message": format!("Successfully followed @{}", request.username)
        })
    )))
}

// Unfollow a user
#[actix_web::delete("/follow/{username}")]
pub async fn unfollow_user(
    pool: web::Data<DbPool>,
    req: HttpRequest,
    username: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    // Extract user ID from token
    let user_id = extract_user_id_from_token(&req)?;
    
    // Unfollow the user
    SocialService::unfollow_user(&pool, user_id, &username).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(
        serde_json::json!({
            "message": format!("Successfully unfollowed @{}", username)
        })
    )))
}

// Get followers of a user
#[actix_web::get("/followers/{username}")]
pub async fn get_followers(
    pool: web::Data<DbPool>,
    username: web::Path<String>,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, AppError> {
    let limit = query.get("limit").and_then(|s| s.parse::<i64>().ok()).unwrap_or(20);
    let offset = query.get("offset").and_then(|s| s.parse::<i64>().ok()).unwrap_or(0);
    
    let followers = SocialService::get_followers(&pool, &username, limit, offset).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(followers)))
}

// Get users that a user is following
#[actix_web::get("/following/{username}")]
pub async fn get_following(
    pool: web::Data<DbPool>,
    username: web::Path<String>,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, AppError> {
    let limit = query.get("limit").and_then(|s| s.parse::<i64>().ok()).unwrap_or(20);
    let offset = query.get("offset").and_then(|s| s.parse::<i64>().ok()).unwrap_or(0);
    
    let following = SocialService::get_following(&pool, &username, limit, offset).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(following)))
}

// Get follow statistics for a user
#[actix_web::get("/stats/{username}")]
pub async fn get_follow_stats(
    pool: web::Data<DbPool>,
    username: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    let stats = SocialService::get_follow_stats(&pool, &username).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(stats)))
}

// Get public user profile by username
#[actix_web::get("/profile/{username}")]
pub async fn get_public_profile(
    pool: web::Data<DbPool>,
    username: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    let profile = SocialService::get_public_profile(&pool, &username).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(profile)))
}

// Update user profile
#[actix_web::put("/profile")]
pub async fn update_profile(
    pool: web::Data<DbPool>,
    req: HttpRequest,
    request: web::Json<UpdateProfileRequest>,
) -> Result<HttpResponse, AppError> {
    // Extract user ID from token
    let user_id = extract_user_id_from_token(&req)?;
    
    // Update profile
    SocialService::update_profile(&pool, user_id, request.bio.clone(), request.avatar_url.clone()).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(
        serde_json::json!({
            "message": "Profile updated successfully"
        })
    )))
}

// Get referral leaderboard
#[actix_web::get("/referral-leaderboard")]
pub async fn get_referral_leaderboard(
    pool: web::Data<DbPool>,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, AppError> {
    let limit = query.get("limit").and_then(|s| s.parse::<i64>().ok()).unwrap_or(50);
    
    let leaderboard = SocialService::get_referral_leaderboard(&pool, limit).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(leaderboard)))
}

// Get user's referral information
#[actix_web::get("/referral-info")]
pub async fn get_referral_info(
    pool: web::Data<DbPool>,
    req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    // Extract user ID from token
    let user_id = extract_user_id_from_token(&req)?;
    
    // Get referral code
    let referral_code = SocialService::get_referral_code(&pool, user_id).await?;
    
    // Get user profile to get referral stats
    let profile = SocialService::get_public_profile(&pool, &referral_code).await?;
    
    let response = ReferralInfoResponse {
        referral_code,
        referral_count: profile.referral_count.unwrap_or(0),
        total_rewards: None, // PublicUserProfile doesn't expose total_referral_rewards for privacy
    };
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(response)))
}

// Check if current user is following another user
#[actix_web::get("/is-following/{username}")]
pub async fn check_following_status(
    pool: web::Data<DbPool>,
    req: HttpRequest,
    username: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    // Extract user ID from token
    let user_id = extract_user_id_from_token(&req)?;
    
    // Check if following
    let is_following = SocialService::is_following(&pool, user_id, &username).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(
        serde_json::json!({
            "username": username.as_str(),
            "is_following": is_following
        })
    )))
}

// Get users that the current user has referred
#[actix_web::get("/referred-users")]
pub async fn get_referred_users(
    pool: web::Data<DbPool>,
    req: HttpRequest,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, AppError> {
    // Extract user ID from token
    let user_id = extract_user_id_from_token(&req)?;
    
    let limit = query.get("limit").and_then(|s| s.parse::<i64>().ok()).unwrap_or(20);
    let offset = query.get("offset").and_then(|s| s.parse::<i64>().ok()).unwrap_or(0);
    
    let referred_users = SocialService::get_referred_users(&pool, user_id, limit, offset).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(referred_users)))
}

// Helper function to extract user ID from token
fn extract_user_id_from_token(req: &HttpRequest) -> Result<Uuid, AppError> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::AuthenticationError("Missing authorization header".to_string()))?;
    
    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::AuthenticationError("Invalid authorization header format".to_string()))?;
    
    let claims = crate::auth::AuthService::verify_access_token(token)?;
    let user_id = claims.sub.parse::<Uuid>()
        .map_err(|_| AppError::AuthenticationError("Invalid user ID in token".to_string()))?;
    
    Ok(user_id)
}

// Get all users for discovery
#[actix_web::get("/users")]
pub async fn get_all_users(
    pool: web::Data<DbPool>,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, AppError> {
    let limit = query.get("limit").and_then(|s| s.parse::<i64>().ok()).unwrap_or(50);
    let offset = query.get("offset").and_then(|s| s.parse::<i64>().ok()).unwrap_or(0);
    
    let users = SocialService::get_all_users(&pool, limit, offset).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(users)))
}
