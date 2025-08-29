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
BASE_DIR="/opt/fake-google"
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

# Help function
show_help() {
    echo "Fake Google - Production Deployment"
    echo "===================================="
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Deployment Options:"
    echo "  -v, --version TAG       Deploy specific version/tag (required)"
    echo "  -f, --force             Force deployment even if version exists"
    echo "  --no-backup             Skip backup of current deployment"
    echo "  --dry-run               Show what would be done without executing"
    echo ""
    echo "Management Options:"
    echo "  -r, --rollback TAG      Rollback to specific version"
    echo "  -l, --list              List available deployed versions"
    echo "  -c, --cleanup           Remove old deployments (keeps last 5)"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -v v1.2.3                    # Deploy version v1.2.3"
    echo "  $0 -v main                      # Deploy latest main branch"
    echo "  $0 -v v1.2.3 --force            # Force redeploy even if exists"
    echo "  $0 -r v1.2.2                    # Rollback to v1.2.2"
    echo "  $0 --list                       # List deployed versions"
    echo "  $0 --cleanup                    # Remove old deployments"
    echo ""
    echo "Directory Structure:"
    echo "  $BASE_DIR/"
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
    echo "  • Run as user with permission to $BASE_DIR"
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
        -c|--cleanup)
            CLEANUP_OLD=true
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
    
    # List all versions
    for version_dir in "$RELEASES_DIR"/*; do
        if [ -d "$version_dir" ]; then
            version=$(basename "$version_dir")
            if [ "$version" = "$CURRENT_VERSION" ]; then
                echo -e "${GREEN}• $version (current)${NC}"
            else
                echo "• $version"
            fi
        fi
    done
    
    if [ -z "$CURRENT_VERSION" ]; then
        log_warning "No current deployment found"
    fi
}

# Clone specific version
clone_version() {
    local version="$1"
    local target_dir="$RELEASES_DIR/$version"
    
    log_step "Cloning version $version..."
    
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
    
    # Clone the repository
    execute_or_simulate "git clone '$REPO_URL' '$target_dir'"
    
    if [ "$DRY_RUN" = false ]; then
        cd "$target_dir"
        
        # Checkout specific version/tag/branch
        if git rev-parse --verify "refs/tags/$version" >/dev/null 2>&1; then
            # It's a tag
            execute_or_simulate "git checkout tags/$version"
            log_info "Checked out tag: $version"
        elif git rev-parse --verify "refs/heads/$version" >/dev/null 2>&1; then
            # It's a branch
            execute_or_simulate "git checkout $version"
            log_info "Checked out branch: $version"
        elif git rev-parse --verify "$version" >/dev/null 2>&1; then
            # It's a commit hash
            execute_or_simulate "git checkout $version"
            log_info "Checked out commit: $version"
        else
            log_error "Version $version not found in repository"
            execute_or_simulate "rm -rf '$target_dir'"
            exit 1
        fi
        
        # Get actual commit info
        COMMIT_HASH=$(git rev-parse HEAD)
        COMMIT_DATE=$(git show -s --format=%ci HEAD)
        
        # Create deployment info file
        cat > "$target_dir/.deployment-info" << EOF
VERSION=$version
COMMIT_HASH=$COMMIT_HASH
COMMIT_DATE=$COMMIT_DATE
DEPLOYED_AT=$(date -Iseconds)
DEPLOYED_BY=$(whoami)
EOF
        
        cd - >/dev/null
    fi
    
    log_success "Version $version cloned successfully"
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
    if docker ps | grep -q postgres; then
        log_info "Creating database backup..."
        execute_or_simulate "docker exec fake-google-postgres-1 pg_dump -U postgres fakegoogle > '$backup_path.sql'"
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
    
    # Stop current containers
    if [ -L "$CURRENT_LINK" ]; then
        log_info "Stopping current containers..."
        if [ "$DRY_RUN" = false ]; then
            cd "$CURRENT_LINK"
            $DOCKER_COMPOSE_CMD down || true
            cd - >/dev/null
        fi
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
    backup_current
    clone_version "$version"
    link_shared_files "$version"
    build_application "$version"
    switch_version "$version"
    
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
}

# Main script logic
main() {
    echo -e "${BLUE}🚀 Fake Google Production Deployment${NC}"
    echo "======================================"
    
    check_prerequisites
    
    # Handle different commands
    if [ "$LIST_VERSIONS" = true ]; then
        list_versions
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
        log_error "Version is required for deployment"
        echo "Use -v/--version to specify a version, or --help for usage"
        exit 1
    fi
    
    deploy "$VERSION"
}

# Run main function
main
