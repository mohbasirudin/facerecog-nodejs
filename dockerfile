# Base image using Bun (Debian-slim based)
FROM oven/bun:1-debian

# Install system dependencies for canvas and other native modules
RUN apt-get update && apt-get install -y \
  build-essential \
  pkg-config \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  libpixman-1-dev \
  && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package file
COPY package.json ./

# Install dependencies using Bun
RUN bun install

# Copy app files
COPY . .

# Expose port
EXPOSE 3000

# Run the app
CMD ["bun", "run", "index.js"]
