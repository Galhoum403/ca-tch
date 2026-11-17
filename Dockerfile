FROM node:20-bullseye-slim

WORKDIR /app

# Install native build tools for SQLite compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --production

COPY . .

# Compile JSX frontend bundle
RUN node build.js

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "server.js"]
