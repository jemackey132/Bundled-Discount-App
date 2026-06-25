FROM node:18-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

EXPOSE 3000
WORKDIR /app
COPY . .

RUN npm install
RUN npx prisma generate && npm run build

CMD ["sh", "-c", "npx prisma migrate deploy && node node_modules/@remix-run/serve/dist/cli.js build"]
