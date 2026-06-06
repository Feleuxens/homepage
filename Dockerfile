FROM node:24-alpine AS build
LABEL authors="Feleuxens"

WORKDIR /app

# RUN apk add --no-cache python3 make g++ vips-dev

# First inly install packages for better caching
COPY package*.json ./
RUN npm ci --only=production=false && npm cache clean --force

COPY . .

RUN npm run build

# static content image
FROM nginx:alpine AS nginx

RUN addgroup -g 1000 -S astro && \
    adduser -S astro -u 1000 -G astro

RUN apk add --no-cache dumb-init

COPY nginx.conf /etc/nginx/

RUN chown -R astro:astro /usr/share/nginx && \
    chown -R astro:astro /var/cache/nginx && \
    chown -R astro:astro /var/log/nginx && \
    chown -R astro:astro /etc/nginx/

RUN touch /var/run/nginx.pid && \
    chown -R astro:astro /var/run/nginx.pid

COPY --from=build --chown=astro:astro /app/dist/client /usr/share/nginx/html

# Drop root privileges
USER astro

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]


# dynamic content image
FROM node:24-alpine AS node

WORKDIR /app

RUN apk add --no-cache dumb-init

ENV NODE_ENV=production HOST=0.0.0.0 PORT=8201

COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json

USER node
EXPOSE 8201

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "./dist/server/entry.mjs"]
