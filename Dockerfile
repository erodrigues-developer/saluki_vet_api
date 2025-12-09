FROM node:20-alpine3.18 as builder

WORKDIR /usr/src/app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

RUN npm prune --production

# Fase de Produção
FROM node:20-alpine3.18

RUN apk update && \
    apk add --no-cache openssl ca-certificates coreutils

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app ./

EXPOSE 3001

ENV NODE_OPTIONS=--openssl-legacy-provider

CMD ["npm", "run", "start:prod"]
