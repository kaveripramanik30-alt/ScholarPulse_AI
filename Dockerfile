FROM node:22-alpine

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Build production client bundle
RUN npm run build

# Default environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start unified full-stack engine
CMD ["npm", "start"]
