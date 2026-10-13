FROM node:20-alpine AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:20-alpine
RUN apk add --no-cache openssl ca-certificates coreutils
WORKDIR /usr/src/app
ENV NODE_ENV=production NODE_OPTIONS=--max-old-space-size=256
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY package.json ./
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
