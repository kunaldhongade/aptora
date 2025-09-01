# 🚀 Aptora Trading Platform

A complete full-stack trading platform built with React frontend, Rust backend, and PostgreSQL database, integrated with Kana Labs Perpetual Futures API.

## ✨ Features

- **Real-time Trading**: Perpetual futures trading via Kana Labs API
- **Modern UI**: React frontend with Tailwind CSS and real-time updates
- **High Performance**: Rust backend with Actix Web
- **Database Management**: PostgreSQL with pgAdmin interface
- **Production Ready**: Docker containerization and deployment setup

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Rust, Actix Web, Diesel ORM
- **Database**: PostgreSQL
- **API Integration**: Kana Labs Perpetual Futures API
- **Containerization**: Docker & Docker Compose

## 🚀 Quick Start

### 1. Setup Environment

```bash
./setup-env.sh
```

### 2. Configure API Keys

Edit the `.env` file and add your Kana Labs API key:

```bash
KANA_API_KEY=your-actual-kana-labs-api-key-here
```

### 3. Start the Platform

```bash
./start.sh
```

### 4. Access Your Platform

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api/health
- **Database Management**: http://localhost:5050
  - Email: `admin@aptora.com`
  - Password: `admin123`

## 📁 Project Structure

```
aptora/
├── frontend/          # React frontend application
├── backend/           # Rust backend API
├── docker-compose.yml # Main Docker Compose configuration
├── setup-env.sh      # Environment setup script
├── start.sh          # Platform startup script
└── README.md         # This file
```

## 🔧 Development

### View Logs

```bash
docker compose logs -f
```

### Stop Platform

```bash
docker compose down
```

### Restart Services

```bash
docker compose restart
```

## 🌐 API Endpoints

- `GET /api/health` - Health check
- `GET /api/trading/markets` - Get available markets
- `GET /api/trading/orderbook/{symbol}` - Get orderbook
- `POST /api/trading/orders` - Place order
- `GET /api/trading/orders` - Get user orders
- `DELETE /api/trading/orders/{id}` - Cancel order
- `GET /api/trading/positions` - Get user positions
- `GET /api/auth/register` - User registration
- `POST /api/auth/login` - User login

## 🗄️ Database Management

Access pgAdmin at http://localhost:5050 to manage your PostgreSQL database:

**Connection Details:**

- Host: `postgres`
- Port: `5432`
- Database: `aptora_db`
- Username: `aptora_user`
- Password: `aptora_password`

## 🚀 Production Deployment

The platform is ready for production deployment on:

- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: Neon (PostgreSQL)

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Happy Trading! 🎯**
