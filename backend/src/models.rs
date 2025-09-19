use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
// use rust_decimal::Decimal;
// use rust_decimal_macros::dec;

// Database Models
#[derive(Debug, Clone, Serialize, Deserialize, Queryable)]
#[diesel(table_name = crate::schema::users)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub username: String,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub referred_by: Option<Uuid>,
    pub referral_count: Option<i32>,
    pub total_referral_rewards: Option<f64>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub is_verified: Option<bool>,
    pub last_active: Option<DateTime<Utc>>,
}

// Minimal User struct for basic authentication queries
#[derive(Debug, Clone, Serialize, Deserialize, Queryable)]
#[diesel(table_name = crate::schema::users)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct AuthUser {
    pub id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub username: String,
}

// Session Models for Refresh Tokens
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Selectable)]
#[diesel(table_name = crate::schema::sessions)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct Session {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub refresh_token_hash: String,
    pub created_at: Option<DateTime<Utc>>,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = crate::schema::sessions)]
pub struct NewSession {
    pub user_id: Uuid,
    pub refresh_token_hash: String,
    pub expires_at: DateTime<Utc>,
}

// Public User Profile (without password)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfile {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub is_verified: Option<bool>,
    pub referral_count: Option<i32>,
    pub total_referral_rewards: Option<f64>,
    pub last_active: Option<DateTime<Utc>>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

// New Models for Kana Labs Perps

// Kana Labs API Response Models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Balance {
    pub asset: String,
    pub available: f64,
    pub locked: f64,
    pub total: f64,
}

// Social Features Models
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Selectable)]
#[diesel(table_name = crate::schema::follows)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct Follow {
    pub id: Uuid,
    pub follower_id: Uuid,
    pub following_id: Uuid,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = crate::schema::follows)]
pub struct NewFollow {
    pub follower_id: Uuid,
    pub following_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Selectable)]
#[diesel(table_name = crate::schema::referral_rewards)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct ReferralReward {
    pub id: Uuid,
    pub referrer_id: Uuid,
    pub referred_user_id: Uuid,
    pub reward_amount: f64,
    pub reward_type: String,
    pub status: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub paid_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = crate::schema::referral_rewards)]
pub struct NewReferralReward {
    pub referrer_id: Uuid,
    pub referred_user_id: Uuid,
    pub reward_amount: f64,
    pub reward_type: String,
}

// Public User Profile (for other users to see)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublicUserProfile {
    pub id: Uuid,
    pub username: String,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub is_verified: Option<bool>,
    pub referral_count: Option<i32>,
    pub created_at: Option<DateTime<Utc>>,
    pub last_active: Option<DateTime<Utc>>,
}

// Referral Leaderboard Entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReferralLeaderboardEntry {
    pub username: String,
    pub referral_count: i32,
    pub total_rewards: Option<f64>,
    pub rank: i32,
}

// Follow Statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FollowStats {
    pub followers_count: i64,
    pub following_count: i64,
}

// Insert Models
#[derive(Debug, Insertable)]
#[diesel(table_name = crate::schema::users)]
pub struct NewUser {
    pub email: String,
    pub username: String,
    pub password_hash: String,
    pub referred_by: Option<Uuid>,
    pub referral_count: Option<i32>,
    pub total_referral_rewards: Option<f64>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub is_verified: Option<bool>,
    pub last_active: Option<chrono::DateTime<Utc>>,
}

//     pub size: f64,
//     pub entry_price: f64,
//     pub mark_price: f64,
//     pub margin: f64,
//     pub leverage: f64,
// }

// API Response Models
#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct MarketResponse {
    pub id: Uuid,
    pub symbol: String,
    pub base_asset: String,
    pub quote_asset: String,
    pub min_order_size: f64,
    pub max_order_size: f64,
    pub tick_size: f64,
    pub is_active: bool,
}

