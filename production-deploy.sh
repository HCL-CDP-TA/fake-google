#!/bin/bash

# Fake Google Production Deployment Script
# Deploys specific versions to separate directories with zero-downtime

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/HCL-CDP-TA/fake-google.git"
DEFAULT_BASE_DIR="/data/custom/fake-google"
BASE_DIR="${DEPLOY_BASE_DIR:-$DEFAULT_BASE_DIR}"
RELEASES_DIR="$BASE_DIR/releases"
CURRENT_LINK="$BASE_DIR/current"
SHARED_DIR="$BASE_DIR/shared"
BACKUP_DIR="$BASE_DIR/backups"
APP_NAME="fake-google"

# Default values
VERSION=""
ROLLBACK_VERSION=""
LIST_VERSIONS=false
CLEANUP_OLD=false
BACKUP_CURRENT=true
FORCE_DEPLOY=false
DRY_RUN=false
SHOW_STATUS=false
USE_CURRENT_DIR=false
USE_LOCAL_REPO=false
INIT_DATABASE=false

# Help function
show_help() {
    echo "Fake Google - Production Deployment"
    echo "===================================="
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Deployment Options:"
    echo "  -v, --version TAG       Deploy specific release version/tag (required)"
    echo "  -f, --force             Force deployment (stop ALL containers, overwrite existing)"
    echo "  --no-backup             Skip backup of current deployment"
    echo "  --dry-run               Show what would be done without executing"
    echo "  --current-dir           Use current directory for development deployment"
    echo "  --local                 Deploy from local repository (no GitHub)"
    echo "  --base-dir PATH         Custom base directory (default: /data/custom/fake-google)"
    echo ""
    echo "Management Options:"
    echo "  -r, --rollback TAG      Rollback to specific release version"
    echo "  -l, --list              List available deployed versions"
    echo "  -s, --status            Show current deployment status"
    echo "  -c, --cleanup           Remove old deployments (keeps last 5)"
    echo "  --init-db               Initialize database on first deployment"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -v v1.0.0 --init-db           # First deployment with database setup"
    echo "  $0 -v v1.2.3                    # Deploy release v1.2.3 (stops app, keeps DB running)"
    echo "  $0 -v v2.0.0                    # Deploy release v2.0.0"
    echo "  $0 -v v1.2.3 --local           # Deploy current local state as v1.2.3 (testing)"
    echo "  $0 -v v1.2.3 --current-dir     # Deploy to current directory structure"
    echo "  $0 -v v1.2.3 --force            # Force redeploy (stop containers, overwrite existing)"
    echo "  $0 -r v1.2.2                    # Rollback to release v1.2.2"
    echo "  $0 --list                       # List deployed versions"
    echo "  $0 --cleanup                    # Remove old deployments"
    echo ""
    echo "Directory Structure:"
    echo "  /data/custom/fake-google/"
    echo "  ├── releases/           # All deployed versions"
    echo "  │   ├── v1.2.3/"
    echo "  │   └── v1.2.4/"
    echo "  ├── current -> releases/v1.2.4  # Symlink to active version"
    echo "  ├── shared/             # Shared files (.env, uploads, etc.)"
    echo "  └── backups/            # Database/config backups"
    echo ""
    echo "Prerequisites:"
    echo "  • Docker and Docker Compose installed"
    echo "  • Git installed"
    echo "  • Sufficient disk space for multiple versions"
    echo "  • Run as user with permission to /data/custom/fake-google"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -r|--rollback)
            ROLLBACK_VERSION="$2"
            shift 2
            ;;
        -l|--list)
            LIST_VERSIONS=true
            shift
            ;;
        -s|--status)
            SHOW_STATUS=true
            shift
            ;;
        -c|--cleanup)
            CLEANUP_OLD=true
            shift
            ;;
        --init-db)
            INIT_DATABASE=true
            shift
            ;;
        -f|--force)
            FORCE_DEPLOY=true
            shift
            ;;
        --no-backup)
            BACKUP_CURRENT=false
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --current-dir)
            USE_CURRENT_DIR=true
            shift
            ;;
        --local)
            USE_LOCAL_REPO=true
            shift
            ;;
        --base-dir)
            BASE_DIR="$2"
            RELEASES_DIR="$BASE_DIR/releases"
            CURRENT_LINK="$BASE_DIR/current"
            SHARED_DIR="$BASE_DIR/shared"
            BACKUP_DIR="$BASE_DIR/backups"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Utility functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${PURPLE}🔄 $1${NC}"
}

