FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY package*.json ./
ENV NODE_ENV=production
RUN npm ci --omit=dev --no-audit --no-fund
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]