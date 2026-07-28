FROM node:22-slim AS base
RUN corepack enable
WORKDIR /app
RUN groupadd --gid 10001 app && useradd --uid 10001 --gid app --create-home --shell /usr/sbin/nologin app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm build

# Runs database migrations with tsx, which is a devDependency: kept as its
# own stage/image (built from `deps`, which still has the full install) so
# the runtime image below never ships dev tooling.
FROM deps AS migrate
ENV NODE_ENV=production
COPY server/database ./server/database
USER app
CMD ["node_modules/.bin/tsx", "server/database/migrate.ts"]

# Nitro's `.output/server` is a self-contained bundle (its own node_modules,
# including native deps like sharp, and its own package.json), so the
# runtime image only ever needs that directory - no devDependencies, and no
# copy of the workspace's own node_modules either.
FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/.output ./.output

EXPOSE 3000
USER app
CMD ["node", ".output/server/index.mjs"]
