FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["sh", "-c", "npm run prisma:deploy && npm run prisma:seed && npm run start"]

FROM base AS dev
COPY package*.json ./
RUN npm install
COPY . .
CMD ["sh", "-c", "npm run prisma:generate && npm run dev"]
