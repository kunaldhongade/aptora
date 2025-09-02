use crate::DbPool;
use crate::models::*;
use crate::utils::{ApiResponse, AppError, PaginatedResponse};
use actix_web::{web, HttpResponse};
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

// Get all markets (with dummy data for now)
#[actix_web::get("/markets")]
pub async fn get_markets(_pool: web::Data<DbPool>) -> Result<HttpResponse, AppError> {
    // Return dummy market data
    let market_responses: Vec<MarketResponse> = vec![
        MarketResponse {
            id: uuid::Uuid::new_v4(),
            symbol: "APT/USDT".to_string(),
            base_asset: "APT".to_string(),
            quote_asset: "USDT".to_string(),
            min_order_size: 0.1,
            max_order_size: 1000000.0,
            tick_size: 0.01,
            is_active: true,
        },
        MarketResponse {
            id: uuid::Uuid::new_v4(),
            symbol: "BTC/USDT".to_string(),
            base_asset: "BTC".to_string(),
            quote_asset: "USDT".to_string(),
            min_order_size: 0.001,
            max_order_size: 1000.0,
            tick_size: 0.1,
            is_active: true,
        },
        MarketResponse {
            id: uuid::Uuid::new_v4(),
            symbol: "ETH/USDT".to_string(),
            base_asset: "ETH".to_string(),
            quote_asset: "USDT".to_string(),
            min_order_size: 0.01,
            max_order_size: 10000.0,
            tick_size: 0.01,
            is_active: true,
        },
        MarketResponse {
            id: uuid::Uuid::new_v4(),
            symbol: "SOL/USDT".to_string(),
            base_asset: "SOL".to_string(),
            quote_asset: "USDT".to_string(),
            min_order_size: 0.1,
            max_order_size: 100000.0,
            tick_size: 0.01,
            is_active: true,
        },
    ];

    Ok(HttpResponse::Ok().json(ApiResponse::success(market_responses)))
}

// Get orderbook for a specific market (with dummy data)
#[actix_web::get("/orderbook/{symbol}")]
pub async fn get_orderbook(
    path: web::Path<String>,
    _query: web::Query<GetOrderbookRequest>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let symbol = path.into_inner();
    
    // Return dummy orderbook data
    let base_price = match symbol.as_str() {
        "APT/USDT" => 8.45,
        "BTC/USDT" => 43250.75,
        "ETH/USDT" => 2650.30,
        "SOL/USDT" => 98.45,
        _ => 100.0,
    };

    let bids: Vec<OrderbookEntry> = (1..=10).map(|i| {
        let price = base_price - (i as f64 * 0.01);
        let quantity = (100.0 + (i as f64 * 50.0)) / price;
        OrderbookEntry {
            price,
            quantity,
            total: price * quantity,
        }
    }).collect();

    let asks: Vec<OrderbookEntry> = (1..=10).map(|i| {
        let price = base_price + (i as f64 * 0.01);
        let quantity = (100.0 + (i as f64 * 50.0)) / price;
        OrderbookEntry {
            price,
            quantity,
            total: price * quantity,
        }
    }).collect();

    let orderbook_response = OrderbookResponse {
        market_id: uuid::Uuid::new_v4(),
        bids,
        asks,
        last_updated: chrono::Utc::now(),
    };

    Ok(HttpResponse::Ok().json(ApiResponse::success(orderbook_response)))
}

// Place an order (with dummy response for now)
#[actix_web::post("/orders")]
pub async fn place_order(
    order_data: web::Json<PlaceOrderRequest>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let order_data = order_data.into_inner();
    order_data.validate().map_err(|e| AppError::ValidationError(e.to_string()))?;

    // Return dummy order response
    let order_response = OrderResponse {
        id: uuid::Uuid::new_v4(),
        market_id: uuid::Uuid::new_v4(),
        order_type: order_data.order_type,
        side: order_data.side,
        quantity: order_data.size,
        price: Some(order_data.price.unwrap_or(0.0)),
        status: "pending".to_string(),
        filled_quantity: 0.0,
        average_price: Some(order_data.price.unwrap_or(0.0)),
        leverage: order_data.leverage,
        margin_type: order_data.margin_type,
        created_at: chrono::Utc::now(),
    };

    Ok(HttpResponse::Ok().json(ApiResponse::success(order_response)))
}

