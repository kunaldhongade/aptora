# Quick Start Guide

## Option 1: Docker (Recommended for Development)

1. **Start the services**:
   ```bash
   cd backend
   docker-compose up -d
   ```

2. **The API will be available at**: `http://localhost:8080`

3. **Test the health endpoint**:
   ```bash
   curl http://localhost:8080/api/health
   ```

## Option 2: Local Development

1. **Prerequisites**:
   - Rust (install from https://rustup.rs/)
   - PostgreSQL 12+
   - Diesel CLI: `cargo install diesel_cli --no-default-features --features postgres`

2. **Setup**:
   ```bash
   cd backend
   ./setup.sh
   ```

3. **Configure environment**:
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

4. **Create database and run migrations**:
   ```bash
   createdb aptora_db
   diesel migration run
   ```

5. **Start the server**:
   ```bash
   cargo run
   ```

## Quick API Test

1. **Register a user**:
   ```bash
   curl -X POST http://localhost:8080/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "username": "testuser",
       "password": "password123"
     }'
   ```

2. **Get markets**:
   ```bash
   curl http://localhost:8080/api/trading/markets
   ```

3. **Login and get token**:
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

## Project Structure

```
backend/
├── src/
│   ├── main.rs          # Application entry point
│   ├── auth.rs          # JWT authentication
│   ├── db.rs            # Database connection
│   ├── models.rs        # Database models
│   ├── schema.rs        # Auto-generated schema
│   ├── utils.rs         # Utility functions
│   └── handlers/        # API endpoints
│       ├── auth.rs      # Authentication handlers
│       ├── health.rs    # Health check
│       ├── trading.rs   # Trading endpoints
│       └── user.rs      # User management
├── migrations/          # Database migrations
├── tests/              # Integration tests
├── Cargo.toml          # Dependencies
├── Dockerfile          # Container configuration
├── docker-compose.yml  # Development environment
└── README.md           # Full documentation
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | JWT signing key | `your-secret-key-here` |
| `HOST` | Server host | `127.0.0.1` |
| `PORT` | Server port | `8080` |

## Common Commands

```bash
# Build the project
cargo build

# Run in development mode
cargo run

# Run tests
cargo test

# Format code
cargo fmt

# Lint code
cargo clippy

# Database migrations
diesel migration run
diesel migration revert

# Docker commands
docker-compose up -d
docker-compose down
docker-compose logs -f
```

## Next Steps

1. **Frontend Integration**: Update your frontend to use the API endpoints
2. **Authentication**: Implement JWT token storage in your frontend
3. **Real-time Features**: Consider adding WebSocket support for live updates
4. **Production**: Set up proper environment variables and security measures

## Support

- Check the full [README.md](README.md) for detailed documentation
- Review [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for endpoint details
- Create an issue if you encounter problems
