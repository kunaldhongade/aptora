use crate::DbPool;
use crate::models::*;
use crate::utils::{ApiResponse, AppError, PaginatedResponse};
use crate::kana_client::KanaClient;
use actix_web::{web, HttpResponse};
use diesel::prelude::*;
use diesel::r2d2::ConnectionManager;
use serde::{Deserialize, Serialize};
use validator::Validate;
// use rust_decimal::Decimal;
// use rust_decimal_macros::dec;

// Request models
#[derive(Debug, Deserialize, Validate)]
pub struct PlaceOrderRequest {
    #[validate(length(min = 1))]
    pub symbol: String,
    #[validate(length(min = 1))]
    pub side: String, // "buy" or "sell"
    #[validate(length(min = 1))]
    pub order_type: String, // "market" or "limit"
    #[validate(range(min = 0.001))]
    pub size: f64,
    pub price: Option<f64>,
    pub leverage: Option<f64>,
    pub margin_type: Option<String>, // "isolated" or "cross"
}

#[derive(Debug, Deserialize, Validate)]
pub struct GetOrderbookRequest {
    #[validate(length(min = 1))]
    pub symbol: String,
    pub depth: Option<u32>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct GetOrdersQuery {
    pub symbol: Option<String>,
    pub status: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

// Get all markets from Kana Labs
#[actix_web::get("/markets")]
pub async fn get_markets(pool: web::Data<DbPool>) -> Result<HttpResponse, AppError> {
    let kana_client = KanaClient::new()?;
    let markets = kana_client.get_markets().await?;

    // Convert Kana markets to our format
    let market_responses: Vec<MarketResponse> = markets
        .into_iter()
        .map(|kana_market| MarketResponse {
            id: uuid::Uuid::new_v4(), // Generate a local ID
            symbol: kana_market.symbol,
            base_asset: kana_market.base_asset,
            quote_asset: kana_market.quote_asset,
            min_order_size: 0.001, // Default minimum
            max_order_size: 1000000.0, // Default maximum
            tick_size: 0.01, // Default tick size
            is_active: true,
        })
        .collect();

    Ok(HttpResponse::Ok().json(ApiResponse::success(market_responses)))
}

// Get orderbook for a specific market
#[actix_web::get("/orderbook/{symbol}")]
pub async fn get_orderbook(
    query: web::Query<GetOrderbookRequest>,
    pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    query.validate().map_err(|e| AppError::ValidationError(e.to_string()))?;

    let kana_client = KanaClient::new()?;
    let orderbook = kana_client.get_orderbook(&query.symbol, query.depth).await?;

    // Convert Kana orderbook to our format
    let bids: Vec<OrderbookEntry> = orderbook.bids
        .into_iter()
        .map(|entry| OrderbookEntry {
            price: entry.price,
            quantity: entry.size,
            total: entry.price * entry.size,
        })
        .collect();

    let asks: Vec<OrderbookEntry> = orderbook.asks
        .into_iter()
        .map(|entry| OrderbookEntry {
            price: entry.price,
            quantity: entry.size,
            total: entry.price * entry.size,
        })
        .collect();

    let orderbook_response = OrderbookResponse {
        market_id: uuid::Uuid::new_v4(), // Generate a local ID
        bids,
        asks,
        last_updated: orderbook.timestamp,
    };

    Ok(HttpResponse::Ok().json(ApiResponse::success(orderbook_response)))
}

// Place an order through Kana Labs
#[actix_web::post("/orders")]
pub async fn place_order(
    order_data: web::Json<PlaceOrderRequest>,
    pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let order_data = order_data.into_inner();
    order_data.validate().map_err(|e| AppError::ValidationError(e.to_string()))?;

    let kana_client = KanaClient::new()?;
    
    // Convert to Kana Labs format
    let kana_order = KanaOrderRequest {
        symbol: order_data.symbol.clone(),
        side: order_data.side.clone(),
        order_type: order_data.order_type.clone(),
        size: order_data.size,
        price: order_data.price,
        leverage: order_data.leverage,
        margin_type: order_data.margin_type.clone(),
    };

    let kana_response = kana_client.place_order(&kana_order).await?;

    // Convert response to our format
    let order_response = OrderResponse {
        id: uuid::Uuid::new_v4(), // Generate a local ID
        market_id: uuid::Uuid::new_v4(), // Generate a local market ID
        order_type: kana_response.order_type,
        side: kana_response.side,
        quantity: kana_response.size,
        price: kana_response.price,
        status: kana_response.status,
        filled_quantity: kana_response.filled_size,
        average_price: kana_response.average_price,
        leverage: order_data.leverage,
        margin_type: order_data.margin_type.clone(),
        created_at: kana_response.created_at,
    };

    Ok(HttpResponse::Ok().json(ApiResponse::success(order_response)))
}

// Get user orders from Kana Labs
#[actix_web::get("/orders")]
pub async fn get_orders(
    query: web::Query<GetOrdersQuery>,
    pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    // For now, we'll need to get the wallet address from the authenticated user
    // This is a placeholder - you'll need to implement proper wallet address mapping
    let wallet_address = "placeholder_wallet_address"; // TODO: Get from user session
    
    let kana_client = KanaClient::new()?;
    let orders = kana_client.get_orders(wallet_address, query.symbol.as_deref()).await?;

    // Convert to our format
    let order_responses: Vec<OrderResponse> = orders
        .into_iter()
        .map(|kana_order| OrderResponse {
            id: uuid::Uuid::new_v4(),
            market_id: uuid::Uuid::new_v4(),
            order_type: kana_order.order_type,
            side: kana_order.side,
            quantity: kana_order.size,
            price: kana_order.price,
            status: kana_order.status,
            filled_quantity: kana_order.filled_size,
            average_price: kana_order.average_price,
            leverage: None, // Not provided by Kana API
            margin_type: None, // Not provided by Kana API
            created_at: kana_order.created_at,
        })
        .collect();

    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(20).min(100);
    let total = order_responses.len() as i64;

    let paginated_response = PaginatedResponse::new(order_responses, page, per_page, total);

    Ok(HttpResponse::Ok().json(paginated_response))
}

// Cancel an order
#[actix_web::delete("/orders/{order_id}")]
pub async fn cancel_order(
    order_id: web::Path<String>,
    pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let kana_client = KanaClient::new()?;
    kana_client.cancel_order(&order_id).await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success_with_message(
        (),
        "Order cancelled successfully".to_string(),
    )))
}

