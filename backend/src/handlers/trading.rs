use crate::DbPool;
use crate::models::*;
use crate::utils::{ApiResponse, AppError, PaginatedResponse};
use crate::kana_client::KanaClient;
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

// Get all markets from Kana Labs
#[actix_web::get("/markets")]
pub async fn get_markets(_pool: web::Data<DbPool>) -> Result<HttpResponse, AppError> {
    let kana_client = KanaClient::new()?;
    let kana_markets = kana_client.get_markets().await?;
    
    // Convert Kana markets to our MarketResponse format
    let market_responses: Vec<MarketResponse> = kana_markets.into_iter().map(|kana_market| {
        MarketResponse {
            id: uuid::Uuid::new_v4(), // Generate new UUID for our system
            symbol: kana_market.symbol,
            base_asset: kana_market.base_asset,
            quote_asset: kana_market.quote_asset,
            min_order_size: kana_market.min_order_size,
            max_order_size: kana_market.max_order_size,
            tick_size: kana_market.tick_size,
            is_active: kana_market.is_active,
        }
    }).collect();

    Ok(HttpResponse::Ok().json(ApiResponse::success(market_responses)))
}

// Get orderbook for a specific market from Kana Labs
#[actix_web::get("/orderbook/{symbol}")]
pub async fn get_orderbook(
    path: web::Path<String>,
    query: web::Query<GetOrderbookRequest>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let symbol = path.into_inner();
    let kana_client = KanaClient::new()?;
    
    let kana_orderbook = kana_client.get_orderbook(&symbol, query.depth).await?;
    
    // Convert Kana orderbook to our OrderbookResponse format
    let bids: Vec<OrderbookEntry> = kana_orderbook.bids.into_iter().map(|bid| {
        OrderbookEntry {
            price: bid.price,
            quantity: bid.size, // Use size from Kana API
            total: bid.price * bid.size,
        }
    }).collect();

    let asks: Vec<OrderbookEntry> = kana_orderbook.asks.into_iter().map(|ask| {
        OrderbookEntry {
            price: ask.price,
            quantity: ask.size, // Use size from Kana API
            total: ask.price * ask.size,
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

// Place an order via Kana Labs
#[actix_web::post("/orders")]
pub async fn place_order(
    order_data: web::Json<PlaceOrderRequest>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let order_data = order_data.into_inner();
    order_data.validate().map_err(|e| AppError::ValidationError(e.to_string()))?;

    let kana_client = KanaClient::new()?;
    
    // Convert our order request to Kana Labs format
    let kana_order = KanaOrderRequest {
        symbol: order_data.symbol,
        side: order_data.side,
        order_type: order_data.order_type,
        size: order_data.size,
        price: order_data.price,
        leverage: order_data.leverage,
        margin_type: order_data.margin_type,
    };
    
    let kana_response = kana_client.place_order(&kana_order).await?;
    
    // Convert Kana response to our OrderResponse format
    let order_response = OrderResponse {
        id: uuid::Uuid::new_v4(), // Generate new UUID for our system
        market_id: uuid::Uuid::new_v4(),
        order_type: kana_response.order_type,
        side: kana_response.side,
        quantity: kana_response.size,
        price: kana_response.price,
        status: kana_response.status,
        filled_quantity: kana_response.filled_size, // Use filled_size from Kana API
        average_price: kana_response.average_price,
        leverage: Some(1.0), // Default to 1x leverage since not provided by Kana API
        margin_type: Some("cross".to_string()), // Default to cross margin since not provided by Kana API
        created_at: chrono::Utc::now(),
    };

    Ok(HttpResponse::Ok().json(ApiResponse::success(order_response)))
}

// Get user orders from Kana Labs
#[actix_web::get("/orders")]
pub async fn get_orders(
    query: web::Query<GetOrdersQuery>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    // Kana Labs API doesn't have a traditional orders endpoint
    // Return mock data for now until we implement proper order tracking
    let order_responses = vec![
        OrderResponse {
            id: uuid::Uuid::new_v4(),
            market_id: uuid::Uuid::new_v4(),
            order_type: "market".to_string(),
            side: "buy".to_string(),
            quantity: 100.0,
            price: Some(8.50),
            status: "filled".to_string(),
            filled_quantity: 100.0,
            average_price: Some(8.52),
            leverage: Some(10.0),
            margin_type: Some("cross".to_string()),
            created_at: chrono::Utc::now() - chrono::Duration::hours(2),
        },
        OrderResponse {
            id: uuid::Uuid::new_v4(),
            market_id: uuid::Uuid::new_v4(),
            order_type: "limit".to_string(),
            side: "sell".to_string(),
            quantity: 50.0,
            price: Some(9.00),
            status: "pending".to_string(),
            filled_quantity: 0.0,
            average_price: None,
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

// Cancel an order via Kana Labs
#[actix_web::delete("/orders/{order_id}")]
pub async fn cancel_order(
    order_id: web::Path<String>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let order_id = order_id.into_inner();
    let kana_client = KanaClient::new()?;
    
    kana_client.cancel_order(&order_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::success_with_message(
        (),
        "Order cancelled successfully".to_string(),
    )))
}

// Get user positions from Kana Labs
#[actix_web::get("/positions")]
pub async fn get_positions(_pool: web::Data<DbPool>) -> Result<HttpResponse, AppError> {
    // Kana Labs API doesn't have a traditional positions endpoint
    // Return mock data for now until we implement proper position tracking
    let position_responses = vec![
        PositionResponse {
            id: uuid::Uuid::new_v4(),
            market_id: uuid::Uuid::new_v4(),
            side: "long".to_string(),
            size: 100.0,
            entry_price: 8.50,
            mark_price: 8.75,
            unrealized_pnl: 25.0,
            realized_pnl: 0.0,
            margin: 85.0,
            leverage: 10.0,
            liquidation_price: Some(7.65),
            created_at: chrono::Utc::now() - chrono::Duration::hours(3),
        },
        PositionResponse {
            id: uuid::Uuid::new_v4(),
            market_id: uuid::Uuid::new_v4(),
            side: "short".to_string(),
            size: 50.0,
            entry_price: 45000.0,
            mark_price: 44800.0,
            unrealized_pnl: 100.0,
            realized_pnl: 0.0,
            margin: 2250.0,
            leverage: 5.0,
            liquidation_price: Some(47250.0),
            created_at: chrono::Utc::now() - chrono::Duration::hours(1),
        },
    ];

    Ok(HttpResponse::Ok().json(ApiResponse::success(position_responses)))
}

// Get funding rate for a market from Kana Labs
#[actix_web::get("/funding-rate/{symbol}")]
pub async fn get_funding_rate(
    symbol: web::Path<String>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let symbol = symbol.into_inner();
    let kana_client = KanaClient::new()?;
    
    let funding_rate = kana_client.get_funding_rate(&symbol).await?;
    
    #[derive(Serialize)]
    struct FundingRateResponse {
        symbol: String,
        funding_rate: f64,
    }

    let response = FundingRateResponse {
        symbol,
        funding_rate,
    };

    Ok(HttpResponse::Ok().json(ApiResponse::success(response)))
}

// Get market price from Kana Labs
#[actix_web::get("/price/{symbol}")]
pub async fn get_market_price(
    symbol: web::Path<String>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let symbol = symbol.into_inner();
    let kana_client = KanaClient::new()?;
    
    let price = kana_client.get_market_price(&symbol).await?;
    
    #[derive(Serialize)]
    struct PriceResponse {
        symbol: String,
        price: f64,
        timestamp: chrono::DateTime<chrono::Utc>,
    }

    let response = PriceResponse {
        symbol,
        price,
        timestamp: chrono::Utc::now(),
    };

    Ok(HttpResponse::Ok().json(ApiResponse::success(response)))
}
