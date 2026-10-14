# --- Dashboard: Vue build, only web/dist survives this stage. ---
FROM node:22-alpine AS web
WORKDIR /app
COPY shared ./shared
COPY web/package.json web/package-lock.json ./web/
RUN npm --prefix web ci
COPY web ./web
RUN npm --prefix web run build

# --- Server: TypeScript to dist/. ---
FROM node:22-alpine AS server
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY shared ./shared
COPY src ./src
RUN npm run build

# --- Runtime: production dependencies, compiled server, built dashboard, migrations. ---
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=server /app/dist ./dist
COPY --from=web /app/web/dist ./web/dist
COPY migrations ./migrations
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "dist/src/main.js"]