// Get user positions from Kana Labs
#[actix_web::get("/positions")]
pub async fn get_positions(pool: web::Data<DbPool>) -> Result<HttpResponse, AppError> {
    // For now, we'll need to get the wallet address from the authenticated user
    let wallet_address = "placeholder_wallet_address"; // TODO: Get from user session
    
    let kana_client = KanaClient::new()?;
    let positions = kana_client.get_positions(wallet_address).await?;

    // Convert to our format
    let position_responses: Vec<PositionResponse> = positions
        .into_iter()
        .map(|kana_position| PositionResponse {
            id: uuid::Uuid::new_v4(),
            market_id: uuid::Uuid::new_v4(),
            side: kana_position.side,
            size: kana_position.size,
            entry_price: kana_position.entry_price,
            mark_price: kana_position.mark_price,
            unrealized_pnl: kana_position.unrealized_pnl,
            realized_pnl: kana_position.realized_pnl,
            margin: kana_position.margin,
            leverage: kana_position.leverage,
            liquidation_price: kana_position.liquidation_price,
            created_at: chrono::Utc::now(), // Not provided by Kana API
        })
        .collect();

    Ok(HttpResponse::Ok().json(ApiResponse::success(position_responses)))
}

// Get funding rate for a market
#[actix_web::get("/funding-rate/{symbol}")]
pub async fn get_funding_rate(
    symbol: web::Path<String>,
    pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let kana_client = KanaClient::new()?;
    let funding_rate = kana_client.get_funding_rate(&symbol).await?;

    #[derive(Serialize)]
    struct FundingRateResponse {
        symbol: String,
        funding_rate: f64,
    }

    let response = FundingRateResponse {
        symbol: symbol.to_string(),
        funding_rate,
    };

    Ok(HttpResponse::Ok().json(ApiResponse::success(response)))
}

// Get market price
#[actix_web::get("/price/{symbol}")]
pub async fn get_market_price(
    symbol: web::Path<String>,
    pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let kana_client = KanaClient::new()?;
    let price = kana_client.get_market_price(&symbol).await?;

    #[derive(Serialize)]
    struct PriceResponse {
        symbol: String,
        price: f64,
        timestamp: chrono::DateTime<chrono::Utc>,
    }

    let response = PriceResponse {
        symbol: symbol.to_string(),
        price,
        timestamp: chrono::Utc::now(),
    };

    Ok(HttpResponse::Ok().json(ApiResponse::success(response)))
}
