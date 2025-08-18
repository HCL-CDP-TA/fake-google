[![Version](https://img.shields.io/github/v/release/HCL-CDP-TA/fake-google)](https://github.com/HCL-CDP-TA/fake-google/releases)

# Fake Google

A realistic Google search interface demo for martech pipeline demonstrations, complete with AI-powered ad generation and an admin interface for campaign management.

## 🚀 Quick Start

### Option 1: Docker Deployment (Recommended)

```bash
# Clone the repository
git clone https://github.com/HCL-CDP-TA/fake-google.git
cd fake-google

# Configure ports (for multi-app servers)
./port-config.sh interactive

# Deploy with Docker
./docker-deploy.sh build

# Access the application
open http://localhost:3001
```

### Option 2: Traditional Deployment

```bash
# Clone and deploy
git clone https://github.com/HCL-CDP-TA/fake-google.git
cd fake-google

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Deploy
./deploy.sh

# Access the application
open http://localhost:3001
```

## ✨ Features

- **🔍 Realistic Google Search Interface**: Pixel-perfect Google styling and behavior
- **🤖 AI-Powered Ad Generation**: Google Gemini integration for intelligent ad creation
- **📊 Admin Interface**: Campaign management with accordion-based UI
- **🔧 Smart Port Management**: Automatic port conflict resolution for multi-app servers
- **🐳 Docker Ready**: Complete containerization with PostgreSQL
- **⚡ Real Search Integration**: Optional Google Custom Search API integration
- **📈 UTM Parameter Automation**: Automatic campaign tracking parameter generation
- **🎨 Modern UI**: Built with Next.js 15, TypeScript, and shadcn/ui components

## 🔧 Port Configuration

**Important for Multi-App Deployments**: This application uses smart port configuration to avoid conflicts.

### Quick Port Setup

```bash
# Check current port usage
./port-config.sh status

# Interactive configuration (recommended)
./port-config.sh interactive

# Use presets for common scenarios
./port-config.sh preset multi     # Multi-app server
./port-config.sh preset single    # Single app server
./port-config.sh preset staging   # Staging environment
```

### Default Ports

| Environment | Application | Database | Purpose                             |
| ----------- | ----------- | -------- | ----------------------------------- |
| Production  | 3001        | 5433     | Avoid conflicts with standard ports |
| Development | 3002        | 5434     | Separate dev environment            |
| Standard    | 3000        | 5432     | Traditional single-app deployment   |

📚 **Detailed Port Management Guide**: See [PORT-MANAGEMENT.md](./PORT-MANAGEMENT.md)

## 🏗️ Architecture

- **Frontend**: Next.js 15 with App Router and TypeScript
- **Database**: PostgreSQL with ads campaign storage
- **Styling**: Google-accurate CSS with shadcn/ui components
- **AI Integration**: Google Gemini API with fallback system
- **Search**: Google Custom Search API integration
- **Deployment**: Docker containerization with multi-stage builds

## 📖 Documentation

- **[Deployment Guide](./DEPLOYMENT.md)**: Comprehensive deployment instructions
- **[Port Management](./PORT-MANAGEMENT.md)**: Multi-app server port configuration
- **[Environment Setup](./.env.example)**: Environment variable configuration

## 🎯 Use Cases

- **Martech Demonstrations**: Show complete customer journey from search to conversion
- **Campaign Testing**: Test ad campaigns in a controlled environment
- **Training**: Train teams on digital marketing concepts
- **Prototyping**: Prototype search-based marketing flows
- **Education**: Demonstrate how search advertising works

## 🛠️ Development

### Prerequisites

- Node.js 18+
- PostgreSQL 12+ (or use Docker)
- Optional: Google API keys for enhanced functionality

### Development Setup

```bash
# Clone repository
git clone https://github.com/HCL-CDP-TA/fake-google.git
cd fake-google

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development environment with Docker
./docker-deploy.sh dev

# Or start traditionally
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 🔑 API Configuration

### Google Custom Search (Optional)

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Custom Search API
3. Create credentials and get API key
4. Set up Custom Search Engine at [programmablesearchengine.google.com](https://programmablesearchengine.google.com/)
5. Add to `.env`:

```env
GOOGLE_SEARCH_API_KEY=your_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

### Google Gemini AI (Optional)

1. Visit [Google AI Studio](https://makersuite.google.com/)
2. Get Gemini API key
3. Add to `.env`:

```env
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

## 🖥️ Admin Interface

Access the admin panel at `/admin` to:

- **Create Campaigns**: Set up new advertising campaigns
- **Manage Ads**: Edit ad copy, targeting, and budgets
- **Generate AI Ads**: Use Google Gemini to create compelling ad copy
- **Monitor Performance**: View campaign metrics and performance
- **UTM Management**: Configure tracking parameters

## 🐳 Docker Deployment

### Production

```bash
# Build and start
./docker-deploy.sh build

# Other commands
./docker-deploy.sh start    # Start existing containers
./docker-deploy.sh stop     # Stop containers
./docker-deploy.sh restart  # Restart containers
./docker-deploy.sh logs     # View logs
```

### Development with Hot Reload

```bash
./docker-deploy.sh dev
```

## 🔧 Environment Variables

| Variable                  | Required | Default    | Description                  |
| ------------------------- | -------- | ---------- | ---------------------------- |
| `APP_PORT`                | No       | 3001       | Application port             |
| `DB_PORT`                 | No       | 5433       | Database port                |
| `DATABASE_URL`            | Yes      | -          | PostgreSQL connection string |
| `GOOGLE_SEARCH_API_KEY`   | No       | -          | Google Custom Search API key |
| `GOOGLE_SEARCH_ENGINE_ID` | No       | -          | Custom Search Engine ID      |
| `GOOGLE_GEMINI_API_KEY`   | No       | -          | Google Gemini API key        |
| `NODE_ENV`                | No       | production | Node environment             |

## 🚨 Troubleshooting

### Port Conflicts

```bash
# Check port usage
./port-config.sh status

# Configure new ports
./port-config.sh interactive

# Deploy with new configuration
./docker-deploy.sh build
```

### Database Issues

```bash
# Check database connection
docker logs fake-google-db

# Verify database URL in .env matches DB_PORT
grep DATABASE_URL .env
```

### Build Issues

```bash
# Clear Docker cache
docker system prune -a

# Rebuild completely
./docker-deploy.sh build
```

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues or questions:

1. Check the [documentation](./DEPLOYMENT.md)
2. Review [port management guide](./PORT-MANAGEMENT.md)
3. Check existing [GitHub issues](https://github.com/HCL-CDP-TA/fake-google/issues)
4. Create a new issue if needed

---

**Built for martech demonstrations and educational purposes. Not affiliated with Google Inc.**
