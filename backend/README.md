# Aptora Backend

A high-performance Rust backend for the Aptora trading platform built with Actix Web, Diesel ORM, and PostgreSQL.

## Features

- 🔐 **Authentication & Authorization**: JWT-based authentication with secure password hashing
- 📊 **Trading API**: Complete trading functionality with markets, orders, and orderbook
- 👤 **User Management**: User profiles, balances, and account management
- 🗄️ **Database**: PostgreSQL with Diesel ORM for type-safe database operations
- 🚀 **Performance**: High-performance async Rust backend
- 🔒 **Security**: Input validation, error handling, and secure practices

## Tech Stack

- **Framework**: Actix Web 4.4
- **Database**: PostgreSQL with Diesel ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: Validator crate for request validation
- **Serialization**: Serde for JSON serialization/deserialization
- **Error Handling**: Custom error types with proper HTTP status codes

## Prerequisites

- Rust (latest stable version)
- PostgreSQL 12+
- Diesel CLI (`cargo install diesel_cli --no-default-features --features postgres`)

## Setup

1. **Clone and navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   cargo build
   ```

3. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your database credentials and JWT secret
   ```

4. **Set up the database**:
   ```bash
   # Create the database
   createdb aptora_db
   
   # Run migrations
   diesel migration run
   ```

5. **Run the server**:
   ```bash
   cargo run
   ```

The server will start on `http://localhost:8080` (or the port specified in your `.env` file).

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Trading
- `GET /api/trading/markets` - Get all active markets
- `GET /api/trading/orderbook?market_id={id}&depth={depth}` - Get orderbook for a market
- `POST /api/trading/orders` - Place a new order
- `GET /api/trading/orders` - Get user's orders (with pagination)

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/balance` - Get user balances

## API Examples

### Register a new user
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "trader123",
    "password": "securepassword123"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### Get markets
```bash
curl -X GET http://localhost:8080/api/trading/markets
```

### Place an order (requires authentication)
```bash
curl -X POST http://localhost:8080/api/trading/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "market_id": "market-uuid-here",
    "order_type": "limit",
    "side": "buy",
    "quantity": 0.1,
    "price": 50000.0
  }'
```

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `username` (VARCHAR, Unique)
- `password_hash` (VARCHAR)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### Markets Table
- `id` (UUID, Primary Key)
- `symbol` (VARCHAR, Unique)
- `base_asset` (VARCHAR)
- `quote_asset` (VARCHAR)
- `min_order_size` (DOUBLE PRECISION)
- `max_order_size` (DOUBLE PRECISION)
- `tick_size` (DOUBLE PRECISION)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)

### Orders Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `market_id` (UUID, Foreign Key)
- `order_type` (VARCHAR)
- `side` (VARCHAR)
- `quantity` (DOUBLE PRECISION)
- `price` (DOUBLE PRECISION, Nullable)
- `status` (VARCHAR)
- `filled_quantity` (DOUBLE PRECISION)
- `average_price` (DOUBLE PRECISION, Nullable)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### Balances Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `asset` (VARCHAR)
- `available` (DOUBLE PRECISION)
- `locked` (DOUBLE PRECISION)
- `total` (DOUBLE PRECISION)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

## Development

### Running tests
```bash
cargo test
```

### Database migrations
```bash
# Create a new migration
diesel migration generate migration_name

# Run migrations
diesel migration run

# Revert last migration
diesel migration revert
```

### Code formatting
```bash
cargo fmt
```

### Linting
```bash
cargo clippy
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `HOST` | Server host | `127.0.0.1` |
| `PORT` | Server port | `8080` |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `RUST_LOG` | Logging level | `info` |

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Input validation is performed on all requests
- CORS is configured for frontend integration
- Database queries use parameterized statements to prevent SQL injection

## Performance

- Connection pooling for database operations
- Async/await for non-blocking I/O
- Efficient database indexes
- Minimal memory allocations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License.
