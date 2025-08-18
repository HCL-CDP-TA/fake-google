#!/bin/bash

# Fake Google Deploy Script
# This script handles the complete deployment of the fake-google app and database

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="fake-google"
APP_PORT=3000
DB_NAME="fakegoogle"
ADMIN_CONN_DEFAULT="postgres://postgres:admin@localhost:5432/postgres"

# Default values
ADMIN_CONN="${DATABASE_ADMIN_URL:-$ADMIN_CONN_DEFAULT}"
BUILD_ONLY=false
SKIP_DB=false
SKIP_DEPS=false

# Help function
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -b, --build-only        Only build the app, don't start it"
    echo "  -d, --skip-db           Skip database setup"
    echo "  -n, --skip-deps         Skip npm install"
    echo "  --admin-conn STRING     Database admin connection string"
    echo "                          (default: $ADMIN_CONN_DEFAULT)"
    echo ""
    echo "Environment Variables:"
    echo "  DATABASE_ADMIN_URL      Admin database connection string"
    echo "  DATABASE_URL            App database connection string"
    echo "  GOOGLE_SEARCH_API_KEY   Google Custom Search API key"
    echo "  GOOGLE_SEARCH_ENGINE_ID Google Custom Search Engine ID"
    echo "  GOOGLE_GEMINI_API_KEY   Google Gemini API key for AI generation"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh                                    # Full deployment"
    echo "  ./deploy.sh --build-only                      # Build only"
    echo "  ./deploy.sh --skip-db                         # Skip database setup"
    echo "  ./deploy.sh --admin-conn \"postgres://...\"    # Custom admin connection"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -b|--build-only)
            BUILD_ONLY=true
            shift
            ;;
        -d|--skip-db)
            SKIP_DB=true
            shift
            ;;
        -n|--skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --admin-conn)
            ADMIN_CONN="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🚀 Starting deployment of ${APP_NAME}...${NC}"
echo "========================================"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -ti:$port >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to stop existing app
stop_app() {
    echo -e "${YELLOW}📦 Stopping existing app instances...${NC}"
    
    # Kill processes on the app port
    if check_port $APP_PORT; then
        echo "Found processes on port $APP_PORT, stopping them..."
        lsof -ti:$APP_PORT | xargs kill -9 2>/dev/null || true
        sleep 2
        
        if check_port $APP_PORT; then
            echo -e "${RED}Warning: Could not stop all processes on port $APP_PORT${NC}"
        else
            echo -e "${GREEN}✅ Stopped processes on port $APP_PORT${NC}"
        fi
    else
        echo "No processes found on port $APP_PORT"
    fi
    
    # Also try to kill any node processes with our app name
    pkill -f "next" 2>/dev/null || true
    pkill -f "$APP_NAME" 2>/dev/null || true
}

# Function to setup database
setup_database() {
    if [ "$SKIP_DB" = true ]; then
        echo -e "${YELLOW}⏭️  Skipping database setup${NC}"
        return
    fi
    
    echo -e "${YELLOW}🗄️  Setting up database...${NC}"
    
    # Check if create-db-and-table.sh exists
    if [ ! -f "./create-db-and-table.sh" ]; then
        echo -e "${RED}Error: create-db-and-table.sh not found${NC}"
        exit 1
    fi
    
    # Make sure the script is executable
    chmod +x ./create-db-and-table.sh
    
    # Run database setup
    echo "Running database setup with admin connection: ${ADMIN_CONN%/*}/..."
    ./create-db-and-table.sh "$ADMIN_CONN" "$DB_NAME"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database setup complete${NC}"
    else
        echo -e "${RED}❌ Database setup failed${NC}"
        exit 1
    fi
}

# Function to install dependencies
install_dependencies() {
    if [ "$SKIP_DEPS" = true ]; then
        echo -e "${YELLOW}⏭️  Skipping dependency installation${NC}"
        return
    fi
    
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    
    if [ ! -f "package.json" ]; then
        echo -e "${RED}Error: package.json not found${NC}"
        exit 1
    fi
    
    npm install
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
}

# Function to build the app
build_app() {
    echo -e "${YELLOW}🔨 Building the application...${NC}"
    
    npm run build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build complete${NC}"
    else
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
}

# Function to start the app
start_app() {
    if [ "$BUILD_ONLY" = true ]; then
        echo -e "${YELLOW}⏭️  Build-only mode, not starting the app${NC}"
        return
    fi
    
    echo -e "${YELLOW}🚀 Starting the application...${NC}"
    
    # Check required environment variables
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${YELLOW}Warning: DATABASE_URL not set. Using default connection string.${NC}"
        export DATABASE_URL="postgres://postgres:admin@localhost:5432/$DB_NAME"
    fi
    
    # Start the app in production mode
    echo "Starting app on port $APP_PORT..."
    npm run start &
    APP_PID=$!
    
    # Wait a moment for the app to start
    sleep 3
    
    # Check if the app is running
    if check_port $APP_PORT; then
        echo -e "${GREEN}✅ Application started successfully on port $APP_PORT${NC}"
        echo -e "${GREEN}🌐 Visit: http://localhost:$APP_PORT${NC}"
        echo -e "${GREEN}👤 Admin: http://localhost:$APP_PORT/admin${NC}"
        echo -e "${BLUE}📝 App PID: $APP_PID${NC}"
    else
        echo -e "${RED}❌ Application failed to start on port $APP_PORT${NC}"
        exit 1
    fi
}

# Function to show environment info
show_environment() {
    echo -e "${BLUE}📋 Environment Information:${NC}"
    echo "   App Name: $APP_NAME"
    echo "   App Port: $APP_PORT"
    echo "   Database: $DB_NAME"
    echo "   Admin Connection: ${ADMIN_CONN%/*}/..."
    
    if [ -n "$DATABASE_URL" ]; then
        echo "   App Database URL: ${DATABASE_URL%/*}/..."
    else
        echo "   App Database URL: (will use default)"
    fi
    
    if [ -n "$GOOGLE_SEARCH_API_KEY" ]; then
        echo "   Google Search API: ✅ Configured"
    else
        echo "   Google Search API: ❌ Not configured"
    fi
    
    if [ -n "$GOOGLE_GEMINI_API_KEY" ]; then
        echo "   Google Gemini API: ✅ Configured"
    else
        echo "   Google Gemini API: ❌ Not configured"
    fi
    
    echo ""
}

# Function to cleanup on exit
cleanup() {
    if [ "$BUILD_ONLY" = false ] && [ -n "$APP_PID" ]; then
        echo -e "\n${YELLOW}🛑 Shutting down...${NC}"
        kill $APP_PID 2>/dev/null || true
    fi
}

# Set up cleanup trap
trap cleanup EXIT INT TERM

# Main deployment sequence
main() {
    show_environment
    
    stop_app
    setup_database
    install_dependencies
    build_app
    start_app
    
    echo ""
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
    echo "========================================"
    
    if [ "$BUILD_ONLY" = false ]; then
        echo -e "${BLUE}💡 Press Ctrl+C to stop the application${NC}"
        
        # Keep the script running to monitor the app
        wait $APP_PID
    fi
}

# Run main function
main
