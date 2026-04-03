FROM node:20-alpine AS builder
RUN apk add --no-cache curl
WORKDIR /app
COPY package*.json ./
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 10 && \
    npm config set strict-ssl false && \
    npm ci --force --network-concurrency 1
COPY . .
RUN npm run build

# ====================== Production Stage ======================
FROM nginx:stable-alpine

# Copy built files to nginx default directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Optional: Copy custom nginx config for SPA routing + best practices
COPY nginx-proxy.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
