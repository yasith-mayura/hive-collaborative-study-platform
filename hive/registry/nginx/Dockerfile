# Use the official Nginx image from Docker Hub
FROM nginx:latest

# Set maintainer label (optional)
# LABEL maintainer="yourname@example.com"

# Copy custom HTML files to Nginx default web directory
# Make sure you have a 'html' folder in the same directory as this Dockerfile
#
# Expose port 80 for the web server
EXPOSE 80

# Start Nginx in the foreground (default behavior)
CMD ["nginx", "-g", "daemon off;"]