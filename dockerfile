# Base image
FROM node:18

# Create app directory
WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm install --only=production

# Copy remaining files
COPY . .

# Expose the app port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
