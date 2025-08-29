use actix_web::{get, HttpResponse};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct HealthResponse {
    pub status: String,
    pub timestamp: String,
    pub version: String,
}

#[get("/health")]
pub async fn health_check() -> HttpResponse {
    use chrono::Utc;
    
    let health = HealthResponse {
        status: "ok".to_string(),
        timestamp: Utc::now().to_rfc3339(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    };
    
    HttpResponse::Ok().json(health)
}
