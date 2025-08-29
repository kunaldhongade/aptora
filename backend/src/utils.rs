use actix_web::{http::StatusCode, HttpResponse, ResponseError};
use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginatedResponse<T> {
    pub success: bool,
    pub data: Vec<T>,
    pub pagination: Pagination,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Pagination {
    pub page: i64,
    pub per_page: i64,
    pub total: i64,
    pub total_pages: i64,
}

#[derive(Debug)]
pub enum AppError {
    DatabaseError(diesel::result::Error),
    ValidationError(String),
    AuthenticationError(String),
    AuthorizationError(String),
    NotFoundError(String),
    InternalServerError(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::DatabaseError(e) => write!(f, "Database error: {}", e),
            AppError::ValidationError(e) => write!(f, "Validation error: {}", e),
            AppError::AuthenticationError(e) => write!(f, "Authentication error: {}", e),
            AppError::AuthorizationError(e) => write!(f, "Authorization error: {}", e),
            AppError::NotFoundError(e) => write!(f, "Not found: {}", e),
            AppError::InternalServerError(e) => write!(f, "Internal server error: {}", e),
        }
    }
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        let (status_code, error_message) = match self {
            AppError::DatabaseError(_) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "Database error occurred")
            }
            AppError::ValidationError(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::AuthenticationError(msg) => (StatusCode::UNAUTHORIZED, msg),
            AppError::AuthorizationError(msg) => (StatusCode::FORBIDDEN, msg),
            AppError::NotFoundError(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::InternalServerError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
        };

        HttpResponse::build(status_code).json(ApiResponse::<()> {
            success: false,
            data: None,
            message: None,
            error: Some(error_message.to_string()),
        })
    }
}

impl From<diesel::result::Error> for AppError {
    fn from(error: diesel::result::Error) -> Self {
        AppError::DatabaseError(error)
    }
}

pub fn success_response<T>(data: T) -> HttpResponse {
    HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(data),
        message: None,
        error: None,
    })
}

pub fn success_message(message: &str) -> HttpResponse {
    HttpResponse::Ok().json(ApiResponse::<()> {
        success: true,
        data: None,
        message: Some(message.to_string()),
        error: None,
    })
}

pub fn error_response(status_code: StatusCode, message: &str) -> HttpResponse {
    HttpResponse::build(status_code).json(ApiResponse::<()> {
        success: false,
        data: None,
        message: None,
        error: Some(message.to_string()),
    })
}

pub fn paginated_response<T>(
    data: Vec<T>,
    page: i64,
    per_page: i64,
    total: i64,
) -> HttpResponse {
    let total_pages = (total as f64 / per_page as f64).ceil() as i64;
    
    HttpResponse::Ok().json(PaginatedResponse {
        success: true,
        data,
        pagination: Pagination {
            page,
            per_page,
            total,
            total_pages,
        },
    })
}
