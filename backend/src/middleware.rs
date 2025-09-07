use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    error::ErrorUnauthorized,
    http::header,
    Error, HttpMessage, HttpRequest,
};
use futures_util::future::LocalBoxFuture;
use std::rc::Rc;
use crate::auth::{AuthService, Claims};
use crate::utils::AppError;

pub struct AuthMiddleware;

impl<S, B> Transform<S, ServiceRequest> for AuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static + Send,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = AuthMiddlewareService<S>;
    type Future = std::pin::Pin<Box<dyn std::future::Future<Output = Result<Self::Transform, Self::InitError>> + Send>>;

    fn new_transform(&self, service: S) -> Self::Future {
        Box::pin(async move {
            Ok(AuthMiddlewareService {
                service: Rc::new(service),
            })
        })
    }
}

pub struct AuthMiddlewareService<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for AuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static + Send,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let svc = self.service.clone();

        Box::pin(async move {
            // Extract token from Authorization header
            let token = extract_token_from_request(&req)?;
            
            // Verify token
            let claims = AuthService::verify_access_token(&token)
                .map_err(|e| ErrorUnauthorized(e.to_string()))?;

            // Add claims to request extensions
            req.extensions_mut().insert(claims);

            // Continue with the request
            let res = svc.call(req).await?;
            Ok(res)
        })
    }
}

fn extract_token_from_request(req: &ServiceRequest) -> Result<String, Error> {
    let auth_header = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| {
            ErrorUnauthorized("Authorization header missing")
        })?;

    if !auth_header.starts_with("Bearer ") {
        return Err(ErrorUnauthorized("Invalid authorization header format"));
    }

    let token = auth_header[7..].to_string();
    if token.is_empty() {
        return Err(ErrorUnauthorized("Token is empty"));
    }

    Ok(token)
}

// Helper function to extract claims from request extensions
#[allow(dead_code)]
pub fn extract_claims_from_request(req: &HttpRequest) -> Result<Claims, AppError> {
    req.extensions()
        .get::<Claims>()
        .cloned()
        .ok_or_else(|| AppError::Unauthorized("User not authenticated".to_string()))
}

// Helper function to get user ID from request
#[allow(dead_code)]
pub fn get_user_id_from_request(req: &HttpRequest) -> Result<uuid::Uuid, AppError> {
    let claims = extract_claims_from_request(req)?;
    uuid::Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Unauthorized("Invalid user ID in token".to_string()))
}
