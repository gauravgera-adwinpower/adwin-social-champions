# Production Dockerfile for ADWIN Social Champions 2026
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci

# Copy source files
COPY . .

# Build frontend static bundle
RUN npm run build

# Expose port
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

# Start unified Express server serving API + static frontend
CMD ["node", "--experimental-sqlite", "server/index.js"]
