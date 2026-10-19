# SlotScout: one container serving the API and the built web app.
FROM node:22-alpine AS build
# Optional, for builds behind a proxy.
ARG HTTPS_PROXY
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/engine/package.json packages/engine/
COPY packages/pipeline/package.json packages/pipeline/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
ARG HTTPS_PROXY
ENV NODE_ENV=production PORT=8787 HOST=0.0.0.0
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/engine/package.json packages/engine/
COPY packages/pipeline/package.json packages/pipeline/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev --workspace @slotscout/api --include-workspace-root=false && npm cache clean --force
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/web/dist apps/web/dist
# Registers and rules the site reads; docker-compose bind-mounts the live copies over these.
COPY data data
COPY sources sources
COPY rules rules
COPY reports reports
RUN mkdir -p /feedback && chown -R node:node /feedback
ENV FEEDBACK_DIR=/feedback
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:8787/v1/health || exit 1
CMD ["node", "apps/api/dist/server.mjs"]