# Check and handle running containers
check_running_containers() {
    log_step "Checking for running containers..."
    
    local app_containers=$(docker ps --format "{{.Names}}" | grep -E "fake-google-app" || true)
    local db_containers=$(docker ps --format "{{.Names}}" | grep -E "fake-google-db" || true)
    local other_containers=$(docker ps --format "{{.Names}}" | grep -E "fake-google" | grep -v -E "(fake-google-app|fake-google-db)" || true)
    
    # Always stop app containers during deployment (they need to be updated)
    if [ -n "$app_containers" ]; then
        log_info "Stopping app containers (required for deployment):"
        echo "$app_containers" | sed 's/^/  • /'
        if [ "$DRY_RUN" = false ]; then
            echo "$app_containers" | xargs docker stop 2>/dev/null || true
            echo "$app_containers" | xargs docker rm 2>/dev/null || true
        fi
    fi
    
    # Handle database containers
    if [ -n "$db_containers" ]; then
        log_warning "Found running database containers:"
        echo "$db_containers" | sed 's/^/  • /'
        
        if [ "$FORCE_DEPLOY" = true ]; then
            log_info "Force deploy enabled, will stop database containers"
            if [ "$DRY_RUN" = false ]; then
                echo "$db_containers" | xargs docker stop 2>/dev/null || true
                echo "$db_containers" | xargs docker rm 2>/dev/null || true
            fi
        else
            log_info "Database containers will continue running (use --force to restart them)"
        fi
    fi
    
    # Handle other containers
    if [ -n "$other_containers" ]; then
        log_warning "Found other fake-google containers:"
        echo "$other_containers" | sed 's/^/  • /'
        
        if [ "$FORCE_DEPLOY" = true ]; then
            log_info "Force deploy enabled, will stop these containers"
            if [ "$DRY_RUN" = false ]; then
                echo "$other_containers" | xargs docker stop 2>/dev/null || true
                echo "$other_containers" | xargs docker rm 2>/dev/null || true
            fi
        else
            echo ""
            log_error "Other containers are running. Use one of these options:"
            echo "  1. Stop containers first: docker stop \$(docker ps --format \"{{.Names}}\" | grep fake-google)"
            echo "  2. Use --force flag to automatically stop all containers"
            echo "  3. Use deploy.sh --stop to stop via compose"
            echo ""
            exit 1
        fi
    fi
    
    log_success "Container check completed"
}

