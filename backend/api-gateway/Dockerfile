# Base Node.js image
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

# Set working directory to gateway directory
WORKDIR /app/api-gateway

# Copy package files
COPY api-gateway/package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy entire backend directory for shared/config access
COPY . /app

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4000

# Start with nodemon for hot reloading
CMD ["dumb-init", "npm", "run", "dev"]

# Production build stage
FROM base AS builder

# Set working directory to gateway directory
WORKDIR /app/api-gateway

# Copy package files
COPY api-gateway/package*.json ./

# Install all dependencies for building
RUN npm install

# Copy entire backend directory
COPY . /app

# Production stage
FROM base AS production

# Set node environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/src ./src

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["dumb-init", "node", "src/index.js"]
