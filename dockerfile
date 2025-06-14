# Base image
FROM node:18.20.8

# Install system dependencies for canvas and other native modules
RUN apt-get update && apt-get install -y \
  build-essential \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy only package files first
COPY package*.json ./

# Install dependencies
RUN npm cache clean --force \
    && npm install --only=production

# Copy app files
COPY . .

# Expose port
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
