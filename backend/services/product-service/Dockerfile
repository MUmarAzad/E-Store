# Base Node.js image for all services
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Development stage
FROM base AS development

# Copy entire backend directory first
COPY . /app

# Install root dependencies (shared across all services)
WORKDIR /app
RUN npm install

# Set working directory to service directory
WORKDIR /app/services/product-service

# Install service-specific dependencies
RUN npm install

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Start with nodemon for hot reloading
CMD ["dumb-init", "npm", "run", "dev"]

# Production build stage
FROM base AS builder

# Copy entire backend directory
COPY . /app

# Install root dependencies
WORKDIR /app
RUN npm install --production

# Install service dependencies
WORKDIR /app/services/product-service
RUN npm install --production

# Production stage
FROM base AS production

# Set node environment
ENV NODE_ENV=production

# Copy entire app from builder
COPY --from=builder /app /app

# Set working directory
WORKDIR /app/services/product-service

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["dumb-init", "node", "src/index.js"]
