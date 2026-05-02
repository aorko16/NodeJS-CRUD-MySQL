FROM node:20-alpine

WORKDIR /app

# Copy package files first (better caching)
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install all dependencies (picks up mysql2 automatically)
RUN npm install --prefix server && npm install --prefix client

# Copy all project files
COPY . .

# Build the React client
RUN npm run build --prefix client

# Copy React build into server public folder
RUN mkdir -p server/public && cp -r client/dist/* server/public/

# Open port 5000
EXPOSE 5000

# Start the server
CMD ["npm", "start", "--prefix", "server"]