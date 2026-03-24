# Multi-stage build for production deployment
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# Build arguments
ARG NODE_ENV=production
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION
ARG NEXT_PUBLIC_GA_TRACKING_ID

# Set environment variables for build (needed for Next.js to embed NEXT_PUBLIC_* vars)
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_GA_TRACKING_ID=$NEXT_PUBLIC_GA_TRACKING_ID

# Build the application
RUN npm run build

# Ensure public directory exists (create empty one if needed)
RUN mkdir -p /app/public

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install postgresql-client for database readiness checks
RUN apk add --no-cache postgresql-client

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application from standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy docker entrypoint script
COPY --chmod=755 docker-entrypoint.sh /docker-entrypoint.sh

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NPM_CONFIG_CACHE=/app/.npm-cache

# Create npm cache directory with proper permissions
RUN mkdir -p /app/.npm-cache && chown -R nextjs:nodejs /app/.npm-cache

# Add labels for metadata
LABEL org.opencontainers.image.title="fake-google"
LABEL org.opencontainers.image.description="fake-google application"

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Use entrypoint for database readiness check
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
