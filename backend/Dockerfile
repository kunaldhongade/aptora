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

# Expose port
EXPOSE 8081

# Default command (will be overridden by docker-compose)
CMD ["cargo", "run"]
