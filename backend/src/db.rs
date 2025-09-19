use crate::DbPool;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

pub fn run_migrations(pool: &DbPool) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    log::info!("Attempting to get database connection from pool...");
    let conn = &mut pool.get().map_err(|e| {
        log::error!("Failed to get connection from pool: {}", e);
        e
    })?;

    log::info!("Running pending migrations...");
    conn.run_pending_migrations(MIGRATIONS).map_err(|e| {
        log::error!("Failed to run migrations: {}", e);
        e
    })?;

    log::info!("Migrations completed successfully!");
    Ok(())
}
