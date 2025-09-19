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

# Copy Cargo files from backend directory
COPY backend/Cargo.toml ./

# Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies (this layer will be cached)
RUN cargo build --release && rm -rf src

# Copy source code from backend directory
COPY backend/ .

# Expose port
EXPOSE 8081

# Install Diesel CLI for migrations
RUN cargo install diesel_cli --version 2.1.1 --no-default-features --features postgres

# Build the application in release mode for production
RUN cargo build --release

# Production startup command with migrations
CMD ["sh", "-c", "echo '🚀 Starting Aptora Backend...' && diesel migration run && echo '✅ Starting server...' && ./target/release/aptora-backend"]
