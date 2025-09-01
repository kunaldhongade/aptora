#!/bin/bash

# Aptora Development Environment Setup Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."
    
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        cp backend/env.example .env
        print_warning "Please edit .env file with your API keys before continuing."
        print_warning "Required: KANA_API_KEY, APTOS_API_KEY"
        read -p "Press Enter after updating .env file..."
    fi
    
    source .env
    
    if [ -z "$KANA_API_KEY" ]; then
        print_error "KANA_API_KEY is not set in .env file"
        exit 1
    fi
    
    if [ -z "$APTOS_API_KEY" ]; then
        print_error "APTOS_API_KEY is not set in .env file"
        exit 1
    fi
    
    print_success "Environment variables are set"
}

# Setup development environment
setup_dev() {
    print_status "Setting up development environment..."
    
    # Create necessary directories
    mkdir -p logs
    
    # Build and start services
    print_status "Building and starting services..."
    docker-compose -f docker-compose.dev.yml up --build -d
    
    print_success "Development environment is ready!"
}

# Show logs
show_logs() {
    print_status "Showing logs for all services..."
    docker-compose -f docker-compose.dev.yml logs -f
}

# Show backend logs only
show_backend_logs() {
    print_status "Showing backend logs..."
    docker-compose -f docker-compose.dev.yml logs -f backend
}

# Show frontend logs only
show_frontend_logs() {
    print_status "Showing frontend logs..."
    docker-compose -f docker-compose.dev.yml logs -f frontend
}

# Stop services
stop_services() {
    print_status "Stopping all services..."
    docker-compose -f docker-compose.dev.yml down
    print_success "All services stopped"
}

# Clean up
cleanup() {
    print_status "Cleaning up..."
    docker-compose -f docker-compose.dev.yml down -v
    docker system prune -f
    print_success "Cleanup completed"
}

# Test API endpoints
test_api() {
    print_status "Testing API endpoints..."
    
    # Wait for backend to be ready
    print_status "Waiting for backend to be ready..."
    sleep 10
    
    # Test health endpoint
    if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        return 1
    fi
    
    # Test markets endpoint
    if curl -f http://localhost:8080/api/trading/markets > /dev/null 2>&1; then
        print_success "Markets endpoint is working"
    else
        print_warning "Markets endpoint failed (might need API key)"
    fi
    
    print_success "API testing completed"
}

# Show status
show_status() {
    print_status "Service Status:"
    docker-compose -f docker-compose.dev.yml ps
    
    echo ""
    print_status "Access URLs:"
    echo "  Frontend: http://localhost:5173"
    echo "  Backend API: http://localhost:8080/api"
    echo "  Backend Health: http://localhost:8080/api/health"
    echo "  PostgreSQL: localhost:5432"
    echo "  Redis: localhost:6379"
}

# Main menu
show_menu() {
    echo ""
    echo "Aptora Development Environment"
    echo "=============================="
    echo "1. Setup development environment"
    echo "2. Show all logs"
    echo "3. Show backend logs only"
    echo "4. Show frontend logs only"
    echo "5. Test API endpoints"
    echo "6. Show service status"
    echo "7. Stop services"
    echo "8. Cleanup (remove volumes)"
    echo "9. Exit"
    echo ""
}

# Main script
main() {
    print_status "Aptora Development Environment Setup"
    
    check_docker
    check_env_vars
    
    while true; do
        show_menu
        read -p "Choose an option (1-9): " choice
        
        case $choice in
            1)
                setup_dev
                test_api
                show_status
                ;;
            2)
                show_logs
                ;;
            3)
                show_backend_logs
                ;;
            4)
                show_frontend_logs
                ;;
            5)
                test_api
                ;;
            6)
                show_status
                ;;
            7)
                stop_services
                ;;
            8)
                cleanup
                ;;
            9)
                print_success "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-9."
                ;;
        esac
    done
}

# Run main function
main "$@"

