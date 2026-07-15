# ---------- Build stage ----------
  FROM node:22-alpine AS build

  ENV PNPM_HOME="/pnpm"
  ENV PATH="$PNPM_HOME:$PATH"
  
  RUN corepack enable
  
  WORKDIR /app
  
  # Copy manifests first for better Docker layer caching
  COPY package.json pnpm-lock.yaml ./
  COPY prisma ./prisma
  
  # Install dependencies
  RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
      --mount=type=cache,id=pnpm,target=/pnpm/store \
      pnpm install --frozen-lockfile
  
  COPY tsconfig.json tsconfig.build.json nest-cli.json ./
  COPY src ./src
  
  RUN pnpm build
  
  # Remove dev dependencies
  RUN pnpm prune --prod
  
  # ---------- Runtime stage ----------
  FROM node:22-alpine AS runner
  
  ENV NODE_ENV=production
  ENV PNPM_HOME="/pnpm"
  ENV PATH="$PNPM_HOME:$PATH"
  
  RUN corepack enable
  
  WORKDIR /app
  
  RUN apk add --no-cache openssl
  
  COPY --from=build /app/node_modules ./node_modules
  COPY --from=build /app/dist ./dist
  COPY --from=build /app/prisma ./prisma
  COPY package.json ./
  
  RUN pnpm exec prisma generate \
      && mkdir -p /app/data \
      && chown -R node:node /app
  
  USER node
  
  EXPOSE 3000
  
  HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/health" || exit 1
  
  CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/main.js"]