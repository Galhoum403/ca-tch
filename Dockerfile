FROM node:20-bookworm

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Compile JSX frontend bundle
RUN node build.js

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "server.js"]
