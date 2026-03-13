# Node.js alpine base image
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy prisma schema for postinstall hook
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application source
COPY . .

# Expose port
EXPOSE 3001

# Command to run the application
CMD ["pnpm", "start"]