# Check for port conflicts
check_port_conflicts() {
    log_step "Checking for port conflicts..."
    
    local app_port=3001
    local db_port=5433
    
    # Check if .env exists and extract ports
    if [ -f "$SHARED_DIR/.env" ]; then
        local env_app_port=$(grep "^APP_PORT=" "$SHARED_DIR/.env" 2>/dev/null | cut -d'=' -f2 || echo "")
        local env_db_port=$(grep "^DB_PORT=" "$SHARED_DIR/.env" 2>/dev/null | cut -d'=' -f2 || echo "")
        
        [ -n "$env_app_port" ] && app_port="$env_app_port"
        [ -n "$env_db_port" ] && db_port="$env_db_port"
    fi
    
    local conflicts=()
    
    # Check app port
    if lsof -i:$app_port >/dev/null 2>&1; then
        conflicts+=("Port $app_port (app)")
    fi
    
    # Check database port
    if lsof -i:$db_port >/dev/null 2>&1; then
        conflicts+=("Port $db_port (database)")
    fi
    
    if [ ${#conflicts[@]} -gt 0 ]; then
        log_warning "Port conflicts detected:"
        for conflict in "${conflicts[@]}"; do
            echo "  • $conflict"
        done
        
        if [ "$FORCE_DEPLOY" = true ]; then
            log_info "Force deploy enabled, will attempt to stop conflicting services"
        else
            echo ""
            log_error "Port conflicts found. Use one of these options:"
            echo "  1. Change ports in $SHARED_DIR/.env"
            echo "  2. Stop services using these ports"
            echo "  3. Use --force flag to attempt automatic resolution"
            echo ""
            exit 1
        fi
    else
        log_success "No port conflicts found"
    fi
}

# Check prerequisites

# Check if running as dry run
execute_or_simulate() {
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN] Would execute: $1${NC}"
    else
        eval "$1"
    fi
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker >/dev/null 2>&1; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
    elif command -v docker-compose >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        log_error "Docker Compose is not available"
        exit 1
    fi
    
    # Check Git
    if ! command -v git >/dev/null 2>&1; then
        log_error "Git is not installed"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Setup directory structure
setup_directories() {
    log_step "Setting up directory structure..."
    
    execute_or_simulate "mkdir -p '$RELEASES_DIR'"
    execute_or_simulate "mkdir -p '$SHARED_DIR'"
    execute_or_simulate "mkdir -p '$BACKUP_DIR'"
    
    # Create shared .env if it doesn't exist
    if [ ! -f "$SHARED_DIR/.env" ] && [ "$DRY_RUN" = false ]; then
        cat > "$SHARED_DIR/.env" << EOF
# Fake Google Production Environment
# Copy your environment variables here

# Database
DATABASE_URL=postgres://postgres:password@postgres:5432/fakegoogle

# Google APIs (configure these)
# GOOGLE_SEARCH_API_KEY=your_api_key_here
# GOOGLE_SEARCH_ENGINE_ID=your_engine_id_here
# GOOGLE_GEMINI_API_KEY=your_gemini_key_here

# Production settings
NODE_ENV=production
EOF
        log_info "Created template .env file at $SHARED_DIR/.env"
        log_warning "Please configure your environment variables in $SHARED_DIR/.env"
    fi
    
    log_success "Directory structure ready"
}

# List deployed versions
list_versions() {
    log_info "Deployed versions:"
    echo "=================="
    
    if [ ! -d "$RELEASES_DIR" ]; then
        log_warning "No releases directory found"
        return
    fi
    
    # Get current version
    CURRENT_VERSION=""
    if [ -L "$CURRENT_LINK" ]; then
        CURRENT_VERSION=$(basename "$(readlink "$CURRENT_LINK")")
    fi
    
    # List all versions with deployment info
    for version_dir in "$RELEASES_DIR"/*; do
        if [ -d "$version_dir" ]; then
            version=$(basename "$version_dir")
            if [ "$version" = "$CURRENT_VERSION" ]; then
                echo -e "${GREEN}• $version (current)${NC}"
            else
                echo "• $version"
            fi
            
            # Show deployment info if available
            if [ -f "$version_dir/.deployment-info" ]; then
                local deployed_at=$(grep "DEPLOYED_AT=" "$version_dir/.deployment-info" | cut -d'=' -f2)
                local deployed_by=$(grep "DEPLOYED_BY=" "$version_dir/.deployment-info" | cut -d'=' -f2)
                echo "  └─ Deployed: $deployed_at by $deployed_by"
            fi
        fi
    done
    
    echo ""
    
    # Show available git tags (releases)
    echo -e "${CYAN}Available releases in repository:${NC}"
    if command -v git >/dev/null 2>&1; then
        # Try to get release tags from remote
        local releases=$(git ls-remote --tags "$REPO_URL" 2>/dev/null | \
                        grep -E 'refs/tags/v?[0-9]+\.[0-9]+\.[0-9]+' | \
                        sed 's/.*refs\/tags\///' | \
                        sort -V | \
                        tail -10)
        
        if [ -n "$releases" ]; then
            echo "$releases" | while read tag; do
                echo "  $tag"
            done
        else
            echo "  No release tags found. Create releases with:"
            echo "    git tag v1.0.0"
            echo "    git push origin v1.0.0"
        fi
    else
        echo "  (git not available to list remote releases)"
    fi
}

# Show deployment status
show_status() {
    log_info "Deployment Status"
    echo "=================="
    echo ""
    
    # Current version
    if [ -L "$CURRENT_LINK" ]; then
        local current_version=$(basename "$(readlink "$CURRENT_LINK")")
        echo -e "${GREEN}Current Version: $current_version${NC}"
        
        # Show deployment info
        if [ -f "$CURRENT_LINK/.deployment-info" ]; then
            echo ""
            echo "Deployment Information:"
            while IFS='=' read -r key value; do
                echo "  $key: $value"
            done < "$CURRENT_LINK/.deployment-info"
        fi
    else
        echo -e "${YELLOW}No current deployment${NC}"
    fi
    
    echo ""
    
    # Service status
    echo "Service Status:"
    if [ -L "$CURRENT_LINK" ]; then
        cd "$CURRENT_LINK"
        if $DOCKER_COMPOSE_CMD ps >/dev/null 2>&1; then
            $DOCKER_COMPOSE_CMD ps
        else
            echo "  No containers running"
        fi
        cd - >/dev/null
    else
        echo "  No deployment to check"
    fi
    
    echo ""
    
    # Disk usage
    echo "Disk Usage:"
    if [ -d "$BASE_DIR" ]; then
        du -sh "$BASE_DIR"/* 2>/dev/null | while read size path; do
            echo "  $(basename "$path"): $size"
        done
    fi
    
    echo ""
    
    # Available versions count
    local version_count=0
    if [ -d "$RELEASES_DIR" ]; then
        version_count=$(find "$RELEASES_DIR" -maxdepth 1 -type d | wc -l)
        version_count=$((version_count - 1)) # Subtract the releases dir itself
    fi
    echo "Available Versions: $version_count"
    
    # Health check
    echo ""
    echo "Health Check:"
    if curl -f -s http://localhost:3000 >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ Application responding on port 3000${NC}"
    else
        echo -e "  ${RED}❌ Application not responding on port 3000${NC}"
    fi
}

# Validate version format
validate_version() {
    local version="$1"
    
    # For local deployments, allow any version name
    if [ "$USE_LOCAL_REPO" = true ]; then
        return 0
    fi
    
    # Check if version follows semantic versioning pattern (v1.2.3 or 1.2.3)
    if [[ "$version" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$ ]]; then
        return 0
    fi
    
    log_warning "Version '$version' doesn't follow semantic versioning (e.g., v1.2.3)"
    log_warning "For production, use release tags with semantic versioning"
    
    # Ask for confirmation for non-semantic versions
    if [ "$DRY_RUN" = false ]; then
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "Deployment cancelled"
            exit 1
        fi
    fi
}

# Clone specific version
clone_version() {
    local version="$1"
    local target_dir="$RELEASES_DIR/$version"
    
    # Validate version format
    validate_version "$version"
    
    log_step "Deploying release version $version..."
    
    # Check if version already exists
    if [ -d "$target_dir" ] && [ "$FORCE_DEPLOY" = false ]; then
        log_error "Version $version already exists. Use --force to redeploy"
        exit 1
    fi
    
    # Remove existing if force deploy
    if [ -d "$target_dir" ] && [ "$FORCE_DEPLOY" = true ]; then
        log_warning "Removing existing version $version"
        execute_or_simulate "rm -rf '$target_dir'"
    fi
    
    if [ "$USE_LOCAL_REPO" = true ]; then
        # Deploy from local repository
        log_info "Deploying from local repository..."
        
        # Check if we're in a git repository
        if ! git rev-parse --git-dir >/dev/null 2>&1; then
            log_error "Not in a git repository. --local requires running from a git repository."
            exit 1
        fi
        
        # Get current repository root
        local repo_root=$(git rev-parse --show-toplevel)
        log_info "Local repo root: $repo_root"
        
        # Copy current repository state
        execute_or_simulate "cp -r '$repo_root' '$target_dir'"
        
        if [ "$DRY_RUN" = false ]; then
            cd "$target_dir"
            
            # Clean up git history and working directory
            log_info "Cleaning deployment directory..."
            rm -rf .git 2>/dev/null || true
            
            # Create minimal git info for deployment tracking
            mkdir -p .git
            echo "Local deployment from $repo_root" > .git/description
            
            # Get current commit info if available
            cd "$repo_root"
            if git rev-parse HEAD >/dev/null 2>&1; then
                COMMIT_HASH=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
                COMMIT_DATE=$(git show -s --format=%ci HEAD 2>/dev/null || echo "unknown")
                BRANCH_NAME=$(git branch --show-current 2>/dev/null || echo "unknown")
            else
                COMMIT_HASH="local-uncommitted"
                COMMIT_DATE=$(date -Iseconds)
                BRANCH_NAME="local"
            fi
            
            cd "$target_dir"
        else
            COMMIT_HASH="dry-run"
            COMMIT_DATE="dry-run"
            BRANCH_NAME="dry-run"
        fi
        
        log_success "Local repository copied successfully"
    else
        # Clone from GitHub
        log_info "Cloning from: $REPO_URL"
        execute_or_simulate "git clone --depth 1 '$REPO_URL' '$target_dir'"
        
        if [ "$DRY_RUN" = false ]; then
            cd "$target_dir"
            
            # Checkout specific release tag (prioritize tags over branches)
            log_info "Checking out release: $version"
            if git show-ref --verify --quiet "refs/tags/$version"; then
                # It's a release tag - preferred for production
                execute_or_simulate "git checkout tags/$version"
                log_info "✅ Checked out release tag: $version"
            elif git show-ref --verify --quiet "refs/tags/v$version"; then
                # Try with 'v' prefix
                execute_or_simulate "git checkout tags/v$version"
                log_info "✅ Checked out release tag: v$version"
                version="v$version"  # Update version to include 'v'
            elif git show-ref --verify --quiet "refs/remotes/origin/$version"; then
                # It's a remote branch - warn that this isn't a release
                log_warning "⚠️  '$version' is a branch, not a release tag"
                log_warning "For production, create and deploy release tags (e.g., git tag v1.2.3)"
                execute_or_simulate "git checkout -b $version origin/$version"
                log_info "Checked out branch: $version"
            elif git rev-parse --verify "$version^{commit}" >/dev/null 2>&1; then
                # It's a commit hash
                log_warning "⚠️  '$version' is a commit hash, not a release tag"
                execute_or_simulate "git checkout $version"
                log_info "Checked out commit: $version"
            else
                log_error "Release version '$version' not found in repository"
                log_info "Available release tags: $(git tag -l | grep -E '^v?[0-9]+\.[0-9]+\.[0-9]+' | sort -V | tail -10 | tr '\n' ' ')"
                log_info "Available branches: $(git branch -r | head -5 | tr '\n' ' ')"
                log_error "Create a release tag first: git tag v1.2.3 && git push origin v1.2.3"
                execute_or_simulate "rm -rf '$target_dir'"
                exit 1
            fi
            
            # Get actual commit info
            COMMIT_HASH=$(git rev-parse HEAD)
            COMMIT_DATE=$(git show -s --format=%ci HEAD)
            BRANCH_NAME=$version
            
            cd - >/dev/null
        fi
    fi
    
    # Create deployment info file
    if [ "$DRY_RUN" = false ]; then
        cat > "$target_dir/.deployment-info" << EOF
VERSION=$version
COMMIT_HASH=$COMMIT_HASH
COMMIT_DATE=$COMMIT_DATE
BRANCH_NAME=$BRANCH_NAME
DEPLOYED_AT=$(date -Iseconds)
DEPLOYED_BY=$(whoami)
DEPLOYMENT_TYPE=$([ "$USE_LOCAL_REPO" = true ] && echo "local" || echo "remote")
EOF
    fi
    
    log_success "Version $version deployed successfully"
}

# Link shared files
link_shared_files() {
    local version="$1"
    local target_dir="$RELEASES_DIR/$version"
    
    log_step "Linking shared files for version $version..."
    
    # Link .env file
    execute_or_simulate "ln -sf '$SHARED_DIR/.env' '$target_dir/.env'"
    
    # Link other shared directories if they exist
    if [ -d "$SHARED_DIR/uploads" ]; then
        execute_or_simulate "ln -sf '$SHARED_DIR/uploads' '$target_dir/uploads'"
    fi
    
    log_success "Shared files linked"
}

# Build application
build_application() {
    local version="$1"
    local target_dir="$RELEASES_DIR/$version"
    
    log_step "Building application for version $version..."
    
    if [ "$DRY_RUN" = false ]; then
        cd "$target_dir"
        
        # Build with Docker Compose
        execute_or_simulate "$DOCKER_COMPOSE_CMD build --no-cache"
        
        cd - >/dev/null
    fi
    
    log_success "Application built successfully"
}

# Check if database exists and is accessible
check_database() {
    log_step "Checking database connectivity..."
    
    # Start database container if not running
    if [ -L "$CURRENT_LINK" ]; then
        cd "$CURRENT_LINK"
        if ! $DOCKER_COMPOSE_CMD ps postgres | grep -q "Up"; then
            log_info "Starting database container..."
            
            # Remove any existing stopped containers with the same name
            if [ "$DRY_RUN" = false ]; then
                # Check for existing containers (running or stopped)
                if docker ps -a --format "{{.Names}}" | grep -q "fake-google-db"; then
                    log_info "Removing existing fake-google-db container..."
                    docker rm -f fake-google-db 2>/dev/null || true
                fi
            fi
            
            execute_or_simulate "$DOCKER_COMPOSE_CMD up -d postgres"
            
            # Wait for database to be ready
            if [ "$DRY_RUN" = false ]; then
                sleep 10
                local retries=0
                while [ $retries -lt 30 ]; do
                    if $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
                        break
                    fi
                    sleep 2
                    ((retries++))
                done
                
                if [ $retries -eq 30 ]; then
                    log_error "Database failed to start after 60 seconds"
                    return 1
                fi
            fi
        fi
        cd - >/dev/null
    fi
    
    # Check if database exists
    if [ "$DRY_RUN" = false ] && [ -L "$CURRENT_LINK" ]; then
        cd "$CURRENT_LINK"
        if $DOCKER_COMPOSE_CMD exec -T postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw fakegoogle; then
            log_success "Database 'fakegoogle' exists and is accessible"
            cd - >/dev/null
            return 0
        else
            log_warning "Database 'fakegoogle' does not exist"
            cd - >/dev/null
            return 1
        fi
    fi
    
    return 0
}

# Initialize database
initialize_database() {
    log_step "Initializing database..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would initialize database"
        return 0
    fi
    
    if [ ! -L "$CURRENT_LINK" ]; then
        log_error "No current deployment found for database initialization"
        return 1
    fi
    
    cd "$CURRENT_LINK"
    
    # Start database container
    log_info "Starting database container..."
    
    # Remove any existing stopped containers with the same name
    if docker ps -a --format "{{.Names}}" | grep -q "fake-google-db"; then
        log_info "Removing existing fake-google-db container..."
        docker rm -f fake-google-db 2>/dev/null || true
    fi
    
    $DOCKER_COMPOSE_CMD up -d postgres
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    local retries=0
    while [ $retries -lt 30 ]; do
        if $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
            break
        fi
        sleep 2
        ((retries++))
    done
    
    if [ $retries -eq 30 ]; then
        log_error "Database failed to start after 60 seconds"
        cd - >/dev/null
        return 1
    fi
    
    # Create database if it doesn't exist
    log_info "Creating database 'fakegoogle'..."
    $DOCKER_COMPOSE_CMD exec -T postgres psql -U postgres -c "CREATE DATABASE fakegoogle;" 2>/dev/null || {
        log_info "Database 'fakegoogle' already exists or creation failed"
    }
    
    # Run database migrations/setup if available
    if [ -f "setup-database.sql" ]; then
        log_info "Running database setup script..."
        $DOCKER_COMPOSE_CMD exec -T postgres psql -U postgres -d fakegoogle -f /setup-database.sql
    fi
    
    # Start the full application to ensure database tables are created
    log_info "Starting application to initialize database schema..."
    $DOCKER_COMPOSE_CMD up -d
    
    # Wait a moment for application to initialize
    sleep 15
    
    # Check if application created the necessary tables
    if $DOCKER_COMPOSE_CMD exec -T postgres psql -U postgres -d fakegoogle -c "\dt" | grep -q "ads"; then
        log_success "Database initialized successfully with application tables"
    else
        log_warning "Database created but application tables may not be initialized yet"
    fi
    
    cd - >/dev/null
    log_success "Database initialization completed"
}

# Backup current deployment
backup_current() {
    if [ "$BACKUP_CURRENT" = false ]; then
        log_info "Skipping backup (--no-backup specified)"
        return
    fi
    
    if [ ! -L "$CURRENT_LINK" ]; then
        log_info "No current deployment to backup"
        return
    fi
    
    log_step "Backing up current deployment..."
    
    local current_version=$(basename "$(readlink "$CURRENT_LINK")")
    local backup_name="backup-$current_version-$(date +%Y%m%d-%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    # Backup database if running
    if [ -L "$CURRENT_LINK" ]; then
        cd "$CURRENT_LINK"
        if $DOCKER_COMPOSE_CMD ps postgres | grep -q "Up"; then
            log_info "Creating database backup..."
            if $DOCKER_COMPOSE_CMD exec -T postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw fakegoogle; then
                execute_or_simulate "$DOCKER_COMPOSE_CMD exec -T postgres pg_dump -U postgres fakegoogle > '$backup_path.sql'"
                log_info "Database backup saved to: $backup_path.sql"
            else
                log_warning "Database 'fakegoogle' not found, skipping database backup"
            fi
        else
            log_info "Database not running, skipping database backup"
        fi
        cd - >/dev/null
    fi
    
    # Create deployment info backup
    if [ -f "$CURRENT_LINK/.deployment-info" ]; then
        execute_or_simulate "cp '$CURRENT_LINK/.deployment-info' '$backup_path.info'"
    fi
    
    log_success "Backup created: $backup_name"
}

# Switch to new version
switch_version() {
    local version="$1"
    local target_dir="$RELEASES_DIR/$version"
    
    log_step "Switching to version $version..."
    
    # Stop app containers (always required for deployment)
    log_info "Stopping app containers for version switch..."
    if [ "$DRY_RUN" = false ]; then
        # Stop app containers specifically
        if docker ps --format "table {{.Names}}" | grep -E "fake-google-app" >/dev/null 2>&1; then
            docker stop $(docker ps --format "{{.Names}}" | grep -E "fake-google-app") 2>/dev/null || true
            docker rm $(docker ps -a --format "{{.Names}}" | grep -E "fake-google-app") 2>/dev/null || true
        fi
        
        # If force deploy, stop all containers
        if [ "$FORCE_DEPLOY" = true ]; then
            log_info "Force mode: stopping all fake-google containers..."
            if docker ps --format "table {{.Names}}" | grep -E "fake-google" >/dev/null 2>&1; then
                docker stop $(docker ps --format "{{.Names}}" | grep -E "fake-google") 2>/dev/null || true
                docker rm $(docker ps -a --format "{{.Names}}" | grep -E "fake-google") 2>/dev/null || true
            fi
        fi
        
        # Also try stopping from current deployment directory
        if [ -L "$CURRENT_LINK" ]; then
            cd "$CURRENT_LINK"
            if [ "$FORCE_DEPLOY" = true ]; then
                $DOCKER_COMPOSE_CMD down --remove-orphans || true
            else
                # Only stop app service, keep database running if possible
                $DOCKER_COMPOSE_CMD stop app || true
                $DOCKER_COMPOSE_CMD rm -f app || true
            fi
            cd - >/dev/null
        fi
        
        # Wait for containers to fully stop
        sleep 3
    fi
    
    # Update symlink
    execute_or_simulate "ln -sfn '$target_dir' '$CURRENT_LINK'"
    
    # Start new containers
    log_info "Starting new containers..."
    if [ "$DRY_RUN" = false ]; then
        cd "$CURRENT_LINK"
        $DOCKER_COMPOSE_CMD up -d
        cd - >/dev/null
        
        # Wait for startup
        sleep 10
        
        # Health check
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            log_success "Application is healthy"
        else
            log_warning "Application may still be starting up"
        fi
    fi
    
    log_success "Switched to version $version"
}

# Cleanup old versions
cleanup_old_versions() {
    log_step "Cleaning up old versions..."
    
    if [ ! -d "$RELEASES_DIR" ]; then
        log_info "No releases to clean up"
        return
    fi
    
    # Keep last 5 versions plus current
    local current_version=""
    if [ -L "$CURRENT_LINK" ]; then
        current_version=$(basename "$(readlink "$CURRENT_LINK")")
    fi
    
    # Get all versions sorted by modification time (newest first)
    local versions=()
    while IFS= read -r -d '' dir; do
        versions+=("$(basename "$dir")")
    done < <(find "$RELEASES_DIR" -maxdepth 1 -type d -name "*" -not -path "$RELEASES_DIR" -print0 | xargs -0 ls -td)
    
    # Remove old versions (keep 5 + current)
    local kept=0
    for version in "${versions[@]}"; do
        if [ "$version" = "$current_version" ]; then
            log_info "Keeping current version: $version"
            continue
        fi
        
        if [ $kept -lt 5 ]; then
            log_info "Keeping version: $version"
            ((kept++))
        else
            log_warning "Removing old version: $version"
            execute_or_simulate "rm -rf '$RELEASES_DIR/$version'"
        fi
    done
    
    log_success "Cleanup completed"
}

# Rollback to previous version
rollback() {
    local version="$1"
    local target_dir="$RELEASES_DIR/$version"
    
    if [ ! -d "$target_dir" ]; then
        log_error "Version $version not found for rollback"
        exit 1
    fi
    
    log_step "Rolling back to version $version..."
    
    backup_current
    switch_version "$version"
    
    log_success "Rollback to $version completed"
}

# Main deployment function
deploy() {
    local version="$1"
    
    log_info "Starting deployment of version: $version"
    echo "=========================================="
    
    setup_directories
    
    # Check if this is the first deployment
    local is_first_deployment=false
    if [ ! -L "$CURRENT_LINK" ] && [ ! -d "$RELEASES_DIR" ]; then
        is_first_deployment=true
        log_info "This appears to be the first deployment"
    fi
    
    # For first deployment, automatically initialize database unless explicitly disabled
    if [ "$is_first_deployment" = true ] && [ "$INIT_DATABASE" != false ]; then
        INIT_DATABASE=true
        log_info "First deployment detected - database initialization enabled"
    fi
    
    backup_current
    clone_version "$version"
    link_shared_files "$version"
    build_application "$version"
    
    # Handle database initialization or checking
    if [ "$INIT_DATABASE" = true ]; then
        # For initialization, we need to switch to the new version first
        switch_version "$version"
        initialize_database
    else
        # Check existing database connectivity
        if ! check_database; then
            log_warning "Database check failed or database doesn't exist"
            echo ""
            log_info "If this is your first deployment, use: --init-db"
            log_info "Or ensure your database is properly configured in shared/.env"
            echo ""
            read -p "Continue with deployment anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_error "Deployment cancelled due to database issues"
                exit 1
            fi
        fi
        switch_version "$version"
    fi
    
    log_success "Deployment of $version completed successfully!"
    
    # Show deployment info
    if [ -f "$CURRENT_LINK/.deployment-info" ] && [ "$DRY_RUN" = false ]; then
        echo ""
        log_info "Deployment Information:"
        cat "$CURRENT_LINK/.deployment-info"
    fi
    
    echo ""
    log_info "Application URLs:"
    echo "• Main App: http://localhost:3000"
    echo "• Admin: http://localhost:3000/admin"
    echo "• API: http://localhost:3000/api"
    
    # Final health check
    if [ "$DRY_RUN" = false ]; then
        echo ""
        log_step "Performing health check..."
        sleep 10
        
        if curl -f -s http://localhost:3000 >/dev/null 2>&1; then
            log_success "✅ Application is healthy and responding"
        else
            log_warning "⚠️  Application may still be starting up"
            log_info "Check logs with: cd $CURRENT_LINK && $DOCKER_COMPOSE_CMD logs -f"
        fi
    fi
}

# Main script logic
main() {
    echo -e "${BLUE}🚀 Fake Google Production Deployment${NC}"
    echo "======================================"
    
    # Handle current directory deployment
    if [ "$USE_CURRENT_DIR" = true ]; then
        local current_pwd=$(pwd)
        log_info "Using current directory deployment mode"
        BASE_DIR="$current_pwd"
        RELEASES_DIR="$BASE_DIR/releases"
        CURRENT_LINK="$BASE_DIR/current"
        SHARED_DIR="$BASE_DIR/shared"
        BACKUP_DIR="$BASE_DIR/backups"
        log_info "Base directory: $BASE_DIR"
    else
        log_info "Using production deployment mode"
        log_info "Base directory: $BASE_DIR"
    fi
    
    check_prerequisites
    
    # Check for running containers (unless doing read-only operations)
    if [ "$LIST_VERSIONS" != true ] && [ "$SHOW_STATUS" != true ] && [ "$CLEANUP_OLD" != true ]; then
        check_running_containers
        check_port_conflicts
    fi
    
    # Handle different commands
    if [ "$LIST_VERSIONS" = true ]; then
        list_versions
        exit 0
    fi
    
    if [ "$SHOW_STATUS" = true ]; then
        show_status
        exit 0
    fi
    
    if [ "$CLEANUP_OLD" = true ]; then
        cleanup_old_versions
        exit 0
    fi
    
    if [ -n "$ROLLBACK_VERSION" ]; then
        rollback "$ROLLBACK_VERSION"
        exit 0
    fi
    
    if [ -z "$VERSION" ]; then
        log_error "Release version is required for deployment"
        echo ""
        echo -e "${YELLOW}💡 Usage examples:${NC}"
        echo "  $0 --version v1.2.3        # Deploy release v1.2.3"
        echo "  $0 --version v2.0.0        # Deploy release v2.0.0"
        echo ""
        echo -e "${YELLOW}💡 To create a release:${NC}"
        echo "  git tag v1.2.3"
        echo "  git push origin v1.2.3"
        echo ""
        echo "Use --help for full usage information"
        exit 1
    fi
    
    deploy "$VERSION"
}

# Run main function
main
