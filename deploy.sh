#!/bin/bash

# Fake Google Deployment Script
# Simple Docker-based deployment for all environments

set -e  # Exit on any error

# Check Docker prerequisites
check_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        echo "Please install Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Check for newer docker compose (preferred) or legacy docker-compose
    if docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
        echo -e "${GREEN}✅ Using newer docker compose${NC}"
    elif command -v docker-compose >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker-compose"
        echo -e "${YELLOW}⚠️  Using legacy docker-compose${NC}"
    else
        echo -e "${RED}❌ Docker Compose is not available${NC}"
        echo "Please install Docker Compose or update Docker to a version with built-in compose"
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running${NC}"
        echo "Please start Docker and try again"
        exit 1
    fi
}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
DEV_COMPOSE_FILE="docker-compose.dev.yml"
APP_NAME="fake-google"

# Default values
DEVELOPMENT=false
BUILD_ONLY=false
CLEAN_BUILD=false
LOGS=false
STOP_ONLY=false

# Help function
show_help() {
    echo "Fake Google - Docker Deployment"
    echo "================================"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -d, --dev               Development mode (hot reload)"
    echo "  -b, --build-only        Only build images, don't start"
    echo "  -c, --clean             Clean build (no cache)"
    echo "  -l, --logs              Show logs after starting"
    echo "  -s, --stop              Stop containers only"
    echo ""
    echo "Quick Start:"
    echo "  ./deploy.sh                       # Production deployment"
    echo "  ./deploy.sh --dev                 # Development with hot reload"
    echo "  ./deploy.sh --clean               # Clean production build"
    echo ""
    echo "Management:"
    echo "  ./deploy.sh --stop                # Stop all containers"
    echo "  ./deploy.sh --logs                # View container logs"
    echo ""
    echo "Prerequisites:"
    echo "  • Docker and Docker Compose installed"
    echo "  • .env file configured (optional)"
    echo ""
    echo "For port configuration: ./port-config.sh interactive"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--dev)
            DEVELOPMENT=true
            COMPOSE_FILE="$DEV_COMPOSE_FILE"
            shift
            ;;
        -b|--build-only)
            BUILD_ONLY=true
            shift
            ;;
        -c|--clean)
            CLEAN_BUILD=true
            shift
            ;;
        -l|--logs)
            LOGS=true
            shift
            ;;
        -s|--stop)
            STOP_ONLY=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Set compose file based on development flag
if [ "$DEVELOPMENT" = true ]; then
    COMPOSE_FILE="$DEV_COMPOSE_FILE"
    echo -e "${BLUE}🔧 Using development configuration${NC}"
else
    echo -e "${BLUE}🚀 Using production configuration${NC}"
fi

echo "========================================"

# Function to stop containers
stop_containers() {
    echo -e "${YELLOW}🛑 Stopping containers...${NC}"
    
    # Try both compose files to ensure we stop everything
    $DOCKER_COMPOSE_CMD -f docker-compose.yml down 2>/dev/null || true
    $DOCKER_COMPOSE_CMD -f docker-compose.dev.yml down 2>/dev/null || true
    
    echo -e "${GREEN}✅ Containers stopped${NC}"
}

# Function to clean up old images and containers
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    
    # Remove stopped containers
    docker container prune -f 2>/dev/null || true
    
    # Remove unused images if clean build
    if [ "$CLEAN_BUILD" = true ]; then
        echo "Removing unused images..."
        docker image prune -f 2>/dev/null || true
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" build --no-cache
    fi
    
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Function to build images
build_images() {
    echo -e "${YELLOW}🔨 Building images...${NC}"
    
    if [ "$CLEAN_BUILD" = true ]; then
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" build --no-cache
    else
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" build
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Images built successfully${NC}"
    else
        echo -e "${RED}❌ Image build failed${NC}"
        exit 1
    fi
}

# Function to start containers
start_containers() {
    if [ "$BUILD_ONLY" = true ]; then
        echo -e "${YELLOW}⏭️  Build-only mode, not starting containers${NC}"
        return
    fi
    
    echo -e "${YELLOW}🚀 Starting containers...${NC}"
    
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" up -d
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Containers started successfully${NC}"
        echo ""
        echo -e "${GREEN}🌐 Application: http://localhost:3000${NC}"
        echo -e "${GREEN}👤 Admin Panel: http://localhost:3000/admin${NC}"
        echo -e "${GREEN}🗄️  Database: localhost:5432${NC}"
    else
        echo -e "${RED}❌ Failed to start containers${NC}"
        exit 1
    fi
}

# Function to show logs
show_logs() {
    if [ "$LOGS" = true ] && [ "$BUILD_ONLY" = false ]; then
        echo -e "${BLUE}📋 Showing logs (Ctrl+C to exit)...${NC}"
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" logs -f
    fi
}

# Function to show status
show_status() {
    echo -e "${BLUE}📊 Container Status:${NC}"
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps
    echo ""
    
    # Check if services are healthy
    echo -e "${BLUE}🏥 Health Checks:${NC}"
    
    # Check database
    if $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres -d fakegoogle >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Database: Healthy${NC}"
    else
        echo -e "${RED}❌ Database: Unhealthy${NC}"
    fi
    
    # Check app
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Application: Healthy${NC}"
    else
        echo -e "${YELLOW}⏳ Application: Starting up...${NC}"
    fi
}

# Function to show environment info
show_environment() {
    echo -e "${BLUE}📋 Environment Information:${NC}"
    echo "   Mode: $([ "$DEVELOPMENT" = true ] && echo "Development" || echo "Production")"
    echo "   Compose File: $COMPOSE_FILE"
    echo "   Clean Build: $([ "$CLEAN_BUILD" = true ] && echo "Yes" || echo "No")"
    echo "   Build Only: $([ "$BUILD_ONLY" = true ] && echo "Yes" || echo "No")"
    echo ""
    
    # Check for .env file
    if [ -f ".env" ]; then
        echo -e "${GREEN}✅ .env file found${NC}"
    elif [ -f ".env.local" ]; then
        echo -e "${GREEN}✅ .env.local file found${NC}"
    else
        echo -e "${YELLOW}⚠️  No .env file found (will use defaults)${NC}"
    fi
    
    echo ""
}

# Cleanup function for graceful exit
cleanup_on_exit() {
    if [ "$LOGS" = true ]; then
        echo -e "\n${YELLOW}🛑 Stopping log stream...${NC}"
    fi
}

# Set up cleanup trap
trap cleanup_on_exit EXIT INT TERM

# Main deployment sequence
main() {
    echo -e "${BLUE}🚀 Fake Google Deployment${NC}"
    echo "========================================"
    
    # Check Docker prerequisites first
    check_docker
    
    show_environment
    
    # If stop only, just stop and exit
    if [ "$STOP_ONLY" = true ]; then
        stop_containers
        return
    fi
    
    stop_containers
    cleanup
    build_images
    start_containers
    
    # Wait a moment for services to start
    if [ "$BUILD_ONLY" = false ]; then
        sleep 5
        show_status
    fi
    
    show_logs
    
    echo ""
    echo -e "${GREEN}🎉 Docker deployment complete!${NC}"
    echo "========================================"
    
    if [ "$BUILD_ONLY" = false ] && [ "$LOGS" = false ]; then
        echo -e "${BLUE}💡 Use '$DOCKER_COMPOSE_CMD -f $COMPOSE_FILE logs -f' to view logs${NC}"
        echo -e "${BLUE}💡 Use '$DOCKER_COMPOSE_CMD -f $COMPOSE_FILE down' to stop${NC}"
    fi
}

# Run main function
main
