FROM node:22-alpine as build
LABEL authors="Feleuxens"

WORKDIR /app

# RUN apk add --no-cache python3 make g++ vips-dev

# First inly install packages for better caching
COPY package*.json ./
RUN npm ci --only=production=false && npm cache clean --force

COPY . .

RUN npm run build

RUN chown astro:nodejs /app

# Production stage
FROM nginx:alpine

RUN addgroup -g 1000 -S astro && \
    adduser -S astro -u 1000 -G astro \

COPY --chown astro:astro nginx.conf /etc/nginx/

RUN chown -R astro:astro /usr/share/nginx && \
    chown -R astro:astro /var/cache/nginx && \
    chown -R astro:astro /var/log/nginx && \
    chown -R astro:astro /etc/nginx/ \

RUN touch /var/run/nginx.pid && \
    chown -R nginx_app:nginx_app /var/run/nginx.pid \

COPY --from=build --chown=astro:astro /app/dist /usr/share/nginx/html

# Drop root privileges
USER astro

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]