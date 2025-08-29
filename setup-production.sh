#!/bin/bash

# Production Environment Setup Script
# Run this once on your production server to set up the deployment structure

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_DIR="/opt/fake-google"
SERVICE_USER="fake-google"

echo -e "${BLUE}🏗️  Setting up Fake Google Production Environment${NC}"
echo "=================================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}⚠️  This script should be run as root for initial setup${NC}"
    echo "sudo $0"
    exit 1
fi

# Create service user
if ! id "$SERVICE_USER" &>/dev/null; then
    echo "Creating service user: $SERVICE_USER"
    useradd -r -s /bin/bash -d "$BASE_DIR" -m "$SERVICE_USER"
    usermod -aG docker "$SERVICE_USER"
else
    echo "Service user $SERVICE_USER already exists"
fi

# Create directory structure
echo "Creating directory structure..."
mkdir -p "$BASE_DIR"/{releases,shared,backups}
chown -R "$SERVICE_USER:$SERVICE_USER" "$BASE_DIR"

# Copy deployment script
if [ -f "./production-deploy.sh" ]; then
    cp "./production-deploy.sh" "$BASE_DIR/deploy.sh"
    chown "$SERVICE_USER:$SERVICE_USER" "$BASE_DIR/deploy.sh"
    chmod +x "$BASE_DIR/deploy.sh"
    echo "Deployment script installed to $BASE_DIR/deploy.sh"
fi

# Create systemd service (optional)
cat > /etc/systemd/system/fake-google.service << EOF
[Unit]
Description=Fake Google Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$BASE_DIR/current
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
echo "Systemd service created (optional: systemctl enable fake-google)"

echo ""
echo -e "${GREEN}✅ Production environment setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Switch to service user: sudo su - $SERVICE_USER"
echo "2. Configure environment: nano $BASE_DIR/shared/.env"
echo "3. Deploy first version: $BASE_DIR/deploy.sh -v v1.0.0"
echo ""
echo "Commands:"
echo "• Deploy: $BASE_DIR/deploy.sh -v <version>"
echo "• List: $BASE_DIR/deploy.sh --list"
echo "• Rollback: $BASE_DIR/deploy.sh -r <version>"
echo "• Cleanup: $BASE_DIR/deploy.sh --cleanup"
