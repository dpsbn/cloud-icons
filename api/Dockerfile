# Use Node.js LTS as the base image
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run the server
FROM base AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV production
ENV PORT 3002

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 cloudicons

# Copy built files
COPY --from=builder --chown=cloudicons:nodejs /app/dist ./dist
COPY --from=builder --chown=cloudicons:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=cloudicons:nodejs /app/package.json ./package.json

# Create data and public directories
RUN mkdir -p data public && chown -R cloudicons:nodejs data public

# Switch to non-root user
USER cloudicons

# Expose the port the app runs on
EXPOSE 3002

# Start the server
CMD ["node", "dist/index.js"]