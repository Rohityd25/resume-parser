FROM node:20-alpine

WORKDIR /app

# Install dependencies first
COPY package.json package-lock.json* ./
RUN npm ci --production

# Copy source code
COPY . .

# Create required folders
RUN mkdir -p data uploads

# Render uses dynamic ports
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget --quiet --tries=1 --spider http://localhost:$PORT/api/health || exit 1

# Start server
CMD ["node", "src/server.js"]