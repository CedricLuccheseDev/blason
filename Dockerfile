# npm resolves optional native deps differently across its own versions, so a
# lockfile written by another npm makes `npm ci` fail here with EUSAGE. Pin it,
# and generate the lockfile with the same version (see the new-project skill).
ARG NPM_VERSION=11.17.0

# Build stage — Dokploy writes a .env into the context (createEnvFile),
# which vite reads so VITE_* vars get inlined at build time.
FROM node:24-alpine AS builder
ARG NPM_VERSION
RUN npm i -g npm@${NPM_VERSION}
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx vite build

# Runtime stage — the server bundle keeps react/tanstack as external imports,
# so production node_modules are required (srvx comes with them, transitively).
FROM node:24-alpine
ARG NPM_VERSION
RUN npm i -g npm@${NPM_VERSION}
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
# --dir is required: srvx otherwise resolves --static relative to the entry dir.
CMD ["./node_modules/.bin/srvx", "serve", "--prod", "--port", "3000", "--dir", "/app", "--entry", "dist/server/server.js", "--static", "dist/client"]
