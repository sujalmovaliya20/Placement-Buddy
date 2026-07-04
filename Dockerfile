# Use Node.js 18 slim version as base
FROM node:18-slim

# Create working directory
WORKDIR /app

# Copy root lockfile and workspace package.json files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/

# Install dependencies (only for shared and backend workspaces)
RUN npm ci --workspace=shared --workspace=backend

# Copy source code and config files
COPY tsconfig.base.json ./
COPY shared ./shared
COPY backend ./backend

# Build the workspaces
RUN npm run build:shared
RUN npm run build:backend

# Expose backend port
EXPOSE 5000

# Set directory to backend for executing start script
WORKDIR /app/backend

# Start the application
CMD ["npm", "start"]
