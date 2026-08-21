# --- Install dependencies dengan bun (lebih cepat dari npm) ---
FROM oven/bun:1-alpine AS dependencies

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1-alpine AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_COUPLE_NAME
ARG NEXT_PUBLIC_BRIDE_NAME
ARG NEXT_PUBLIC_GROOM_NAME
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_COUPLE_NAME=$NEXT_PUBLIC_COUPLE_NAME
ENV NEXT_PUBLIC_BRIDE_NAME=$NEXT_PUBLIC_BRIDE_NAME
ENV NEXT_PUBLIC_GROOM_NAME=$NEXT_PUBLIC_GROOM_NAME
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN bun run build

# --- Runner: Next.js standalone server berjalan paling stabil di Node ---
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/db/migrations ./db/migrations

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
