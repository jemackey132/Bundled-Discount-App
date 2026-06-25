FROM node:18-alpine

EXPOSE 3000
WORKDIR /app
COPY . .

RUN npm install
RUN npx prisma generate && npm run build

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
