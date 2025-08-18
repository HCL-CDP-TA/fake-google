# 🔧 Port Management for Multi-App Deployments

This document explains the port management strategy for deploying Fake Google on servers with multiple applications.

## Problem Statement

When deploying on servers that already host other applications, standard ports like 3000 (Node.js apps) and 5432 (PostgreSQL) are often already in use, causing deployment failures.

## Solution: Smart Port Configuration

This application uses a smart port configuration system that:

1. **Defaults to non-conflicting ports** (3001 for app, 5433 for database)
2. **Provides easy configuration tools** for custom port assignment
3. **Supports multiple deployment environments** on the same server
4. **Uses environment variables** for flexibility

## Quick Start

### 1. Check Current Port Usage

```bash
./port-config.sh status
```

**Example Output:**

```
📊 Current Port Usage:

   Port 3000: ❌ In use       # Standard Node.js port (occupied)
   Port 3001: ✅ Available    # Our default app port (free)
   Port 3002: ✅ Available    # Our default dev port (free)
   Port 5432: ❌ In use       # Standard PostgreSQL port (occupied)
   Port 5433: ✅ Available    # Our default DB port (free)
   Port 5434: ✅ Available    # Our default dev DB port (free)
```

### 2. Configure Ports Automatically

```bash
./port-config.sh interactive
```

This will:

- Check which ports are available
- Suggest safe alternatives for conflicting ports
- Generate a complete `.env` file with proper configuration
- Show you the final configuration summary

### 3. Deploy with Configured Ports

```bash
# Deploy with Docker (recommended)
./docker-deploy.sh build

# Or deploy traditionally
./deploy.sh
```

## Port Configuration Presets

### Multi-App Server (Recommended)

```bash
./port-config.sh preset multi
```

- **App**: 3001 (avoids standard 3000)
- **Database**: 5433 (avoids standard 5432)
- **Purpose**: Safe for servers with existing apps

### Single App Server

```bash
./port-config.sh preset single
```

- **App**: 3000 (standard)
- **Database**: 5432 (standard)
- **Purpose**: When you control the entire server

### Staging Environment

```bash
./port-config.sh preset staging
```

- **App**: 3010
- **Database**: 5440
- **Purpose**: Separate staging environment

## Environment Variables

The system uses these environment variables for port configuration:

```env
# Production Environment
APP_PORT=3001                    # Application port
DB_PORT=5433                     # Database port

# Development Environment
DEV_APP_PORT=3002               # Dev application port
DEV_DB_PORT=5434                # Dev database port

# Database Connection Strings (automatically generated)
DATABASE_URL=postgres://postgres:admin@localhost:5433/fakegoogle
DATABASE_ADMIN_URL=postgres://postgres:admin@localhost:5433/postgres
```

## Real-World Scenarios

### Scenario 1: Server with Existing Node.js App

**Problem**: Port 3000 is occupied by another Node.js application

**Solution**:

```bash
# Check ports
./port-config.sh status
# Output: Port 3000: ❌ In use

# Use multi-app preset
./port-config.sh preset multi
# This configures app to use port 3001

# Deploy
./docker-deploy.sh build
```

**Result**: Application runs on http://localhost:3001

### Scenario 2: Server with Existing PostgreSQL

**Problem**: Port 5432 is occupied by another PostgreSQL instance

**Solution**:

```bash
# Check ports
./port-config.sh status
# Output: Port 5432: ❌ In use

# Interactive configuration automatically suggests 5433
./port-config.sh interactive
# Follow prompts to configure

# Deploy with new configuration
./docker-deploy.sh build
```

**Result**: Database runs on port 5433, no conflicts

### Scenario 3: Multiple Environments on Same Server

**Setup Production**:

```bash
./port-config.sh preset multi
# App: 3001, DB: 5433
```

**Setup Staging**:

```bash
./port-config.sh preset staging
cp .env .env.staging
# App: 3010, DB: 5440
```

**Deploy Both**:

```bash
# Production
./docker-deploy.sh build

# Staging (with different env file)
cp .env.staging .env
./docker-deploy.sh build
```

## Manual Port Configuration

If you need specific ports, edit your `.env` file directly:

```env
# Custom ports
APP_PORT=3050
DB_PORT=5450
DEV_APP_PORT=3051
DEV_DB_PORT=5451

# Update database URLs to match
DATABASE_URL=postgres://postgres:admin@localhost:5450/fakegoogle
DATABASE_ADMIN_URL=postgres://postgres:admin@localhost:5450/postgres
```

## Docker Compose Integration

The Docker Compose files automatically use environment variables:

**docker-compose.yml** (Production):

```yaml
services:
  app:
    ports:
      - "${APP_PORT:-3001}:3000" # External:Internal
  db:
    ports:
      - "${DB_PORT:-5433}:5432" # External:Internal
```

**docker-compose.dev.yml** (Development):

```yaml
services:
  app:
    ports:
      - "${DEV_APP_PORT:-3002}:3000"
  db:
    ports:
      - "${DEV_DB_PORT:-5434}:5432"
```

## Troubleshooting

### Port Still Conflicting?

1. **Check what's using the port**:

   ```bash
   lsof -ti:3001  # Check specific port
   ```

2. **Kill the conflicting process** (if safe):

   ```bash
   sudo lsof -ti:3001 | xargs kill -9
   ```

3. **Use different port**:
   ```bash
   ./port-config.sh interactive
   # Choose a different port when prompted
   ```

### Database Connection Errors

If you see "connection refused" errors:

1. **Check DATABASE_URL matches your DB_PORT**:

   ```bash
   grep DATABASE_URL .env
   # Should show: postgres://postgres:admin@localhost:5433/fakegoogle
   ```

2. **Update if needed**:
   ```bash
   ./port-config.sh interactive
   # This regenerates correct URLs
   ```

### Docker Container Won't Start

1. **Check Docker logs**:

   ```bash
   docker logs fake-google-app
   docker logs fake-google-db
   ```

2. **Verify port configuration**:
   ```bash
   ./port-config.sh status
   ```

## Best Practices

### For Server Administrators

1. **Document port allocations**:

   ```
   3000: Main website
   3001: Fake Google demo
   3002: Development instance
   3010: Staging environment
   ```

2. **Use port ranges**:

   ```
   3000-3099: Web applications
   5432-5499: Database instances
   8000-8099: API services
   ```

3. **Environment variables everywhere**:
   - Never hardcode ports in configuration
   - Use `.env` files for each environment
   - Document required variables

### For Developers

1. **Always check ports first**:

   ```bash
   ./port-config.sh status
   ```

2. **Use interactive configuration**:

   ```bash
   ./port-config.sh interactive
   ```

3. **Test deployment**:
   ```bash
   # After configuration
   ./docker-deploy.sh build
   # Verify at configured URL
   ```

## Port Allocation Strategy

For organizations running multiple applications:

```
Production Applications:
  3001-3010: Customer-facing apps
  3011-3020: Internal tools
  3021-3030: Demos and prototypes

Development/Staging:
  3051-3060: Development instances
  3061-3070: Staging environments
  3071-3080: Testing instances

Databases:
  5433-5440: Production databases
  5441-5450: Development databases
  5451-5460: Testing databases
```

This systematic approach prevents conflicts and makes server management much easier.

## Summary

The port management system ensures that:

✅ **No conflicts** with standard applications  
✅ **Easy configuration** with automated tools  
✅ **Multiple environments** can coexist  
✅ **Flexible deployment** on any server  
✅ **Clear documentation** for operations teams

Use `./port-config.sh interactive` for the best experience!
