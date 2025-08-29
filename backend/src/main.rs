use actix_cors::Cors;
use actix_web::{middleware::Logger, web, App, HttpServer};
use diesel::pg::PgConnection;
use diesel::r2d2::{self, ConnectionManager};
use dotenv::dotenv;
use log::info;
use std::env;

mod auth;
mod db;
mod handlers;
mod models;
mod schema;
mod utils;

pub type DbPool = r2d2::Pool<ConnectionManager<PgConnection>>;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load environment variables
    dotenv().ok();
    
    // Initialize logging
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    
    // Database connection pool
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let manager = ConnectionManager::<PgConnection>::new(database_url);
    let pool = r2d2::Pool::builder()
        .build(manager)
        .expect("Failed to create pool");
    
    // Run database migrations
    info!("Running database migrations...");
    db::run_migrations(&pool).expect("Failed to run migrations");
    
    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let bind_address = format!("{}:{}", host, port);
    
    info!("Starting server at {}", bind_address);
    
    HttpServer::new(move || {
        // Configure CORS
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);
        
        App::new()
            .wrap(Logger::default())
            .wrap(cors)
            .app_data(web::Data::new(pool.clone()))
            .service(
                web::scope("/api")
                    .service(handlers::health::health_check)
                    .service(
                        web::scope("/auth")
                            .service(handlers::auth::register)
                            .service(handlers::auth::login)
                            .service(handlers::auth::me)
                    )
                    .service(
                        web::scope("/trading")
                            .service(handlers::trading::get_markets)
                            .service(handlers::trading::get_orderbook)
                            .service(handlers::trading::place_order)
                            .service(handlers::trading::get_orders)
                    )
                    .service(
                        web::scope("/user")
                            .service(handlers::user::get_profile)
                            .service(handlers::user::update_profile)
                            .service(handlers::user::get_balance)
                    )
            )
    })
    .bind(&bind_address)?
    .run()
    .await
}
