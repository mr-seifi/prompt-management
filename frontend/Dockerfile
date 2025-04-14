# Stage 1: Build the React application
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all files
COPY . .

# Add build arguments for environment variables
ARG REACT_APP_API_URL
ARG REACT_APP_ENVIRONMENT
ARG REACT_APP_USE_MOCK_DATA

# Set environment variables for build
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_ENVIRONMENT=${REACT_APP_ENVIRONMENT}
ENV REACT_APP_USE_MOCK_DATA=${REACT_APP_USE_MOCK_DATA}

# Print environment variables for debugging
RUN echo "Building with API URL: $REACT_APP_API_URL"
RUN echo "Building with Environment: $REACT_APP_ENVIRONMENT"
RUN echo "Building with Mock Data: $REACT_APP_USE_MOCK_DATA"

# Build the app with CI=false to prevent treating warnings as errors
RUN CI=false npm run build

# Stage 2: Set up Apache
FROM httpd:2.4-alpine

# Copy Apache configuration if needed
# COPY ./apache/httpd.conf /usr/local/apache2/conf/httpd.conf

# Copy the built app to Apache's serve directory
COPY --from=build /app/build/ /usr/local/apache2/htdocs/

# Create simple htaccess file for SPA routing
RUN echo 'FallbackResource /index.html' > /usr/local/apache2/htdocs/.htaccess

# Enable mod_rewrite for SPA routing
RUN sed -i '/LoadModule rewrite_module/s/^#//g' /usr/local/apache2/conf/httpd.conf && \
    sed -i 's/AllowOverride None/AllowOverride All/g' /usr/local/apache2/conf/httpd.conf

# Expose port 80 - Note: This is only documentation; the actual port mapping is done in docker-compose.yml
EXPOSE 80

# Document that we're mapping to 8001 externally
LABEL com.prompt-manager.port-mapping="8001:80"

# Start Apache
CMD ["httpd-foreground"] 