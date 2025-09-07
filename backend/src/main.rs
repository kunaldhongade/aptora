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
mod middleware;
mod models;
mod schema;
mod utils;
mod kana_client;
mod social;

pub type DbPool = r2d2::Pool<ConnectionManager<PgConnection>>;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "8081".to_string());
    let bind_address = format!("{}:{}", host, port);

    // Create database connection pool
    let manager = ConnectionManager::<PgConnection>::new(database_url);
    let pool = r2d2::Pool::builder()
        .build(manager)
        .expect("Failed to create pool");

    // Run database migrations
    if let Err(e) = db::run_migrations(&pool) {
        log::error!("Failed to run migrations: {}", e);
        return Err(std::io::Error::new(std::io::ErrorKind::Other, e));
    }

    info!("Starting server at {}", bind_address);

    HttpServer::new(move || {
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
                            .service(handlers::auth::refresh)
                            .service(handlers::auth::logout)
                            .service(handlers::auth::check_username)
                            .service(
                                web::resource("/me")
                                    .route(web::get().to(handlers::auth::me))
                            )
                    )
                    .service(
                        web::scope("/trading")
                            .service(handlers::trading::get_markets)
                            .service(handlers::trading::get_orderbook)
                            .service(handlers::trading::place_order)
                            .service(handlers::trading::get_orders)
                            .service(handlers::trading::cancel_order)
                            .service(handlers::trading::get_positions)
                            .service(handlers::trading::get_funding_rate)
                            .service(handlers::trading::get_market_price)
                            .service(handlers::trading::get_chart_data)
                            .service(handlers::trading::get_open_orders)
                            .service(handlers::trading::get_order_history)
                            .service(handlers::trading::place_limit_order)
                            .service(handlers::trading::cancel_multiple_orders)
                            .service(handlers::trading::cancel_and_place_multiple_orders)
                            .service(handlers::trading::get_order_status_by_order_id)
                            .service(handlers::trading::get_market_price_by_id)
                            .service(handlers::trading::get_last_placed_price)
                            .service(handlers::trading::add_margin)
                            .service(handlers::trading::collapse_position)
                            .service(handlers::trading::settle_pnl)
                    )
                    .service(
                        web::scope("/wallet")
                            .service(handlers::wallet::get_profile_address)
                            .service(handlers::wallet::get_wallet_account_balance)
                            .service(handlers::wallet::get_profile_balance_snapshot)
                            .service(handlers::wallet::create_deposit_payload)
                            .service(handlers::wallet::create_withdraw_specific_market_payload)
                    )
                                         .service(
                         web::scope("/user")
                             .service(handlers::user::get_profile)
                             .service(handlers::user::update_profile)
                             .service(handlers::user::get_balance)
                     )
                     .service(
                         web::scope("/social")
                             .service(handlers::social::follow_user)
                             .service(handlers::social::unfollow_user)
                             .service(handlers::social::get_followers)
                             .service(handlers::social::get_following)
                             .service(handlers::social::get_follow_stats)
                             .service(handlers::social::get_public_profile)
                             .service(handlers::social::update_profile)
                                                         .service(handlers::social::get_referral_leaderboard)
                            .service(handlers::social::get_referral_info)
                            .service(handlers::social::get_referred_users)
                            .service(handlers::social::check_following_status)
                            .service(handlers::social::get_all_users)
                     )
            )
    })
    .bind(&bind_address)?
    .run()
    .await
}
