use crate::models::*;
use crate::utils::AppError;
use reqwest::Client;
use serde_json::Value;
use std::env;
use futures;

pub struct KanaClient {
    client: Client,
    base_url: String,
    api_key: String,
}

impl KanaClient {
    pub fn new() -> Result<Self, AppError> {
        let api_key = env::var("KANA_API_KEY")
            .map_err(|_| AppError::ConfigurationError("KANA_API_KEY not set".to_string()))?;
        
        // Use the correct testnet URL from Kana Labs documentation
        let base_url = env::var("KANA_API_BASE_URL")
            .unwrap_or_else(|_| "https://perps-tradeapi.kanalabs.io".to_string());

        // Create client with timeout to prevent hanging requests
        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()
            .map_err(|e| AppError::ConfigurationError(format!("Failed to create HTTP client: {}", e)))?;

        Ok(Self {
            client,
            base_url,
            api_key,
        })
    }

    // Get all available markets
    pub async fn get_markets(&self) -> Result<Vec<KanaMarket>, AppError> {
        // Kana Labs API doesn't have a single endpoint for all markets
        // We need to call getMarketInfo for specific market IDs
        // For now, let's return a few popular markets
        let market_ids = vec!["1338", "1339", "1340", "2387"]; // APT, BTC, ETH, SOL
        
        // Make all API calls in parallel for better performance
        let futures: Vec<_> = market_ids.iter()
            .map(|market_id| self.get_market_info(market_id))
            .collect();
        
        let results = futures::future::join_all(futures).await;
        
        let mut markets = Vec::new();
        for (market_id, result) in market_ids.iter().zip(results) {
            match result {
                Ok(market) => markets.push(market),
                Err(e) => {
                    // Log error but continue with other markets
                    eprintln!("Failed to fetch market {}: {}", market_id, e);
                }
            }
        }

        Ok(markets)
    }

