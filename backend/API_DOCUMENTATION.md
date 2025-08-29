# Aptora Backend API Documentation

## Base URL

```
http://localhost:8080/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": null,
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "message": null,
  "error": "Error description"
}
```

## Endpoints

### Health Check

#### GET /health

Check if the server is running.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "0.1.0"
}
```

### Authentication

#### POST /auth/register

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "username": "trader123",
  "password": "securepassword123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "username": "trader123",
      "created_at": "2024-01-01T12:00:00Z"
    },
    "token": "jwt-token-here",
    "token_type": "Bearer",
    "expires_in": 86400
  }
}
```

**Validation Rules:**

- Email must be a valid email format
- Username must be 3-50 characters
- Password must be at least 6 characters
- Email and username must be unique

#### POST /auth/login

Login with existing credentials.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "username": "trader123",
      "created_at": "2024-01-01T12:00:00Z"
    },
    "token": "jwt-token-here",
    "token_type": "Bearer",
    "expires_in": 86400
  }
}
```

#### GET /auth/me

Get current user profile (requires authentication).

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "email": "user@example.com",
    "username": "trader123",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

### Trading

#### GET /trading/markets

Get all active trading markets.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "market-uuid",
      "symbol": "BTC/USDT",
      "base_asset": "BTC",
      "quote_asset": "USDT",
      "min_order_size": 0.001,
      "max_order_size": 1000.0,
      "tick_size": 0.01,
      "is_active": true
    }
  ]
}
```

#### GET /trading/orderbook

Get orderbook for a specific market.

**Query Parameters:**

- `market_id` (required): UUID of the market
- `depth` (optional): Number of price levels (default: 20, max: 100)

**Example:**

```
GET /trading/orderbook?market_id=market-uuid&depth=10
```

**Response:**

```json
{
  "success": true,
  "data": {
    "market_id": "market-uuid",
    "bids": [
      {
        "price": 50000.0,
        "quantity": 0.5,
        "total": 25000.0
      }
    ],
    "asks": [
      {
        "price": 50001.0,
        "quantity": 0.3,
        "total": 15000.3
      }
    ],
    "last_updated": "2024-01-01T12:00:00Z"
  }
}
```

#### POST /trading/orders

Place a new trading order (requires authentication).

**Request Body:**

```json
{
  "market_id": "market-uuid",
  "order_type": "limit",
  "side": "buy",
  "quantity": 0.1,
  "price": 50000.0
}
```

**Order Types:**

- `market`: Market order (price not required)
- `limit`: Limit order (price required)
- `stop`: Stop order (price required)

**Order Sides:**

- `buy`: Buy order
- `sell`: Sell order

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "market_id": "market-uuid",
    "order_type": "limit",
    "side": "buy",
    "quantity": 0.1,
    "price": 50000.0,
    "status": "pending",
    "filled_quantity": 0.0,
    "average_price": null,
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

**Validation Rules:**

- Market must exist and be active
- Quantity must be within market limits
- Price is required for limit and stop orders
- Order type and side must be valid values

#### GET /trading/orders

Get user's trading orders (requires authentication).

**Query Parameters:**

- `market_id` (optional): Filter by market UUID
- `status` (optional): Filter by order status
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 20, max: 100)

**Example:**

```
GET /trading/orders?market_id=market-uuid&status=pending&page=1&per_page=10
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "order-uuid",
      "market_id": "market-uuid",
      "order_type": "limit",
      "side": "buy",
      "quantity": 0.1,
      "price": 50000.0,
      "status": "pending",
      "filled_quantity": 0.0,
      "average_price": null,
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 25,
    "total_pages": 3
  }
}
```

### User Management

#### GET /user/profile

Get current user profile (requires authentication).

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "trader123",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

#### PUT /user/profile

Update user profile (requires authentication).

**Request Body:**

```json
{
  "username": "newusername"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "newusername",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

**Validation Rules:**

- Username must be 3-50 characters
- Username must be unique

#### GET /user/balance

Get user's asset balances (requires authentication).

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "asset": "USDT",
      "available": 10000.0,
      "locked": 500.0,
      "total": 10500.0
    },
    {
      "asset": "BTC",
      "available": 0.5,
      "locked": 0.0,
      "total": 0.5
    }
  ]
}
```

## Error Codes

| HTTP Status | Error Type          | Description                       |
| ----------- | ------------------- | --------------------------------- |
| 400         | ValidationError     | Invalid request data              |
| 401         | AuthenticationError | Missing or invalid authentication |
| 403         | AuthorizationError  | Insufficient permissions          |
| 404         | NotFoundError       | Resource not found                |
| 500         | InternalServerError | Server error                      |

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production use.

## WebSocket Support

WebSocket support for real-time orderbook updates and trade notifications is planned for future releases.

## Testing

You can test the API using curl, Postman, or any HTTP client. Example curl commands are provided in the README.md file.

## Support

For API support or questions, please refer to the project documentation or create an issue in the repository.
