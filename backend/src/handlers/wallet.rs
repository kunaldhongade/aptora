use crate::kana_client::KanaClient;
use crate::utils::{ApiResponse, AppError};
use actix_web::{web, HttpResponse, Result};

// Get profile address for a user address
#[actix_web::get("/profile-address")]
pub async fn get_profile_address(
    user_address: web::Query<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    let user_address = user_address
        .get("userAddress")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::ValidationError("userAddress parameter is required".to_string()))?;

    // For now, return fallback data since Kana Labs API is having issues
    let profile_address = serde_json::json!({
        "profileAddress": format!("profile_{}", user_address),
        "userAddress": user_address,
        "timestamp": chrono::Utc::now().to_rfc3339()
    });

    Ok(HttpResponse::Ok().json(ApiResponse::success(profile_address)))
}

// Get wallet account balance
#[actix_web::get("/account-balance")]
pub async fn get_wallet_account_balance(
    user_address: web::Query<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    let user_address = user_address
        .get("userAddress")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::ValidationError("userAddress parameter is required".to_string()))?;

    let kana_client = KanaClient::new()?;
    let balances = kana_client.get_wallet_account_balance(user_address).await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(balances)))
}

// Get profile balance snapshot
#[actix_web::get("/profile-balance-snapshot")]
pub async fn get_profile_balance_snapshot(
    user_address: web::Query<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    let user_address = user_address
        .get("userAddress")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::ValidationError("userAddress parameter is required".to_string()))?;

    let kana_client = KanaClient::new()?;
    let balance_snapshot = kana_client.get_profile_balance_snapshot(user_address).await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(balance_snapshot)))
}

// Create deposit payload
#[actix_web::get("/deposit")]
pub async fn create_deposit_payload(
    params: web::Query<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    let user_address = params
        .get("userAddress")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::ValidationError("userAddress parameter is required".to_string()))?;

    let amount = params
        .get("amount")
        .and_then(|v| v.as_str())
        .and_then(|s| s.parse::<u64>().ok())
        .ok_or_else(|| AppError::ValidationError("amount parameter is required and must be a number".to_string()))?;

    let kana_client = KanaClient::new()?;
    let deposit_payload = kana_client.create_deposit_payload(user_address, amount).await?;

    Ok(HttpResponse::Ok().json(deposit_payload))
}

// Create withdraw specific market payload
#[actix_web::get("/withdraw-specific-market")]
pub async fn create_withdraw_specific_market_payload(
    params: web::Query<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    let user_address = params
        .get("userAddress")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::ValidationError("userAddress parameter is required".to_string()))?;

    let market_id = params
        .get("marketId")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::ValidationError("marketId parameter is required".to_string()))?;

    let amount = params
        .get("amount")
        .and_then(|v| v.as_str())
        .and_then(|s| s.parse::<u64>().ok())
        .ok_or_else(|| AppError::ValidationError("amount parameter is required and must be a number".to_string()))?;

    let kana_client = KanaClient::new()?;
    let withdraw_payload = kana_client
        .create_withdraw_specific_market_payload(user_address, market_id, amount)
        .await?;

    Ok(HttpResponse::Ok().json(withdraw_payload))
}

