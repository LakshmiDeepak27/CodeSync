FROM node:22-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY shared/ ./shared/
COPY server/ ./server/
COPY prisma/ ./prisma/

RUN npm install --workspace=codesync-server
RUN npx prisma generate

WORKDIR /app/server

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=/app/prisma/schema.prisma && node src/server.js"]
