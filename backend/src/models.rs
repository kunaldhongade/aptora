use crate::schema::*;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Queryable, Selectable, Identifiable)]
#[diesel(table_name = users)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Insertable)]
#[diesel(table_name = users)]
pub struct NewUser {
    pub email: String,
    pub username: String,
    pub password_hash: String,
}

#[derive(Debug, Serialize, Deserialize, Queryable, Selectable, Identifiable)]
#[diesel(table_name = markets)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct Market {
    pub id: Uuid,
    pub symbol: String,
    pub base_asset: String,
    pub quote_asset: String,
    pub min_order_size: f64,
    pub max_order_size: f64,
    pub tick_size: f64,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Insertable)]
#[diesel(table_name = markets)]
pub struct NewMarket {
    pub symbol: String,
    pub base_asset: String,
    pub quote_asset: String,
    pub min_order_size: f64,
    pub max_order_size: f64,
    pub tick_size: f64,
    pub is_active: bool,
}

#[derive(Debug, Serialize, Deserialize, Queryable, Selectable, Identifiable)]
#[diesel(table_name = orders)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct Order {
    pub id: Uuid,
    pub user_id: Uuid,
    pub market_id: Uuid,
    pub order_type: String, // "market", "limit", "stop"
    pub side: String,        // "buy", "sell"
    pub quantity: f64,
    pub price: Option<f64>,
    pub status: String, // "pending", "filled", "cancelled", "rejected"
    pub filled_quantity: f64,
    pub average_price: Option<f64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Insertable)]
#[diesel(table_name = orders)]
pub struct NewOrder {
    pub user_id: Uuid,
    pub market_id: Uuid,
    pub order_type: String,
    pub side: String,
    pub quantity: f64,
    pub price: Option<f64>,
    pub status: String,
    pub filled_quantity: f64,
    pub average_price: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Queryable, Selectable, Identifiable)]
#[diesel(table_name = balances)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct Balance {
    pub id: Uuid,
    pub user_id: Uuid,
    pub asset: String,
    pub available: f64,
    pub locked: f64,
    pub total: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Insertable)]
#[diesel(table_name = balances)]
pub struct NewBalance {
    pub user_id: Uuid,
    pub asset: String,
    pub available: f64,
    pub locked: f64,
    pub total: f64,
}

// Response models for API
#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
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

#[derive(Debug, Serialize, Deserialize)]
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
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BalanceResponse {
    pub asset: String,
    pub available: f64,
    pub locked: f64,
    pub total: f64,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            email: user.email,
            username: user.username,
            created_at: user.created_at,
        }
    }
}

impl From<Market> for MarketResponse {
    fn from(market: Market) -> Self {
        Self {
            id: market.id,
            symbol: market.symbol,
            base_asset: market.base_asset,
            quote_asset: market.quote_asset,
            min_order_size: market.min_order_size,
            max_order_size: market.max_order_size,
            tick_size: market.tick_size,
            is_active: market.is_active,
        }
    }
}

impl From<Order> for OrderResponse {
    fn from(order: Order) -> Self {
        Self {
            id: order.id,
            market_id: order.market_id,
            order_type: order.order_type,
            side: order.side,
            quantity: order.quantity,
            price: order.price,
            status: order.status,
            filled_quantity: order.filled_quantity,
            average_price: order.average_price,
            created_at: order.created_at,
        }
    }
}

impl From<Balance> for BalanceResponse {
    fn from(balance: Balance) -> Self {
        Self {
            asset: balance.asset,
            available: balance.available,
            locked: balance.locked,
            total: balance.total,
        }
    }
}
