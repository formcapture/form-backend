import path from 'path';

import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';

import createApiRouter from './api/index';
import { harmonizePublicKey } from './keycloak/keycloak';
import { setupLogger } from './logger';
import { Opts } from './types/opts';

export const runapp = async () => {
  const opts = await prepare();
  run(opts);
};

const prepare = async () => {
  dotenv.config();
  const logger = setupLogger({ label: 'app:prepare' });
  logger.debug('Preparing app');

  const opts: Opts = {
    FORM_CONFIGS_DIR: process.env.FORM_CONFIGS_DIR ?? 'form_configs',
    FILE_UPLOAD_DIR: process.env.FILE_UPLOAD_DIR ?? 'files',
    SIZE_LIMIT: process.env.SIZE_LIMIT ?? '100kb',
    POSTGREST_URL: process.env.POSTGREST_URL ?? 'http://postgrest:3000',
    POSTGREST_DEFAULT_SCHEMA: process.env.POSTGREST_DEFAULT_SCHEMA ?? 'public',
    POSTGREST_JWT_CLIENT_ID: process.env.POSTGREST_JWT_CLIENT_ID,
    POSTGREST_KEYCLOAK_CLIENT_SECRET: process.env.POSTGREST_KEYCLOAK_CLIENT_SECRET,
    KC_REALM: process.env.KC_REALM,
    KC_AUTH_SERVER_URL: process.env.KC_AUTH_SERVER_URL,
    KC_PUBLIC_KEY: harmonizePublicKey(process.env.KC_PUBLIC_KEY),
    KC_CLIENT_APP_ID: process.env.KC_CLIENT_APP_ID
  } as Opts;

  const requiredKeys: (keyof Opts)[] = [
    'POSTGREST_JWT_CLIENT_ID',
    'POSTGREST_KEYCLOAK_CLIENT_SECRET',
    'KC_REALM',
    'KC_AUTH_SERVER_URL',
    'KC_PUBLIC_KEY',
    'KC_CLIENT_APP_ID'
  ];

  const allKeysPresent = requiredKeys.every(key => opts[key] !== undefined);

  if (!allKeysPresent) {
    logger.error('Missing required env keys');
    process.exit(1);
  }

  return opts;
};

const run = (opts: Opts) => {
  const logger = setupLogger({ label: 'app:run' });
  logger.debug('Running app');
  const app = express();
  const port = 3000;

  app.use(helmet({
    contentSecurityPolicy: false
  }));

  const apiRouter = createApiRouter(opts);

  app.use('/app', express.static(path.join(__dirname, '..', 'public', 'app')));
  app.use('/docs', express.static(path.join(__dirname, '..', 'public', 'docs')));
  app.use('/', apiRouter);

  app.listen(port, () => {
    logger.info(`form-backend listening at localhost:${port}`);
  });
};

export default runapp;
