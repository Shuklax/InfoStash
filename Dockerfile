# Use Node 22 base image
FROM node:22.11.0

# Set working directory
WORKDIR /app

# Copy package files first (better caching for deps)
COPY package*.json ./

# Install deps
RUN npm install

# Copy everything else
COPY . .

# Run setup script to populate data.db
RUN npm run setup

# Build Next.js app
RUN npm run build

# Expose app port
EXPOSE 3000

# Start in dev mode
CMD ["npm", "run", "dev"]
