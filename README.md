# 🚀 Aptora Trading Platform

A complete full-stack trading platform built with React frontend, Rust backend, and PostgreSQL database, integrated with Kana Labs Perpetual Futures API.

## ✨ Features

- **Real-time Trading**: Perpetual futures trading via Kana Labs API
- **Modern UI**: React frontend with Tailwind CSS and real-time updates
- **High Performance**: Rust backend with Actix Web
- **Database Management**: Neon PostgreSQL (cloud database)
- **Production Ready**: Docker containerization and deployment setup

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Rust, Actix Web, Diesel ORM
- **Database**: Neon PostgreSQL
- **API Integration**: Kana Labs Perpetual Futures API
- **Containerization**: Docker & Docker Compose

## 🚀 Quick Start

### 1. Setup Environment

```bash
./setup-env.sh
```

### 2. Configure Database and API Keys

Edit the `.env` file and add your Neon database URL and Kana Labs API key:

```bash
DATABASE_URL=postgresql://username:password@your-neon-host:5432/neondb?sslmode=require
KANA_API_KEY=your-actual-kana-labs-api-key-here
```

### 3. Start the Backend

```bash
./start.sh
```

### 4. Start the Frontend (in a separate terminal)

```bash
./start-frontend.sh
```

Or manually:

```bash
cd frontend
npm install
npm run dev
```

### 5. Access Your Platform

- **Backend API**: http://localhost:8080/api/health
- **Frontend**: http://localhost:5173

## 📁 Project Structure

```
aptora/
├── frontend/          # React frontend application (run locally)
├── backend/           # Rust backend API (run in Docker)
├── docker-compose.yml # Backend Docker Compose configuration
├── setup-env.sh      # Environment setup script
├── start.sh          # Backend startup script
├── start-frontend.sh # Frontend startup script
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

The platform uses Neon PostgreSQL (cloud database). You can manage your database through:

- **Neon Console**: Access your database through the Neon web console
- **Direct Connection**: Use any PostgreSQL client with your connection string

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
