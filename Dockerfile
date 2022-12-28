FROM node:18 AS builder
WORKDIR /app
COPY yarn.lock package.json /app/
RUN yarn --frozen-lockfile && yarn cache clean
COPY . /app/
RUN yarn build

FROM nginxinc/nginx-unprivileged
COPY --from=builder /app/public /usr/share/nginx/html