# Multi-stage build: compile the static bundle with Node, serve it with nginx.
# Ships no Node runtime or node_modules in the final image.

FROM node:22-alpine AS build
WORKDIR /app
# package*.json copied before the rest of the source so `npm ci` is cached by
# Docker as long as dependencies haven't changed.
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Custom config needed for SPA client-side routing, see nginx.conf.
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