#[derive(Debug, Serialize)]
pub struct OrderResponse {
    pub id: Uuid,
    pub market_id: Uuid,
    pub order_type: String,
    pub side: String,
    pub quantity: f64,
    pub price: Option<f64>,
    pub status: String,
    pub filled_quantity: f64,
    pub average_price: Option<f64>,
    pub leverage: Option<f64>,
    pub margin_type: Option<String>,
    pub created_at: DateTime<Utc>,
    pub transaction_payload: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct BalanceResponse {
    pub asset: String,
    pub available: f64,
    pub locked: f64,
    pub total: f64,
}

#[derive(Debug, Serialize)]
pub struct PositionResponse {
    pub id: Uuid,
    pub market_id: Uuid,
    pub side: String,
    pub size: f64,
    pub entry_price: f64,
    pub mark_price: f64,
    pub unrealized_pnl: f64,
    pub realized_pnl: f64,
    pub margin: f64,
    pub leverage: f64,
    pub liquidation_price: Option<f64>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderbookEntry {
    pub price: f64,
    pub quantity: f64,
    pub total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderbookResponse {
    pub market_id: Uuid,
    pub bids: Vec<OrderbookEntry>,
    pub asks: Vec<OrderbookEntry>,
    pub last_updated: DateTime<Utc>,
}

// Kana Labs API Models
#[derive(Debug, Serialize, Deserialize)]
pub struct KanaMarket {
    pub symbol: String,
    pub base_asset: String,
    pub quote_asset: String,
    pub price: f64,
    pub change_24h: f64,
    pub volume_24h: f64,
    pub funding_rate: f64,
    pub next_funding_time: DateTime<Utc>,
    pub min_order_size: f64,
    pub max_order_size: f64,
    pub tick_size: f64,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KanaOrderbook {
    pub symbol: String,
    pub bids: Vec<KanaOrderbookEntry>,
    pub asks: Vec<KanaOrderbookEntry>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KanaOrderbookEntry {
    pub price: f64,
    pub size: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KanaOrderRequest {
    pub symbol: String,
    pub side: String,       // "buy" or "sell"
    pub order_type: String, // "market" or "limit"
    pub size: f64,
    pub price: Option<f64>,
    pub leverage: Option<f64>,
    pub margin_type: Option<String>, // "isolated" or "cross"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KanaOrderResponse {
    pub order_id: String,
    pub symbol: String,
    pub side: String,
    pub order_type: String,
    pub size: f64,
    pub price: Option<f64>,
    pub status: String,
    pub filled_quantity: f64,
    pub average_price: Option<f64>,
    pub created_at: DateTime<Utc>,
    pub transaction_payload: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KanaPosition {
    pub symbol: String,
    pub side: String,
    pub size: f64,
    pub entry_price: f64,
    pub mark_price: f64,
    pub unrealized_pnl: f64,
    pub realized_pnl: f64,
    pub margin: f64,
    pub leverage: f64,
    pub liquidation_price: Option<f64>,
}

// From implementations
// impl From<User> for UserResponse {
//     fn from(user: User) -> Self {
//         Self {
//             id: user.id,
//             email: user.email,
//             username: user.username,
//             created_at: user.created_at,
//         }
//     }
// }

// impl From<Market> for MarketResponse {
//     fn from(market: Market) -> Self {
//         Self {
//             id: market.id,
//             symbol: market.symbol,
//             base_asset: market.base_asset,
//             quote_asset: market.quote_asset,
//             min_order_size: market.min_order_size,
//             max_order_size: market.max_order_size,
//             tick_size: market.tick_size,
//             is_active: market.is_active,
//         }
//     }
// }

// impl From<Order> for OrderResponse {
//     fn from(order: Order) -> Self {
//         Self {
//             id: order.id,
//             market_id: order.market_id,
//             order_type: order.order_type,
//             side: order.side,
//             quantity: order.quantity,
//             price: order.price,
//             status: order.status,
//             filled_quantity: order.filled_quantity,
//             average_price: order.average_price,
//             leverage: order.leverage,
//             margin_type: order.margin_type,
//             created_at: order.created_at,
//         }
//     }
// }

// impl From<Balance> for BalanceResponse {
//     fn from(balance: Balance) -> Self {
//         Self {
//             id: balance.id,
//             asset: balance.asset,
//             available: balance.available,
//             locked: balance.locked,
//             total: balance.total,
//         }
//     }
// }

// impl From<Position> for PositionResponse {
//     fn from(position: Position) -> Self {
//         Self {
//             id: position.id,
//             market_id: position.market_id,
//             side: position.side,
//             size: position.size,
//             entry_price: position.entry_price,
//             mark_price: position.mark_price,
//             unrealized_pnl: position.unrealized_pnl,
//             realized_pnl: position.realized_pnl,
//             margin: position.margin,
//             leverage: position.leverage,
//             liquidation_price: position.liquidation_price,
//             created_at: position.created_at,
//         }
//     }
// }
