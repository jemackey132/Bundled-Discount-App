FROM node:18-alpine

RUN apk add --no-cache openssl

EXPOSE 3000
WORKDIR /app
COPY . .

RUN npm install
RUN npx prisma generate && npm run build

CMD ["sh", "-c", "echo 'Running migrations...' && npx prisma migrate deploy && echo 'Starting remix-serve...' && node node_modules/@remix-run/serve/dist/cli.js build 2>&1"]
