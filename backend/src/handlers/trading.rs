use crate::DbPool;
use crate::models::*;
use crate::utils::{ApiResponse, AppError};
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
    pub depth: Option<u32>,
}


// Get all markets from Kana Labs
#[actix_web::get("/markets")]
pub async fn get_markets(_pool: web::Data<DbPool>) -> Result<HttpResponse, AppError> {
    // TODO: Add Redis caching here for better performance
    // For now, we'll rely on frontend caching
    
    let kana_client = KanaClient::new()?;
    
    // Get markets from KanaClient (which now returns fallback data)
    let kana_markets = kana_client.get_markets().await?;
    
    // Convert Kana markets to our MarketResponse format
    let market_responses: Vec<MarketResponse> = kana_markets.into_iter().map(|kana_market| {
        MarketResponse {
            id: uuid::Uuid::new_v4(), // Generate new UUID for our system
            symbol: kana_market.get("symbol").and_then(|v| v.as_str()).unwrap_or("UNKNOWN").to_string(),
            base_asset: kana_market.get("base_asset").and_then(|v| v.as_str()).unwrap_or("UNKNOWN").to_string(),
            quote_asset: kana_market.get("quote_asset").and_then(|v| v.as_str()).unwrap_or("USDC").to_string(),
            min_order_size: kana_market.get("min_order_size").and_then(|v| v.as_f64()).unwrap_or(0.0),
            max_order_size: kana_market.get("max_order_size").and_then(|v| v.as_f64()).unwrap_or(0.0),
            tick_size: kana_market.get("tick_size").and_then(|v| v.as_f64()).unwrap_or(0.0),
            is_active: kana_market.get("is_active").and_then(|v| v.as_bool()).unwrap_or(false),
        }
    }).collect();

    Ok(HttpResponse::Ok().json(ApiResponse::success(market_responses)))
}

// Get orderbook for a specific market
// Note: Kana Labs API doesn't have an orderbook endpoint, so we return mock data
#[actix_web::get("/orderbook/{symbol}")]
pub async fn get_orderbook(
    path: web::Path<String>,
    query: web::Query<GetOrderbookRequest>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let _symbol = path.into_inner();
    let _depth = query.depth.unwrap_or(20);
    
    // Return mock orderbook data since Kana Labs doesn't provide orderbook endpoint
    // In production, you would aggregate data from getAllTrades or use a different data source
    let orderbook_response = OrderbookResponse {
        market_id: uuid::Uuid::new_v4(),
        bids: vec![
            OrderbookEntry { price: 8.49, quantity: 100.0, total: 849.0 },
            OrderbookEntry { price: 8.48, quantity: 150.0, total: 1272.0 },
            OrderbookEntry { price: 8.47, quantity: 200.0, total: 1694.0 },
            OrderbookEntry { price: 8.46, quantity: 175.0, total: 1480.5 },
            OrderbookEntry { price: 8.45, quantity: 125.0, total: 1056.25 },
        ],
        asks: vec![
            OrderbookEntry { price: 8.51, quantity: 120.0, total: 1021.2 },
            OrderbookEntry { price: 8.52, quantity: 180.0, total: 1533.6 },
            OrderbookEntry { price: 8.53, quantity: 250.0, total: 2132.5 },
            OrderbookEntry { price: 8.54, quantity: 220.0, total: 1878.8 },
            OrderbookEntry { price: 8.55, quantity: 190.0, total: 1624.5 },
        ],
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
pub async fn get_orders(_pool: web::Data<DbPool>) -> Result<HttpResponse, AppError> {
    Err(AppError::ValidationError("This endpoint requires userAddress parameter. Use /trading/open-orders or /trading/order-history instead.".to_string()))
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
pub async fn get_positions(
    query: web::Query<serde_json::Value>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let user_address = query
        .get("userAddress")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::ValidationError("userAddress parameter is required".to_string()))?;
    
    let market_id = query
        .get("marketId")
        .and_then(|v| v.as_str());
    
    let kana_client = KanaClient::new()?;
    let positions = kana_client.get_positions_with_user_address(user_address, market_id).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(positions)))
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
    
    // Try to get price from Kana Labs API, fallback to mock data if it fails
    let price = match kana_client.get_market_price(&symbol).await {
        Ok(price) => price,
        Err(_) => {
            // Use fallback prices when Kana Labs API fails
            match symbol.as_str() {
                "APT/USDC" | "APT-USDC" => 8.50,
                "BTC/USDC" | "BTC-USDC" => 45000.0,
                "ETH/USDC" | "ETH-USDC" => 3200.0,
                "SOL/USDC" | "SOL-USDC" | "SOL-USD" => 95.0,
                _ => 0.0
            }
        }
    };
    
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

// Get chart data (trades) for a market
#[actix_web::get("/chart-data/{market_id}")]
pub async fn get_chart_data(
    market_id: web::Path<String>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let market_id = market_id.into_inner();
    let kana_client = KanaClient::new()?;
    
    let trades_data = kana_client.get_all_trades(&market_id).await?;
    
    // Transform the Kana Labs data into chart-friendly format
    let chart_data = if let Some(data_array) = trades_data.get("data").and_then(|d| d.as_array()) {
        data_array.iter().map(|trade| {
            let price = trade.get("price").and_then(|p| p.as_f64()).unwrap_or(0.0) / 1_000_000.0; // Convert from micro units
            let size = trade.get("size").and_then(|s| s.as_f64()).unwrap_or(0.0) / 1_000_000.0; // Convert from micro units
            let timestamp = trade.get("sequence_number_for_trade").and_then(|t| t.as_i64()).unwrap_or(0) as u64;
            
            serde_json::json!({
                "time": timestamp,
                "open": price,
                "high": price,
                "low": price,
                "close": price,
                "volume": size
            })
        }).collect::<Vec<_>>()
    } else {
        vec![]
    };
    
    Ok(HttpResponse::Ok().json(ApiResponse::success(chart_data)))
}

// Get open orders with user address
#[actix_web::get("/open-orders")]
pub async fn get_open_orders(
    params: web::Query<serde_json::Value>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let user_address = params
        .get("userAddress")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::ValidationError("userAddress parameter is required".to_string()))?;

    let market_id = params.get("marketId").and_then(|v| v.as_str());

    let kana_client = KanaClient::new()?;
    let orders = kana_client.get_open_orders(user_address, market_id).await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(orders)))
}

