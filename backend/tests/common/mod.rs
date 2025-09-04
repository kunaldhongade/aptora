use diesel::r2d2::{ConnectionManager, Pool};
use diesel::PgConnection;
use std::env;

use aptora_backend::DbPool;

pub async fn setup_test_database() -> DbPool {
    let database_url = env::var("TEST_DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:password@localhost:5432/aptora_test".to_string());
    
    let manager = ConnectionManager::<PgConnection>::new(database_url);
    Pool::builder()
        .build(manager)
        .expect("Failed to create test database pool")
}

pub async fn cleanup_test_database(pool: &DbPool) {
    // Clean up test data after tests
    use diesel::prelude::*;
    use aptora_backend::schema::{users, follows, referral_rewards, sessions};
    
    let mut conn = pool.get().expect("Failed to get connection");
    
    // Delete in reverse order due to foreign key constraints
    diesel::delete(follows::table).execute(&mut conn).ok();
    diesel::delete(referral_rewards::table).execute(&mut conn).ok();
    diesel::delete(sessions::table).execute(&mut conn).ok();
    diesel::delete(users::table).execute(&mut conn).ok();
}

pub fn generate_test_email() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    format!("test{}@example.com", timestamp)
}

pub fn generate_test_username() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    format!("testuser{}", timestamp)
}
