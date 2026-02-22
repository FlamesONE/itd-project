# Multi-stage build for production

# Stage 1: Dependencies
FROM oven/bun:1-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install production dependencies only
RUN bun install --frozen-lockfile --production

# Stage 2: Build
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install all dependencies (including dev)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Type check
RUN bun run typecheck

# Stage 3: Production runtime
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bunjs -u 1001

# Create uploads directory
RUN mkdir -p uploads && chown -R bunjs:nodejs uploads

# Copy production dependencies
COPY --from=deps --chown=bunjs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=bunjs:nodejs . .

# Switch to non-root user
USER bunjs

# Expose ports
EXPOSE 4000 4001 4002 4003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun run -e 'fetch("http://localhost:4003/health").catch(() => process.exit(1))'

# Start the application
CMD ["bun", "run", "start"]
