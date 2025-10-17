FROM node:25-alpine AS builder

RUN mkdir -p /form-backend/app /form-backend/backend

WORKDIR /form-backend

COPY backend/package.json backend/package-lock.json backend/
COPY app/package.json app/package-lock.json app/
RUN cd backend && npm ci
RUN cd app && npm ci

COPY backend backend/
COPY CHANGELOG.md .
RUN cd backend && npm run build && npm run build-docs

COPY app app/
RUN cd app && npm run build


FROM node:25-alpine AS runner

RUN apk add dumb-init

RUN mkdir -p /form-backend/public \
    && mkdir -p /form-backend/form_configs

WORKDIR /form-backend

VOLUME ["/form-backend/form_configs"]

RUN chown -R node:node /form-backend

USER node

COPY --from=builder --chown=node:node /form-backend/backend/public public/
COPY --from=builder --chown=node:node /form-backend/backend/package.json /form-backend/backend/package-lock.json .
COPY --from=builder --chown=node:node /form-backend/backend/dist dist/

RUN npm ci --only=production

ENV NODE_ENV=production

CMD ["dumb-init", "node", "dist/index.js"]
