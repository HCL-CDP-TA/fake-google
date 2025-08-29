# Production Deployment Guide

## Quick Setup

1. **Copy the script to your production server:**

   ```bash
   scp production-deploy.sh user@server:/data/custom/fake-google/
   ```

2. **Make it executable:**

   ```bash
   chmod +x /data/custom/fake-google/production-deploy.sh
   ```

3. **First time setup:**
   ```bash
   sudo /data/custom/fake-google/production-deploy.sh --version v1.0.0
   ```

## Usage Examples

### Deploy a new version

```bash
# Deploy a specific tag
sudo ./production-deploy.sh --version v1.2.3

# Deploy latest main branch
sudo ./production-deploy.sh --version main

# Force redeploy (useful for rebuilding)
sudo ./production-deploy.sh --version v1.2.3 --force

# Dry run to see what would happen
sudo ./production-deploy.sh --version v1.2.3 --dry-run
```

### Management Commands

```bash
# Show current status
./production-deploy.sh --status

# List all deployed versions
./production-deploy.sh --list

# Rollback to previous version
sudo ./production-deploy.sh --rollback v1.2.2

# Clean up old versions (keeps last 5)
sudo ./production-deploy.sh --cleanup
```

## Directory Structure

After deployment, your production structure will be:

```
/data/custom/fake-google/
├── releases/                    # All deployed versions
│   ├── v1.2.3/                 # Specific version directory
│   │   ├── .deployment-info    # Deployment metadata
│   │   ├── .env -> ../shared/.env  # Symlinked config
│   │   └── [app files]
│   └── v1.2.4/
├── current -> releases/v1.2.4  # Symlink to active version
├── shared/                     # Shared files between deployments
│   ├── .env                    # Production environment config
│   └── uploads/                # Persistent uploads
└── backups/                    # Deployment backups
    ├── backup-v1.2.3-20250829-140000.sql
    └── backup-v1.2.3-20250829-140000.info
```

## Environment Configuration

Edit `/data/custom/fake-google/shared/.env` with your production settings:

```bash
# Database
DATABASE_URL=postgres://postgres:password@postgres:5432/fakegoogle

# Google APIs
GOOGLE_SEARCH_API_KEY=your_actual_api_key
GOOGLE_SEARCH_ENGINE_ID=your_actual_engine_id
GOOGLE_GEMINI_API_KEY=your_actual_gemini_key

# Production settings
NODE_ENV=production
```

## Zero-Downtime Deployment Process

1. **Clone** new version to separate directory
2. **Build** application with Docker
3. **Backup** current deployment and database
4. **Stop** current containers
5. **Switch** symlink to new version
6. **Start** new containers
7. **Health check** to verify deployment

## Troubleshooting

### Container Already Running Error

If deployment fails with container conflicts:

```bash
# Check running containers
docker ps | grep fake-google

# Option 1: Force deployment (stops containers automatically)
./production-deploy.sh -v v1.2.3 --force

# Option 2: Manual cleanup
docker stop $(docker ps --format "{{.Names}}" | grep fake-google)
docker rm $(docker ps -a --format "{{.Names}}" | grep fake-google)

# Option 3: Use regular deploy script to stop
./deploy.sh --stop
```

### Port Conflict Errors

If ports 3001 or 5433 are in use:

```bash
# Check what's using the ports
lsof -i:3001
lsof -i:5433

# Option 1: Change ports in environment
echo "APP_PORT=3050" >> /data/custom/fake-google/shared/.env
echo "DB_PORT=5450" >> /data/custom/fake-google/shared/.env

# Option 2: Force deployment (attempts to resolve automatically)
./production-deploy.sh -v v1.2.3 --force
```

### Check deployment status

```bash
./production-deploy.sh --status
```

### View container logs

```bash
cd /data/custom/fake-google/current
docker-compose logs -f
```

### Manual rollback

```bash
sudo ./production-deploy.sh --rollback v1.2.2
```

### Emergency stop

```bash
cd /data/custom/fake-google/current
docker-compose down
```

## Best Practices

1. **Always test deployments** in staging first
2. **Use semantic versioning** for tags (v1.2.3)
3. **Monitor application** after deployment
4. **Keep backups** of critical data
5. **Use `--dry-run`** to preview changes
6. **Tag releases** in git before deploying

## Prerequisites

- Docker and Docker Compose installed
- Git installed
- Sufficient disk space (each version ~500MB)
- Network access to GitHub
- Proper permissions to `/data/custom/fake-google/`
