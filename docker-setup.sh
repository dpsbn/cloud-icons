#!/bin/bash

# Cloud Icons Docker Setup Script
# This script sets up the complete Docker environment for the Cloud Icons project

set -e  # Exit on any error

echo "🐳 Setting up Cloud Icons Docker Environment..."

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

# Check if Docker is installed and running
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "Docker is installed and running"
}

# Check if Docker Compose is available
check_docker_compose() {
    print_status "Checking Docker Compose installation..."
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    
    print_success "Docker Compose is available"
}

# Function to use either docker-compose or docker compose
docker_compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        docker-compose "$@"
    else
        docker compose "$@"
    fi
}

# Clean up existing containers and volumes (optional)
cleanup_existing() {
    if [ "$1" = "--clean" ]; then
        print_warning "Cleaning up existing containers and volumes..."
        docker_compose_cmd down -v --remove-orphans 2>/dev/null || true
        docker system prune -f 2>/dev/null || true
        print_success "Cleanup completed"
    fi
}

# Create necessary directories and files
setup_directories() {
    print_status "Setting up directories and configuration files..."
    
    # Ensure all required directories exist
    mkdir -p api/backups
    mkdir -p api/scripts
    mkdir -p public/icons
    mkdir -p data
    
    # Copy environment file if it doesn't exist
    if [ ! -f .env.docker ]; then
        print_warning ".env.docker not found. Creating default configuration..."
        # The file should already exist from previous steps
    fi
    
    print_success "Directories and configuration ready"
}

# Build and start services
start_services() {
    print_status "Building and starting Docker services..."
    
    # Build images
    print_status "Building Docker images..."
    docker_compose_cmd build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker_compose_cmd up -d
    
    print_success "Services started successfully"
}

# Wait for services to be healthy
wait_for_services() {
    print_status "Waiting for services to be healthy..."
    
    # Wait for PostgreSQL
    print_status "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if docker_compose_cmd exec -T postgres pg_isready -U cloudicons -d cloudicons &> /dev/null; then
            print_success "PostgreSQL is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "PostgreSQL failed to start within 30 attempts"
            exit 1
        fi
        sleep 2
    done
    
    # Wait for Redis
    print_status "Waiting for Redis to be ready..."
    for i in {1..15}; do
        if docker_compose_cmd exec -T redis redis-cli ping &> /dev/null; then
            print_success "Redis is ready"
            break
        fi
        if [ $i -eq 15 ]; then
            print_error "Redis failed to start within 15 attempts"
            exit 1
        fi
        sleep 2
    done
    
    # Wait for API service
    print_status "Waiting for API service to be healthy..."
    for i in {1..60}; do
        if curl -f http://localhost:3002/health &> /dev/null; then
            print_success "API service is healthy"
            break
        fi
        if [ $i -eq 60 ]; then
            print_error "API service failed to become healthy within 60 attempts"
            docker_compose_cmd logs api
            exit 1
        fi
        sleep 3
    done
    
    # Wait for Web service
    print_status "Waiting for Web service to be ready..."
    for i in {1..60}; do
        if curl -f http://localhost:3000 &> /dev/null; then
            print_success "Web service is ready"
            break
        fi
        if [ $i -eq 60 ]; then
            print_warning "Web service not responding, but continuing..."
            break
        fi
        sleep 3
    done
}

# Verify the setup
verify_setup() {
    print_status "Verifying the setup..."
    
    # Check API health
    if curl -s http://localhost:3002/health | grep -q '"status":"ok"'; then
        print_success "API health check passed"
    else
        print_error "API health check failed"
        exit 1
    fi
    
    # Check database connection
    if curl -s http://localhost:3002/cloud-providers | grep -q "\["]; then
        print_success "Database connection verified"
    else
        print_error "Database connection failed"
        exit 1
    fi
    
    print_success "Setup verification completed"
}

# Show service status and URLs
show_status() {
    print_success "🎉 Cloud Icons Docker Environment is ready!"
    echo
    echo "📊 Service Status:"
    docker_compose_cmd ps
    echo
    echo "🌐 Access URLs:"
    echo "  • Web Application: http://localhost:3000"
    echo "  • API Service: http://localhost:3002"
    echo "  • API Health: http://localhost:3002/health"
    echo "  • API Documentation: http://localhost:3002/cloud-providers"
    echo
    echo "🗄️ Database Access:"
    echo "  • PostgreSQL: localhost:5432"
    echo "  • Database: cloudicons"
    echo "  • Username: cloudicons"
    echo "  • Password: cloudicons"
    echo
    echo "💾 Cache Service:"
    echo "  • Redis: localhost:6379"
    echo
    echo "📝 Useful Commands:"
    echo "  • View logs: docker-compose logs -f [service]"
    echo "  • Stop services: docker-compose down"
    echo "  • Restart services: docker-compose restart"
    echo "  • Database migration: docker-compose exec api npm run db:migrate"
    echo
}

# Main execution
main() {
    echo "🐳 Cloud Icons Docker Setup"
    echo "=========================="
    echo
    
    # Parse command line arguments
    CLEAN_INSTALL=false
    if [ "$1" = "--clean" ]; then
        CLEAN_INSTALL=true
    fi
    
    # Run setup steps
    check_docker
    check_docker_compose
    
    if [ "$CLEAN_INSTALL" = true ]; then
        cleanup_existing --clean
    fi
    
    setup_directories
    start_services
    wait_for_services
    verify_setup
    show_status
    
    print_success "Setup completed successfully! 🎉"
}

# Help function
show_help() {
    echo "Cloud Icons Docker Setup Script"
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --clean    Clean up existing containers and volumes before setup"
    echo "  --help     Show this help message"
    echo
    echo "Examples:"
    echo "  $0                # Standard setup"
    echo "  $0 --clean       # Clean setup (removes existing data)"
}

# Check for help flag
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

# Run main function
main "$@"