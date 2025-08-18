# Fake Google - Deployment Guide

This guide covers Docker-based deployment with port conflict resolution for multi-app server environments.

## 🚀 Quick Start

```bash
# Clone and deploy
git clone https://github.com/HCL-CDP-TA/fake-google.git
cd fake-google

# Configure ports (if needed for multi-app servers)
./port-config.sh interactive

# Deploy
./deploy.sh

# Access: http://localhost:3001
```

## 🐳 Docker Deployment (Primary Method)

**Important**: This application is designed to avoid common port conflicts in multi-app server environments.

### Quick Port Setup

Use the port configuration script for easy setup:

```bash
# Make the script executable
chmod +x port-config.sh

# Interactive configuration (recommended)
./port-config.sh interactive

# Quick status check
./port-config.sh status

# Use preset configurations
./port-config.sh preset multi    # Multi-app deployment
./port-config.sh preset single   # Single app deployment
./port-config.sh preset staging  # Staging environment
```

### Default Port Configuration

| Environment | Application | Database | Purpose                             |
| ----------- | ----------- | -------- | ----------------------------------- |
| Production  | 3001        | 5433     | Avoid conflicts with standard ports |
| Development | 3002        | 5434     | Separate dev environment            |
| Standard    | 3000        | 5432     | Traditional single-app deployment   |

### Custom Port Configuration

Set custom ports via environment variables:

```bash
# Production ports
export APP_PORT=3001
export DB_PORT=5433

# Development ports
export DEV_APP_PORT=3002
export DEV_DB_PORT=5434
```

Or edit your `.env` file:

```env
APP_PORT=3001
DB_PORT=5433
DEV_APP_PORT=3002
DEV_DB_PORT=5434
```

---

## 🐳 Docker Deployment (Recommended)

### Quick Start with Docker

```bash
# Production deployment
./deploy.sh

# Development deployment with hot reload
./deploy.sh --dev

# Clean build (rebuild from scratch)
./deploy.sh --clean

# Stop all containers
./deploy.sh --stop
```

### Docker Prerequisites

1. **Docker** (v20 or higher)
2. **Docker Compose** (v2 or higher)

### Docker Features

- **Complete Stack**: Includes PostgreSQL database and Next.js app
- **Port Conflict Avoidance**: Uses 3001/5433 by default to avoid conflicts
- **Zero Configuration**: Works out of the box with sensible defaults
- **Development Mode**: Hot reload and volume mounting for development
- **Production Ready**: Optimized multi-stage builds
- **Health Checks**: Automatic service health monitoring
- **Data Persistence**: Database data persists between container restarts

### Docker Environment Setup

Create a `.env` file (uses port-safe defaults):

```bash
# Port Configuration (for multi-app deployments)
APP_PORT=3001
DB_PORT=5433
DEV_APP_PORT=3002
DEV_DB_PORT=5434

# Database URLs with custom ports
DATABASE_URL=postgres://postgres:admin@localhost:5433/fakegoogle
DATABASE_ADMIN_URL=postgres://postgres:admin@localhost:5433/postgres

# Optional API keys for enhanced functionality
GOOGLE_SEARCH_API_KEY=your_api_key
GOOGLE_SEARCH_ENGINE_ID=your_engine_id
GOOGLE_GEMINI_API_KEY=your_gemini_key
```

### Docker Commands

```bash
# Production deployment
./docker-deploy.sh build

# Development with hot reload
./docker-deploy.sh dev

# View logs
./docker-deploy.sh logs

# Manual Docker Compose commands
docker-compose up -d                    # Start production
docker-compose -f docker-compose.dev.yml up -d  # Start development
docker-compose down                     # Stop containers
docker-compose logs -f                  # View logs
```

---

## 🖥️ Traditional Server Deployment

### Quick Start (Traditional)

```bash
# Simple deployment (recommended)
./deploy.sh

# Build only (for CI/CD)
./deploy.sh --build-only

# Skip database setup (if already configured)
./deploy.sh --skip-db
```

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v12 or higher)
3. **Environment Variables** (optional but recommended)

## Environment Setup

1. Configure ports (if needed):

   ```bash
   ./port-config.sh interactive
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your configuration:

   ```bash
   # Port Configuration
   APP_PORT=3001
   DB_PORT=5433

   # Database URLs
   DATABASE_URL=postgres://postgres:admin@localhost:5433/fakegoogle
   DATABASE_ADMIN_URL=postgres://postgres:admin@localhost:5433/postgres

   # Optional (for enhanced functionality)
   GOOGLE_SEARCH_API_KEY=your_api_key
   GOOGLE_SEARCH_ENGINE_ID=your_engine_id
   GOOGLE_GEMINI_API_KEY=your_gemini_key
   ```

**Note**: The deploy script automatically loads environment variables from `.env` file.## Deploy Script Options

### Basic Usage

```bash
./deploy.sh [options]
```

### Options

- `-h, --help` - Show help message
- `-b, --build-only` - Only build the app, don't start it
- `-d, --skip-db` - Skip database setup
- `-n, --skip-deps` - Skip npm install
- `--admin-conn STRING` - Custom database admin connection string

---

## 🔧 Port Conflict Resolution

### Common Scenarios

**Scenario 1: Server with existing apps on standard ports**

```bash
# Check what's running
./port-config.sh status