// Get order history with user address
#[actix_web::get("/order-history")]
pub async fn get_order_history(
    params: web::Query<serde_json::Value>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let user_address = params
        .get("userAddress")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::ValidationError("userAddress parameter is required".to_string()))?;

    let market_id = params.get("marketId").and_then(|v| v.as_str());

    let kana_client = KanaClient::new()?;
    let orders = kana_client.get_order_history(user_address, market_id).await?;

    Ok(HttpResponse::Ok().json(ApiResponse::success(orders)))
}


// Place limit order
#[actix_web::get("/place-limit-order")]
pub async fn place_limit_order(
    params: web::Query<serde_json::Value>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let market_id = params
        .get("marketId")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::ValidationError("marketId parameter is required".to_string()))?;

    let trade_side = params
        .get("tradeSide")
        .and_then(|v| v.as_bool())
        .ok_or_else(|| AppError::ValidationError("tradeSide parameter is required".to_string()))?;

    let direction = params
        .get("direction")
        .and_then(|v| v.as_bool())
        .ok_or_else(|| AppError::ValidationError("direction parameter is required".to_string()))?;

    let size = params
        .get("size")
        .and_then(|v| v.as_str())
        .and_then(|s| s.parse::<u64>().ok())
        .ok_or_else(|| AppError::ValidationError("size parameter is required and must be a number".to_string()))?;

    let price = params
        .get("price")
        .and_then(|v| v.as_str())
        .and_then(|s| s.parse::<u64>().ok())
        .ok_or_else(|| AppError::ValidationError("price parameter is required and must be a number".to_string()))?;

    let leverage = params
        .get("leverage")
        .and_then(|v| v.as_str())
        .and_then(|s| s.parse::<u64>().ok())
        .ok_or_else(|| AppError::ValidationError("leverage parameter is required and must be a number".to_string()))?;

    let kana_client = KanaClient::new()?;
    let result = kana_client
        .place_limit_order(market_id, trade_side, direction, size, price, leverage)
        .await?;

    Ok(HttpResponse::Ok().json(result))
}

// Cancel multiple orders
#[actix_web::post("/cancel-multiple-orders")]
pub async fn cancel_multiple_orders(
    order_ids: web::Json<Vec<String>>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let kana_client = KanaClient::new()?;
    let result = kana_client.cancel_multiple_orders(order_ids.into_inner()).await?;

    Ok(HttpResponse::Ok().json(result))
}

