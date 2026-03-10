FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package.json package-lock.json* ./
RUN npm ci --production

# Copy source code
COPY . .

# Create data and uploads directories
RUN mkdir -p data uploads

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the server
CMD ["node", "src/server.js"]
