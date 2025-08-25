# Stage 1: Build the Vue.js application
FROM node:20-alpine AS build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock, pnpm-lock.yaml)
COPY package*.json ./

# Install project dependencies
# If you are using pnpm or yarn, change this line accordingly.
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application for production
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:stable-alpine

# Copy the built static files from the "build" stage to the Nginx server directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration for a Single Page Application (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to the outside world
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]