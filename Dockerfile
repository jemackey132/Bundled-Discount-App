FROM node:18-alpine

RUN apk add --no-cache openssl

EXPOSE 3000
WORKDIR /app
COPY . .

RUN npm install
RUN npx prisma generate && npm run build

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
