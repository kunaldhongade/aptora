use actix_web::{HttpResponse, ResponseError};
use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug)]
pub enum AppError {
    DatabaseError(diesel::result::Error),
    #[allow(dead_code)]
    DatabaseConnectionError(String),
    BadRequest(String),
    Unauthorized(String),
    ValidationError(String),
    AuthenticationError(String),
    #[allow(dead_code)]
    AuthorizationError(String),
    NotFoundError(String),
    InternalServerError(String),
    ConfigurationError(String),
    ExternalApiError(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::DatabaseError(err) => write!(f, "Database error: {}", err),
            AppError::DatabaseConnectionError(msg) => write!(f, "Database connection error: {}", msg),
            AppError::BadRequest(msg) => write!(f, "Bad request: {}", msg),
            AppError::Unauthorized(msg) => write!(f, "Unauthorized: {}", msg),
            AppError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
            AppError::AuthenticationError(msg) => write!(f, "Authentication error: {}", msg),
            AppError::AuthorizationError(msg) => write!(f, "Authorization error: {}", msg),
            AppError::NotFoundError(msg) => write!(f, "Not found: {}", msg),
            AppError::InternalServerError(msg) => write!(f, "Internal server error: {}", msg),
            AppError::ConfigurationError(msg) => write!(f, "Configuration error: {}", msg),
            AppError::ExternalApiError(msg) => write!(f, "External API error: {}", msg),
        }
    }
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        match self {
            AppError::DatabaseError(_) => {
                HttpResponse::InternalServerError().json(ApiResponse::<()> {
                    success: false,
                    data: None,
                    message: None,
                    error: Some("Database error occurred".to_string()),
                })
            }
            AppError::DatabaseConnectionError(msg) => {
                HttpResponse::InternalServerError().json(ApiResponse::<()> {
                    success: false,
                    data: None,
                    message: None,
                    error: Some(msg.clone()),
                })
            }
            AppError::BadRequest(msg) => {
                HttpResponse::BadRequest().json(ApiResponse::<()> {
                    success: false,
                    data: None,
                    message: None,
                    error: Some(msg.clone()),
                })
            }
            AppError::Unauthorized(msg) => {
                HttpResponse::Unauthorized().json(ApiResponse::<()> {
                    success: false,
                    data: None,
                    message: None,
                    error: Some(msg.clone()),
                })
            }
            AppError::ValidationError(msg) => {
                HttpResponse::BadRequest().json(ApiResponse::<()> {
                    success: false,
                    data: None,
                    message: None,
                    error: Some(msg.clone()),
                })
            }
            AppError::AuthenticationError(msg) => {
                HttpResponse::Unauthorized().json(ApiResponse::<()> {
                    success: false,
                    data: None,
                    message: None,
                    error: Some(msg.clone()),
                })
            }
            AppError::AuthorizationError(msg) => {
                HttpResponse::Forbidden().json(ApiResponse::<()> {
                    success: false,
                    data: None,
                    message: None,
                    error: Some(msg.clone()),
                })
            }
            AppError::NotFoundError(msg) => {
                HttpResponse::NotFound().json(ApiResponse::<()> {
                    success: false,
                    data: None,
                    message: None,
                    error: Some(msg.clone()),
                })
            }
            AppError::InternalServerError(msg) => {
                HttpResponse::InternalServerError().json(ApiResponse::<()> {
                    success: false,
                    data: None,
                    message: None,
                    error: Some(msg.clone()),
                })
            }
            AppError::ConfigurationError(msg) => {
                HttpResponse::InternalServerError().json(ApiResponse::<()> {
                    success: false,
                    data: None,
                    message: None,
                    error: Some(msg.clone()),
                })
            }
            AppError::ExternalApiError(msg) => {
                HttpResponse::BadGateway().json(ApiResponse::<()> {
                    success: false,
                    data: None,
                    message: None,
                    error: Some(msg.clone()),
                })
            }
        }
    }
}

impl From<diesel::result::Error> for AppError {
    fn from(error: diesel::result::Error) -> Self {
        AppError::DatabaseError(error)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: None,
            error: None,
        }
    }

    pub fn success_with_message(data: T, message: String) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: Some(message),
            error: None,
        }
    }


}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginatedResponse<T> {
    pub success: bool,
    pub data: Vec<T>,
    pub pagination: Pagination,
    pub message: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Pagination {
    pub page: i64,
    pub per_page: i64,
    pub total: i64,
    pub total_pages: i64,
}

impl<T> PaginatedResponse<T> {
    #[allow(dead_code)]
    pub fn new(data: Vec<T>, page: i64, per_page: i64, total: i64) -> Self {
        let total_pages = (total as f64 / per_page as f64).ceil() as i64;
        Self {
            success: true,
            data,
            pagination: Pagination {
                page,
                per_page,
                total,
                total_pages,
            },
            message: None,
            error: None,
        }
    }
}