    // Get specific market info
    pub async fn get_market_info(&self, market_id: &str) -> Result<KanaMarket, AppError> {
        let url = format!("{}/getMarketInfo?marketId={}", self.base_url, market_id);
        
        let response = self.client
            .get(&url)
            .header("x-api-key", self.api_key.clone())
            .header("Content-Type", "application/json")
            .send()
            .await
            .map_err(|e| AppError::ExternalApiError(format!("Failed to fetch market info: {}", e)))?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AppError::ExternalApiError(format!(
                "Kana API error: {} - {}",
                status,
                error_text
            )));
        }

        // Parse the response - it should be wrapped in a success/data structure
        let response_data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AppError::ExternalApiError(format!("Failed to parse market info response: {}", e)))?;

        // Extract the market data from the response
        let market_data = response_data.get("data")
            .and_then(|data| data.as_array())
            .and_then(|arr| arr.first())
            .ok_or_else(|| AppError::ExternalApiError("Invalid market data format".to_string()))?;

        // Convert to KanaMarket struct
        let market = KanaMarket {
            symbol: market_data.get("base_name")
                .and_then(|v| v.as_str())
                .unwrap_or("UNKNOWN")
                .to_string(),
            base_asset: market_data.get("base_name")
                .and_then(|v| v.as_str())
                .unwrap_or("UNKNOWN")
                .to_string(),
            quote_asset: "USDC".to_string(), // Kana Labs uses USDC as quote
            price: 0.0, // Will be fetched separately
            change_24h: 0.0, // Will be fetched separately
            volume_24h: 0.0, // Will be fetched separately
            funding_rate: 0.0, // Will be fetched separately
            next_funding_time: chrono::Utc::now(),
            min_order_size: market_data.get("min_lots")
                .and_then(|v| v.as_str())
                .and_then(|s| s.parse::<f64>().ok())
                .unwrap_or(0.0),
            max_order_size: market_data.get("max_lots")
                .and_then(|v| v.as_str())
                .and_then(|s| s.parse::<f64>().ok())
                .unwrap_or(0.0),
            tick_size: market_data.get("lot_size")
                .and_then(|v| v.as_str())
                .and_then(|s| s.parse::<f64>().ok())
                .unwrap_or(0.0),
            is_active: market_data.get("market_status")
                .and_then(|v| v.as_u64())
                .map(|status| status == 1)
                .unwrap_or(false),
        };

        Ok(market)
    }

    // Get orderbook for a specific market
    pub async fn get_orderbook(&self, symbol: &str, depth: Option<u32>) -> Result<KanaOrderbook, AppError> {
        let depth = depth.unwrap_or(20);
        let url = format!("{}/orderbook/{}?depth={}", self.base_url, symbol, depth);
        
        let response = self.client
            .get(&url)
            .header("x-api-key", self.api_key.clone())
            .header("Content-Type", "application/json")
            .send()
            .await
            .map_err(|e| AppError::ExternalApiError(format!("Failed to fetch orderbook: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::ExternalApiError(format!(
                "Kana API error: {}",
                response.status()
            )));
        }

        let orderbook: KanaOrderbook = response.json().await
            .map_err(|e| AppError::ExternalApiError(format!("Failed to parse orderbook response: {}", e)))?;

        Ok(orderbook)
    }

    // Place an order
    pub async fn place_order(&self, order: &KanaOrderRequest) -> Result<KanaOrderResponse, AppError> {
        let url = format!("{}/orders", self.base_url);
        
        let response = self.client
            .post(&url)
            .header("x-api-key", self.api_key.clone())
            .header("Content-Type", "application/json")
            .json(order)
            .send()
            .await
            .map_err(|e| AppError::ExternalApiError(format!("Failed to place order: {}", e)))?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AppError::ExternalApiError(format!(
                "Kana API error: {} - {}",
                status,
                error_text
            )));
        }

        let order_response: KanaOrderResponse = response.json().await
            .map_err(|e| AppError::ExternalApiError(format!("Failed to parse order response: {}", e)))?;

        Ok(order_response)
    }

    // Get user positions
    pub async fn get_positions(&self, wallet_address: &str) -> Result<Vec<KanaPosition>, AppError> {
        let url = format!("{}/positions/{}", self.base_url, wallet_address);
        
        let response = self.client
            .get(&url)
            .header("x-api-key", self.api_key.clone())
            .header("Content-Type", "application/json")
            .send()
            .await
            .map_err(|e| AppError::ExternalApiError(format!("Failed to fetch positions: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::ExternalApiError(format!(
                "Kana API error: {}",
                response.status()
            )));
        }

        let positions: Vec<KanaPosition> = response.json().await
            .map_err(|e| AppError::ExternalApiError(format!("Failed to parse positions response: {}", e)))?;

        Ok(positions)
    }

    // Get user orders
    pub async fn get_orders(&self, wallet_address: &str, symbol: Option<&str>) -> Result<Vec<KanaOrderResponse>, AppError> {
        let mut url = format!("{}/orders/{}", self.base_url, wallet_address);
        if let Some(sym) = symbol {
            url.push_str(&format!("?symbol={}", sym));
        }
        
        let response = self.client
            .get(&url)
            .header("x-api-key", self.api_key.clone())
            .header("Content-Type", "application/json")
            .send()
            .await
            .map_err(|e| AppError::ExternalApiError(format!("Failed to fetch orders: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::ExternalApiError(format!(
                "Kana API error: {}",
                response.status()
            )));
        }

        let orders: Vec<KanaOrderResponse> = response.json().await
            .map_err(|e| AppError::ExternalApiError(format!("Failed to parse orders response: {}", e)))?;

        Ok(orders)
    }

    // Cancel an order
    pub async fn cancel_order(&self, order_id: &str) -> Result<(), AppError> {
        let url = format!("{}/orders/{}", self.base_url, order_id);
        
        let response = self.client
            .delete(&url)
            .header("x-api-key", self.api_key.clone())
            .header("Content-Type", "application/json")
            .send()
            .await
            .map_err(|e| AppError::ExternalApiError(format!("Failed to cancel order: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::ExternalApiError(format!(
                "Kana API error: {}",
                response.status()
            )));
        }

        Ok(())
    }

    // Get funding rate for a market
    pub async fn get_funding_rate(&self, symbol: &str) -> Result<f64, AppError> {
        let url = format!("{}/funding-rate/{}", self.base_url, symbol);
        
        let response = self.client
            .get(&url)
            .header("x-api-key", self.api_key.clone())
            .header("Content-Type", "application/json")
            .send()
            .await
            .map_err(|e| AppError::ExternalApiError(format!("Failed to fetch funding rate: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::ExternalApiError(format!(
                "Kana API error: {}",
                response.status()
            )));
        }

        let funding_data: Value = response.json().await
            .map_err(|e| AppError::ExternalApiError(format!("Failed to parse funding rate response: {}", e)))?;

        // Extract funding rate from response
        let funding_rate = funding_data["fundingRate"]
            .as_f64()
            .ok_or_else(|| AppError::ExternalApiError("Invalid funding rate response".to_string()))?;

        Ok(funding_rate)
    }

    // Get market price
    pub async fn get_market_price(&self, symbol: &str) -> Result<f64, AppError> {
        // For now, return mock prices based on symbol
        // In a real implementation, this would call a price endpoint from Kana Labs
        let price = match symbol.to_uppercase().as_str() {
            "APT/USDC" => 8.50,
            "BTC/USDC" => 45000.0,
            "ETH/USDC" => 2800.0,
            "SOL-USD" => 95.0,
            _ => 1.0, // Default price
        };

        Ok(price)
    }

    // Get user balance
    pub async fn get_balance(&self, wallet_address: &str) -> Result<Vec<Balance>, AppError> {
        let url = format!("{}/balance/{}", self.base_url, wallet_address);
        
        let response = self.client
            .get(&url)
            .header("x-api-key", self.api_key.clone())
            .header("Content-Type", "application/json")
            .send()
            .await
            .map_err(|e| AppError::ExternalApiError(format!("Failed to fetch balance: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::ExternalApiError(format!(
                "Kana API error: {}",
                response.status()
            )));
        }

        let balances: Vec<Balance> = response.json().await
            .map_err(|e| AppError::ExternalApiError(format!("Failed to parse balance response: {}", e)))?;

        Ok(balances)
    }
}