# Use multi-app preset
./port-config.sh preset multi

# Deploy with custom ports
./docker-deploy.sh build
```

**Scenario 2: Multiple environments on same server**

```bash
# Production environment
./port-config.sh preset multi

# Staging environment
./port-config.sh preset staging
```

**Scenario 3: Development alongside production**

```bash
# Use development environment
./docker-deploy.sh dev
```

### Manual Port Configuration

If ports are still conflicting, manually edit:

1. **docker-compose.yml** (production):

```yaml
services:
  app:
    ports:
      - "${APP_PORT:-3001}:3000"
  db:
    ports:
      - "${DB_PORT:-5433}:5432"
```

2. **docker-compose.dev.yml** (development):

```yaml
services:
  app:
    ports:
      - "${DEV_APP_PORT:-3002}:3000"
  db:
    ports:
      - "${DEV_DB_PORT:-5434}:5432"
```

3. **Update .env file**:

```env
DATABASE_URL=postgres://postgres:admin@localhost:5433/fakegoogle
```

---

## 📱 Application URLs

After successful deployment:

- **Main App**: http://localhost:3001 (or your configured APP_PORT)
- **Admin Panel**: http://localhost:3001/admin
- **Development**: http://localhost:3002 (if using dev environment)

---

## 🔍 Troubleshooting

### Port Conflicts

**Error**: "Port already in use" or "address already in use"

**Solutions**:

1. Run port configuration script: `./port-config.sh status`
2. Use interactive configuration: `./port-config.sh interactive`
3. Stop conflicting services: `sudo lsof -ti:3000 | xargs kill -9`
4. Use alternative ports: `./port-config.sh preset multi`

### Database Connection Issues

If you see database connection errors:

1. Check PostgreSQL is running
2. Verify database credentials in `.env`
3. Ensure database port matches configuration
4. Update `DATABASE_URL` with correct port

### Build Errors

For Docker build issues:

1. Clear Docker cache: `docker system prune -a`
2. Rebuild: `./docker-deploy.sh build`
3. Check port configuration: `./port-config.sh status`

### Common Port Issues

| Error              | Cause                      | Solution                            |
| ------------------ | -------------------------- | ----------------------------------- |
| EADDRINUSE         | Port already in use        | Use `./port-config.sh interactive`  |
| Connection refused | Wrong port in DATABASE_URL | Update .env with correct DB_PORT    |
| 502 Bad Gateway    | App not starting           | Check `docker logs fake-google-app` |

### Missing Dependencies

```bash
# Force reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Build Failures

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

---

## 🚀 Production Considerations

1. **Security**: Change default database passwords
2. **Port Management**: Use consistent port allocation across environments
3. **SSL**: Use reverse proxy (nginx) for HTTPS
4. **Monitoring**: Set up logging and monitoring
5. **Backups**: Regular database backups
6. **Updates**: Plan for application updates
7. **Multi-tenancy**: Use port prefixes for different clients (3010, 3020, 3030)

## Multi-App Server Best Practices

When deploying on servers with multiple applications:

1. **Port Allocation Strategy**:

   - Use port ranges (3001-3099 for apps, 5433-5499 for databases)
   - Document port usage per application
   - Use environment variables for flexibility

2. **Environment Isolation**:

   - Separate .env files per environment
   - Use Docker networks for isolation
   - Consider using Docker Compose project names

3. **Resource Management**:
   - Monitor port usage: `./port-config.sh status`
   - Use reverse proxy for unified access
   - Implement health checks

For production servers, consider:

1. **Use a process manager:**

   ```bash
   npm install -g pm2
   pm2 start npm --name "fake-google" -- start
   ```

2. **Set up reverse proxy** (nginx/Apache)

3. **Configure environment variables** properly

4. **Set up SSL certificates**

5. **Configure database backups**

---

## 📋 Environment Variables Reference

| Variable                  | Required    | Default     | Description                         |
| ------------------------- | ----------- | ----------- | ----------------------------------- |
| `APP_PORT`                | No          | 3001        | Application port                    |
| `DB_PORT`                 | No          | 5433        | Database port                       |
| `DEV_APP_PORT`            | No          | 3002        | Development application port        |
| `DEV_DB_PORT`             | No          | 5434        | Development database port           |
| `DATABASE_URL`            | Yes         | -           | Application database connection     |
| `DATABASE_ADMIN_URL`      | Deploy only | -           | Admin database connection for setup |
| `GOOGLE_SEARCH_API_KEY`   | No          | -           | For real Google search results      |
| `GOOGLE_SEARCH_ENGINE_ID` | No          | -           | Custom search engine ID             |
| `GOOGLE_GEMINI_API_KEY`   | No          | -           | For AI-powered ad generation        |
| `NODE_ENV`                | No          | production  | Node environment                    |
| `COMPOSE_PROJECT_NAME`    | No          | fake-google | Docker project name                 |

---

## 🆘 Support

For issues or questions:

1. Check the application logs
2. Verify all environment variables are set
3. Ensure PostgreSQL is accessible
4. Review the database schema in `create-db-and-table.sh`
5. Use `./port-config.sh status` to check port conflicts
6. Check Docker logs: `docker logs fake-google-app`
