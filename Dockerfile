# ---------- Build stage ----------
FROM node:22-alpine AS build

WORKDIR /app

# Prisma schema must exist before npm ci: @prisma/client's postinstall
# generates the typed client from it.
COPY package.json package-lock.json ./
COPY prisma ./prisma

# The optional npmrc secret lets builds behind a private registry mirror
# authenticate without baking credentials into any image layer:
#   docker build --secret id=npmrc,src=$HOME/.npmrc .
# Without the secret, the public npm registry is used as usual.
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Drop dev dependencies; `prisma` stays (it is a runtime dependency here,
# needed for `migrate deploy` at container start).
RUN npm prune --omit=dev

# ---------- Runtime stage ----------
FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# openssl is required by Prisma's query engine on alpine
RUN apk add --no-cache openssl

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

# Regenerate the Prisma client in the final layer to be safe against
# pruning edge cases, then hand the app dir to the unprivileged user.
RUN npx prisma generate \
  && mkdir -p /app/data \
  && chown -R node:node /app

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/health" || exit 1

# Apply pending migrations, then start the API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
