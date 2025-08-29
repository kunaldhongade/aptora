use crate::models::User;
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::env;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // User ID
    pub exp: i64,    // Expiration time
    pub iat: i64,    // Issued at
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthToken {
    pub token: String,
    pub token_type: String,
    pub expires_in: i64,
}

pub fn create_token(user_id: Uuid) -> Result<String, jsonwebtoken::errors::Error> {
    let secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");
    let expiration = Utc::now()
        .checked_add_signed(Duration::hours(24))
        .expect("valid timestamp")
        .timestamp();

    let claims = Claims {
        sub: user_id.to_string(),
        exp: expiration,
        iat: Utc::now().timestamp(),
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    )
}

pub fn verify_token(token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::default(),
    )?;

    Ok(token_data.claims)
}

pub fn hash_password(password: &str) -> Result<String, bcrypt::BcryptError> {
    let salt = bcrypt::DEFAULT_COST;
    bcrypt::hash(password, salt)
}

pub fn verify_password(password: &str, hash: &str) -> Result<bool, bcrypt::BcryptError> {
    bcrypt::verify(password, hash)
}

pub fn extract_user_id_from_token(token: &str) -> Result<Uuid, Box<dyn std::error::Error>> {
    let claims = verify_token(token)?;
    let user_id = Uuid::parse_str(&claims.sub)?;
    Ok(user_id)
}

pub fn get_auth_header_value(auth_header: &str) -> Result<String, Box<dyn std::error::Error>> {
    if auth_header.starts_with("Bearer ") {
        Ok(auth_header[7..].to_string())
    } else {
        Err("Invalid authorization header format".into())
    }
}
