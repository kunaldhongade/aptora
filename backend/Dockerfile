FROM rust:1.85-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install cargo-watch for hot reload
RUN cargo install cargo-watch

# Copy Cargo files
COPY Cargo.toml ./

# Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies (this layer will be cached)
RUN cargo build --release && rm -rf src

# Copy source code
COPY . .

# Ensure diesel.toml is present for migrations
COPY diesel.toml ./

# Expose port
EXPOSE 8081

# Install Diesel CLI for migrations
RUN cargo install diesel_cli --version 2.1.0 --no-default-features --features postgres

# Build the application in release mode for production
RUN cargo build --release

# Production startup command with migrations and better error handling
CMD ["sh", "-c", "echo '🚀 Starting Aptora Backend...' && if [ -z \"$DATABASE_URL\" ]; then echo '❌ DATABASE_URL not set!'; exit 1; fi && echo 'DATABASE_URL is set ✅' && echo '🔄 Running database migrations...' && diesel migration run || (echo '❌ Migration failed!' && exit 1) && echo '✅ Migrations completed!' && echo '🚀 Starting server on 0.0.0.0:8081...' && ./target/release/aptora-backend"]