// Cancel and place multiple orders
#[actix_web::post("/cancel-and-place-multiple-orders")]
pub async fn cancel_and_place_multiple_orders(
    request: web::Json<serde_json::Value>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let cancel_order_ids = request
        .get("cancelOrderIds")
        .and_then(|v| v.as_array())
        .and_then(|arr| {
            arr.iter()
                .map(|v| v.as_str().map(|s| s.to_string()))
                .collect::<Option<Vec<String>>>()
        })
        .ok_or_else(|| AppError::ValidationError("cancelOrderIds parameter is required".to_string()))?;

    let new_orders = request
        .get("newOrders")
        .and_then(|v| v.as_array())
        .ok_or_else(|| AppError::ValidationError("newOrders parameter is required".to_string()))?
        .clone();

    let kana_client = KanaClient::new()?;
    let result = kana_client
        .cancel_and_place_multiple_orders(cancel_order_ids, new_orders)
        .await?;

    Ok(HttpResponse::Ok().json(result))
}

// Get order status by order ID
#[actix_web::get("/order-status")]
pub async fn get_order_status_by_order_id(
    params: web::Query<serde_json::Value>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let market_id = params
        .get("marketId")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::ValidationError("marketId parameter is required".to_string()))?;

    let order_id = params
        .get("orderId")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::ValidationError("orderId parameter is required".to_string()))?;

    let kana_client = KanaClient::new()?;
    let result = kana_client
        .get_order_status_by_order_id(market_id, order_id)
        .await?;

    Ok(HttpResponse::Ok().json(result))
}

// Get market price by market ID
#[actix_web::get("/market-price")]
pub async fn get_market_price_by_id(
    params: web::Query<serde_json::Value>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let market_id = params
        .get("marketId")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::ValidationError("marketId parameter is required".to_string()))?;

    let kana_client = KanaClient::new()?;
    let result = kana_client.get_market_price_by_id(market_id).await?;

    Ok(HttpResponse::Ok().json(result))
}

// Get last placed price
#[actix_web::get("/last-placed-price")]
pub async fn get_last_placed_price(
    params: web::Query<serde_json::Value>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let market_id = params
        .get("marketId")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::ValidationError("marketId parameter is required".to_string()))?;

    let kana_client = KanaClient::new()?;
    let result = kana_client.get_last_placed_price(market_id).await?;

    Ok(HttpResponse::Ok().json(result))
}

// Add margin
#[actix_web::get("/add-margin")]
pub async fn add_margin(
    params: web::Query<serde_json::Value>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let market_id = params
        .get("marketId")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::ValidationError("marketId parameter is required".to_string()))?;

    let trade_side = params
        .get("tradeSide")
        .and_then(|v| v.as_bool())
        .ok_or_else(|| AppError::ValidationError("tradeSide parameter is required".to_string()))?;

    let amount = params
        .get("amount")
        .and_then(|v| v.as_str())
        .and_then(|s| s.parse::<u64>().ok())
        .ok_or_else(|| AppError::ValidationError("amount parameter is required and must be a number".to_string()))?;

    let kana_client = KanaClient::new()?;
    let result = kana_client.add_margin(market_id, trade_side, amount).await?;

    Ok(HttpResponse::Ok().json(result))
}

// Collapse position
#[actix_web::get("/collapse-position")]
pub async fn collapse_position(
    params: web::Query<serde_json::Value>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let market_id = params
        .get("marketId")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::ValidationError("marketId parameter is required".to_string()))?;

    let kana_client = KanaClient::new()?;
    let result = kana_client.collapse_position(market_id).await?;

    Ok(HttpResponse::Ok().json(result))
}

// Settle PnL
#[actix_web::get("/settle-pnl")]
pub async fn settle_pnl(
    params: web::Query<serde_json::Value>,
    _pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let user_address = params
        .get("userAddress")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::ValidationError("userAddress parameter is required".to_string()))?;

    let market_id = params
        .get("marketId")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::ValidationError("marketId parameter is required".to_string()))?;

    let kana_client = KanaClient::new()?;
    let result = kana_client.settle_pnl(user_address, market_id).await?;

    Ok(HttpResponse::Ok().json(result))
}
