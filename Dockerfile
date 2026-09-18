# syntax=docker/dockerfile:1

FROM oven/bun:1.2 AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM base AS build
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM base AS release
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=install /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY --from=build /app/server ./server
COPY --from=build /app/lib ./lib
COPY --from=build /app/src ./src
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/package.json ./package.json

RUN chown -R bun:bun /app
USER bun

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:3000/api/status').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "run", "server.ts"]
