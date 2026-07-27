# ============================================
# Stage 1 — Builder
# ============================================
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl python3 make g++

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

# ============================================
# Stage 2 — Runtime
# ============================================
FROM node:20-alpine AS runtime

RUN apk add --no-cache openssl dumb-init
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Persistent directory for SQLite database
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app/data

# Run migrations at startup via a small entry script
COPY --chown=nodejs:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nodejs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["docker-entrypoint.sh"]