// Get user orders (with dummy data for now)
#[actix_web::get("/orders")]
pub async fn get_orders(
    query: web::Query<GetOrdersQuery>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    // Return dummy orders
    let order_responses: Vec<OrderResponse> = vec![
        OrderResponse {
            id: uuid::Uuid::new_v4(),
            market_id: uuid::Uuid::new_v4(),
            order_type: "limit".to_string(),
            side: "buy".to_string(),
            quantity: 10.0,
            price: Some(8.40),
            status: "filled".to_string(),
            filled_quantity: 10.0,
            average_price: Some(8.40),
            leverage: Some(10.0),
            margin_type: Some("isolated".to_string()),
            created_at: chrono::Utc::now() - chrono::Duration::hours(2),
        },
        OrderResponse {
            id: uuid::Uuid::new_v4(),
            market_id: uuid::Uuid::new_v4(),
            order_type: "market".to_string(),
            side: "sell".to_string(),
            quantity: 5.0,
            price: Some(8.50),
            status: "pending".to_string(),
            filled_quantity: 0.0,
            average_price: Some(0.0),
            leverage: Some(5.0),
            margin_type: Some("cross".to_string()),
            created_at: chrono::Utc::now() - chrono::Duration::minutes(30),
        },
    ];

    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(20).min(100);
    let total = order_responses.len() as i64;

    let paginated_response = PaginatedResponse::new(order_responses, page, per_page, total);

    Ok(HttpResponse::Ok().json(paginated_response))
}

// Cancel an order (dummy response)
#[actix_web::delete("/orders/{order_id}")]
pub async fn cancel_order(
    _order_id: web::Path<String>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    // Return dummy success response
    Ok(HttpResponse::Ok().json(ApiResponse::success_with_message(
        (),
        "Order cancelled successfully".to_string(),
    )))
}

// Get user positions (with dummy data)
#[actix_web::get("/positions")]
pub async fn get_positions(_pool: web::Data<DbPool>) -> Result<HttpResponse, AppError> {
    // Return dummy positions
    let position_responses: Vec<PositionResponse> = vec![
        PositionResponse {
            id: uuid::Uuid::new_v4(),
            market_id: uuid::Uuid::new_v4(),
            side: "long".to_string(),
            size: 100.0,
            entry_price: 8.40,
            mark_price: 8.45,
            unrealized_pnl: 5.0,
            realized_pnl: 0.0,
            margin: 84.0,
            leverage: 10.0,
            liquidation_price: Some(7.56),
            created_at: chrono::Utc::now() - chrono::Duration::hours(24),
        },
        PositionResponse {
            id: uuid::Uuid::new_v4(),
            market_id: uuid::Uuid::new_v4(),
            side: "short".to_string(),
            size: 50.0,
            entry_price: 2650.0,
            mark_price: 2650.30,
            unrealized_pnl: -15.0,
            realized_pnl: 0.0,
            margin: 265.0,
            leverage: 5.0,
            liquidation_price: Some(3180.0),
            created_at: chrono::Utc::now() - chrono::Duration::hours(12),
        },
    ];

    Ok(HttpResponse::Ok().json(ApiResponse::success(position_responses)))
}

// Get funding rate for a market (dummy data)
#[actix_web::get("/funding-rate/{symbol}")]
pub async fn get_funding_rate(
    symbol: web::Path<String>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    #[derive(Serialize)]
    struct FundingRateResponse {
        symbol: String,
        funding_rate: f64,
    }

    // Return dummy funding rate
    let response = FundingRateResponse {
        symbol: symbol.to_string(),
        funding_rate: 0.0001, // 0.01% funding rate
    };

    Ok(HttpResponse::Ok().json(ApiResponse::success(response)))
}

// Get market price (dummy data)
#[actix_web::get("/price/{symbol}")]
pub async fn get_market_price(
    symbol: web::Path<String>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    #[derive(Serialize)]
    struct PriceResponse {
        symbol: String,
        price: f64,
        timestamp: chrono::DateTime<chrono::Utc>,
    }

    // Return dummy price based on symbol
    let price = match symbol.as_str() {
        "APT/USDT" => 8.45,
        "BTC/USDT" => 43250.75,
        "ETH/USDT" => 2650.30,
        "SOL/USDT" => 98.45,
        _ => 100.0,
    };

    let response = PriceResponse {
        symbol: symbol.to_string(),
        price,
        timestamp: chrono::Utc::now(),
    };

    Ok(HttpResponse::Ok().json(ApiResponse::success(response)))
}
