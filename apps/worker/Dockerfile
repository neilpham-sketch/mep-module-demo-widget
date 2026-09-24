# Build context: repo root (this module's own root, not apps/worker/).
# Usage:
#   docker build \
#     --build-arg COMMON_VERSION=1.2.3 \
#     --build-arg CONTRACT_VERSION=1.2.3 \
#     --secret id=npm_token,env=NODE_AUTH_TOKEN \
#     -f apps/worker/Dockerfile .
#
# Mirrors mep-etr's proven Dockerfile 1:1 (docs/ADR-0004 — copy the pipeline that already
# works, don't invent a new one): same patch/deps/builder/prod-deps/runner stages, and the
# same Infisical CLI wrapper in CMD (this module's package.json pins @prowerbdigital/common
# and @prowerbdigital/contract to "workspace:*" for local dev against the outer mep-saas
# workspace — the "patch" stage below rewrites that to the CI-resolved semver before
# `pnpm install`, since a standalone Docker build context has no such workspace to resolve
# "workspace:*" against).

ARG NODE_VERSION=22

# ─── Base ──────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ─── Patch: pin workspace:* to the versions CI resolved ───────────────────────
FROM base AS patch
# Both args are referenced by the RUN below, so a newly published version changes
# this layer's cache key and forces a rebuild, while an unchanged version stays
# cached. That is the whole cache-invalidation mechanism — nothing else here may
# vary between builds, or every build would rebuild from this point on.
ARG COMMON_VERSION
ARG CONTRACT_VERSION
COPY .npmrc package.json ./
RUN set -e; \
    [ -n "$COMMON_VERSION" ] && [ -n "$CONTRACT_VERSION" ] || \
      { echo "COMMON_VERSION and CONTRACT_VERSION build-args are required"; exit 1; }; \
    sed -i \
      -e "s|\"@prowerbdigital/common\": \"workspace:\*\"|\"@prowerbdigital/common\": \"^$COMMON_VERSION\"|g" \
      -e "s|\"@prowerbdigital/contract\": \"workspace:\*\"|\"@prowerbdigital/contract\": \"^$CONTRACT_VERSION\"|g" \
      package.json; \
    grep prowerbdigital package.json

# ─── Deps: all (devDeps needed for nest build) ────────────────────────────────
FROM patch AS deps
RUN echo "shamefully-hoist=true" >> .npmrc
RUN --mount=type=secret,id=npm_token \
    NODE_AUTH_TOKEN=$(cat /run/secrets/npm_token) pnpm install

# ─── Builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=patch /app/package.json ./
COPY . .
RUN pnpm exec nest build worker --webpack

# ─── Prod deps ─────────────────────────────────────────────────────────────────
FROM patch AS prod-deps
RUN echo "shamefully-hoist=true" >> .npmrc
RUN --mount=type=secret,id=npm_token \
    NODE_AUTH_TOKEN=$(cat /run/secrets/npm_token) \
    PUPPETEER_SKIP_DOWNLOAD=true pnpm install --prod --no-optional && \
    find /app/node_modules -name "*.map" -delete 2>/dev/null; true

# ─── Runner ────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Pinned — check the currently-working version in another mep-module-* repo's Dockerfile
# before bumping; a newer CLI release has previously 404'd against our Infisical server.
RUN npm install -g @infisical/cli@0.43.97

COPY --from=prod-deps /app/node_modules    ./node_modules
COPY --from=builder   /app/dist/apps/worker ./dist/apps/worker

EXPOSE 8082
CMD ["sh", "-c", "infisical run \
  --projectId=$INFISICAL_PROJECT_ID \
  --env=$INFISICAL_ENV \
  --path=/mep-module-demo-widget-worker \
  --token=$INFISICAL_TOKEN \
  --domain=$INFISICAL_DOMAIN \
  -- node dist/apps/worker/main"]
