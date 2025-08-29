use crate::{
    auth::extract_user_id_from_token,
    db::DbPool,
    models::{Market, MarketResponse, NewOrder, Order, OrderResponse},
    schema::{markets, orders},
    utils::{AppError, success_response, paginated_response},
};
use actix_web::{get, post, web, HttpRequest, HttpResponse, Query};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Deserialize)]
pub struct OrderbookQuery {
    pub market_id: Uuid,
    pub depth: Option<i32>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct PlaceOrderRequest {
    pub market_id: Uuid,
    #[validate(length(min = 1))]
    pub order_type: String, // "market", "limit", "stop"
    #[validate(length(min = 1))]
    pub side: String, // "buy", "sell"
    #[validate(range(min = 0.0))]
    pub quantity: f64,
    pub price: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct OrdersQuery {
    pub market_id: Option<Uuid>,
    pub status: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct OrderbookEntry {
    pub price: f64,
    pub quantity: f64,
    pub total: f64,
}

#[derive(Debug, Serialize)]
pub struct OrderbookResponse {
    pub market_id: Uuid,
    pub bids: Vec<OrderbookEntry>,
    pub asks: Vec<OrderbookEntry>,
    pub last_updated: String,
}

#[get("/markets")]
pub async fn get_markets(
    pool: web::Data<DbPool>,
) -> Result<HttpResponse, AppError> {
    let conn = &mut pool.get().map_err(|_| AppError::InternalServerError("Database connection failed".to_string()))?;
    
    let markets = markets::table
        .filter(markets::is_active.eq(true))
        .load::<Market>(conn)?;
    
    let market_responses: Vec<MarketResponse> = markets.into_iter().map(|m| m.into()).collect();
    
    Ok(success_response(market_responses))
}

#[get("/orderbook")]
pub async fn get_orderbook(
    pool: web::Data<DbPool>,
    query: Query<OrderbookQuery>,
) -> Result<HttpResponse, AppError> {
    let conn = &mut pool.get().map_err(|_| AppError::InternalServerError("Database connection failed".to_string()))?;
    
    // Verify market exists
    let market = markets::table
        .find(query.market_id)
        .first::<Market>(conn)
        .optional()?
        .ok_or_else(|| AppError::NotFoundError("Market not found".to_string()))?;
    
    if !market.is_active {
        return Err(AppError::ValidationError("Market is not active".to_string()));
    }
    
    let depth = query.depth.unwrap_or(20);
    
    // Get pending buy orders (bids)
    let bids = orders::table
        .filter(orders::market_id.eq(query.market_id))
        .filter(orders::side.eq("buy"))
        .filter(orders::status.eq("pending"))
        .order(orders::price.desc())
        .limit(depth)
        .load::<Order>(conn)?;
    
    // Get pending sell orders (asks)
    let asks = orders::table
        .filter(orders::market_id.eq(query.market_id))
        .filter(orders::side.eq("sell"))
        .filter(orders::status.eq("pending"))
        .order(orders::price.asc())
        .limit(depth)
        .load::<Order>(conn)?;
    
    // Aggregate orders by price
    let mut bid_map = std::collections::HashMap::new();
    for bid in bids {
        *bid_map.entry(bid.price.unwrap_or(0.0)).or_insert(0.0) += bid.quantity - bid.filled_quantity;
    }
    
    let mut ask_map = std::collections::HashMap::new();
    for ask in asks {
        *ask_map.entry(ask.price.unwrap_or(0.0)).or_insert(0.0) += ask.quantity - ask.filled_quantity;
    }
    
    // Convert to sorted vectors
    let mut bids: Vec<OrderbookEntry> = bid_map
        .into_iter()
        .map(|(price, quantity)| OrderbookEntry {
            price,
            quantity,
            total: price * quantity,
        })
        .collect();
    bids.sort_by(|a, b| b.price.partial_cmp(&a.price).unwrap());
    
    let mut asks: Vec<OrderbookEntry> = ask_map
        .into_iter()
        .map(|(price, quantity)| OrderbookEntry {
            price,
            quantity,
            total: price * quantity,
        })
        .collect();
    asks.sort_by(|a, b| a.price.partial_cmp(&b.price).unwrap());
    
    let response = OrderbookResponse {
        market_id: query.market_id,
        bids,
        asks,
        last_updated: chrono::Utc::now().to_rfc3339(),
    };
    
    Ok(success_response(response))
}

#[post("/orders")]
pub async fn place_order(
    pool: web::Data<DbPool>,
    req: HttpRequest,
    order_req: web::Json<PlaceOrderRequest>,
) -> Result<HttpResponse, AppError> {
    // Validate request
    order_req.validate().map_err(|e| AppError::ValidationError(e.to_string()))?;
    
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
    
    // Verify market exists and is active
    let market = markets::table
        .find(order_req.market_id)
        .first::<Market>(conn)
        .optional()?
        .ok_or_else(|| AppError::NotFoundError("Market not found".to_string()))?;
    
    if !market.is_active {
        return Err(AppError::ValidationError("Market is not active".to_string()));
    }
    
    // Validate order parameters
    if order_req.quantity < market.min_order_size || order_req.quantity > market.max_order_size {
        return Err(AppError::ValidationError(format!(
            "Order quantity must be between {} and {}",
            market.min_order_size, market.max_order_size
        )));
    }
    
    // Create new order
    let new_order = NewOrder {
        user_id,
        market_id: order_req.market_id,
        order_type: order_req.order_type.clone(),
        side: order_req.side.clone(),
        quantity: order_req.quantity,
        price: order_req.price,
        status: "pending".to_string(),
        filled_quantity: 0.0,
        average_price: None,
    };
    
    let order: Order = diesel::insert_into(orders::table)
        .values(&new_order)
        .get_result(conn)?;
    
    Ok(success_response(order.into()))
}

#[get("/orders")]
pub async fn get_orders(
    pool: web::Data<DbPool>,
    req: HttpRequest,
    query: Query<OrdersQuery>,
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
    
    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(20).min(100); // Max 100 per page
    let offset = (page - 1) * per_page;
    
    // Build query
    let mut query_builder = orders::table
        .filter(orders::user_id.eq(user_id))
        .into_boxed();
    
    if let Some(market_id) = query.market_id {
        query_builder = query_builder.filter(orders::market_id.eq(market_id));
    }
    
    if let Some(ref status) = query.status {
        query_builder = query_builder.filter(orders::status.eq(status));
    }
    
    // Get total count
    let total = query_builder.clone().count().get_result::<i64>(conn)?;
    
    // Get orders with pagination
    let orders = query_builder
        .order(orders::created_at.desc())
        .offset(offset)
        .limit(per_page)
        .load::<Order>(conn)?;
    
    let order_responses: Vec<OrderResponse> = orders.into_iter().map(|o| o.into()).collect();
    
    Ok(paginated_response(order_responses, page, per_page, total))
}
