#!/bin/bash

# Aptora Complete Setup Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

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

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is installed and running"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_success "Docker Compose is installed"
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    print_success "Git is installed"
}

# Setup environment
setup_environment() {
    print_header "Setting Up Environment"
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp backend/env.example .env
        print_warning "Please edit .env file with your API keys:"
        echo "   - KANA_API_KEY (get from https://kanalabs.io/)"
        echo "   - APTOS_API_KEY (get from https://aptoslabs.com/)"
        echo ""
        read -p "Press Enter after updating .env file..."
    else
        print_success ".env file already exists"
    fi
    
    # Load environment variables
    source .env
    
    # Check if required variables are set
    if [ -z "$KANA_API_KEY" ] || [ -z "$APTOS_API_KEY" ]; then
        print_error "Missing required API keys in .env file"
        print_warning "Please set KANA_API_KEY and APTOS_API_KEY in .env file"
        exit 1
    fi
    
    print_success "Environment variables are configured"
}

# Build and start services
start_services() {
    print_header "Starting Services"
    
    print_status "Building and starting Docker services..."
    docker-compose -f docker-compose.dev.yml up --build -d
    
    print_status "Waiting for services to be ready..."
    sleep 20
    
    print_success "Services started successfully"
}

# Test services
test_services() {
    print_header "Testing Services"
    
    # Test backend health
    print_status "Testing backend health..."
    if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
        print_success "Backend is healthy"
    else
        print_error "Backend health check failed"
        print_status "Backend logs:"
        docker-compose -f docker-compose.dev.yml logs backend
        return 1
    fi
    
    # Test frontend
    print_status "Testing frontend..."
    if curl -f http://localhost:5173 > /dev/null 2>&1; then
        print_success "Frontend is accessible"
    else
        print_error "Frontend check failed"
        print_status "Frontend logs:"
        docker-compose -f docker-compose.dev.yml logs frontend
        return 1
    fi
    
    # Test database
    print_status "Testing database connection..."
    if docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U aptora_user -d aptora_db > /dev/null 2>&1; then
        print_success "Database is ready"
    else
        print_error "Database connection failed"
        return 1
    fi
    
    print_success "All services are working correctly"
}

# Show final information
show_final_info() {
    print_header "Setup Complete!"
    
    echo ""
    print_success "🎉 Aptora is now running!"
    echo ""
    echo "📱 Access URLs:"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend API: http://localhost:8080/api"
    echo "   Backend Health: http://localhost:8080/api/health"
    echo ""
    echo "📊 Management Commands:"
    echo "   View logs: docker-compose -f docker-compose.dev.yml logs -f"
    echo "   Stop services: docker-compose -f docker-compose.dev.yml down"
    echo "   Restart services: docker-compose -f docker-compose.dev.yml restart"
    echo ""
    echo "🔧 Development Commands:"
    echo "   Interactive menu: ./dev.sh"
    echo "   Quick start: ./start-dev.sh"
    echo ""
    echo "📚 Documentation:"
    echo "   README.md - Project overview"
    echo "   DEPLOYMENT_GUIDE.md - Production deployment"
    echo "   .cursor/docs/ - Detailed documentation"
    echo ""
    print_success "Happy coding! 🚀"
}

# Main setup function
main() {
    print_header "Aptora Setup Script"
    echo "This script will set up the complete Aptora development environment"
    echo ""
    
    check_prerequisites
    setup_environment
    start_services
    test_services
    show_final_info
}

# Run main function
main "$@"

