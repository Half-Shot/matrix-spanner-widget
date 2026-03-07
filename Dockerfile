FROM node:24-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml package.json .
RUN corepack enable
RUN pnpm install --frozen-lockfile
COPY . /app/
RUN pnpm build

FROM nginxinc/nginx-unprivileged:1-alpine
EXPOSE 8080
COPY --from=builder /app/public /usr/share/nginx/html
