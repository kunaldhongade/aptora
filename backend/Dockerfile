# Use the official Rust image as a builder
FROM rust:1.75 as builder

# Set the working directory
WORKDIR /usr/src/app

# Copy the manifests
COPY Cargo.toml Cargo.lock ./

# Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies
RUN cargo build --release

# Remove the dummy main.rs and copy the real source code
RUN rm src/main.rs
COPY . .

# Build the application
RUN cargo build --release

# Create a new stage with a minimal image
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN useradd -r -s /bin/false app

# Set the working directory
WORKDIR /usr/local/bin

# Copy the binary from builder stage
COPY --from=builder /usr/src/app/target/release/aptora-backend .

# Copy migrations
COPY --from=builder /usr/src/app/migrations ./migrations

# Change ownership to the app user
RUN chown app:app aptora-backend

# Switch to the app user
USER app

# Expose the port
EXPOSE 8080

# Set environment variables
ENV RUST_LOG=info

# Run the binary
CMD ["./aptora-backend"]
