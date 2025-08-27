import path from 'path';

import { PostgrestClient } from '@supabase/postgrest-js';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';

import createApiRouter from './api/index';
import { getPostgrestJwt, harmonizePublicKey } from './keycloak/keycloak';
import { setupLogger } from './logger';
import { Opts } from './types/opts';

export const runapp = async () => {
  const opts = await prepare();
  const isReady = await checkConnection(opts);
  if (!isReady) {
    process.exit(1);
  }
  run(opts);
};

const prepare = async () => {
  dotenv.config();
  const logger = setupLogger({ label: 'app:prepare' });
  logger.debug('Preparing app');

  const opts: Opts = {
    FILE_UPLOAD_DIR: process.env.FILE_UPLOAD_DIR ?? 'files',
    FORM_CONFIGS_DIR: process.env.FORM_CONFIGS_DIR ?? 'form_configs',
    KC_AUTH_SERVER_URL: process.env.KC_AUTH_SERVER_URL,
    KC_CLIENT_APP_ID: process.env.KC_CLIENT_APP_ID,
    KC_PUBLIC_KEY: harmonizePublicKey(process.env.KC_PUBLIC_KEY),
    KC_REALM: process.env.KC_REALM,
    LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
    POSTGREST_DEFAULT_SCHEMA: process.env.POSTGREST_DEFAULT_SCHEMA ?? 'public',
    POSTGREST_JWT_CLIENT_ID: process.env.POSTGREST_JWT_CLIENT_ID,
    POSTGREST_KEYCLOAK_CLIENT_SECRET: process.env.POSTGREST_KEYCLOAK_CLIENT_SECRET,
    POSTGREST_URL: process.env.POSTGREST_URL ?? 'http://postgrest:3000',
    SIZE_LIMIT: process.env.SIZE_LIMIT ?? '100kb'
  } as Opts;

  const requiredKeys: (keyof Opts)[] = [
    'KC_AUTH_SERVER_URL',
    'KC_CLIENT_APP_ID',
    'KC_PUBLIC_KEY',
    'KC_REALM',
    'POSTGREST_JWT_CLIENT_ID',
    'POSTGREST_KEYCLOAK_CLIENT_SECRET'
  ];

  const allKeysPresent = requiredKeys.every(key => opts[key] !== undefined);

  if (!allKeysPresent) {
    logger.error('Missing required env keys');
    process.exit(1);
  }

  return opts;
};

const checkConnection = async (opts: Opts): Promise<boolean> => {
  const logger = setupLogger({ label: 'app:checkConnection' });
  const postgrestToken = await getPostgrestJwt(opts);
  if (!postgrestToken) {
    logger.error('Failed to get postgrest token for postgrest client');
    return false;
  }

  const pgClient = new PostgrestClient(opts.POSTGREST_URL, {
    schema: opts.POSTGREST_DEFAULT_SCHEMA,
    headers: {
      Authorization: `Bearer ${postgrestToken}`
    }
  });

  const response = await pgClient
    .schema(opts.POSTGREST_DEFAULT_SCHEMA)
    .from('__form_backend_healthcheck')
    .update({
      // eslint-disable-next-line camelcase
      last_start: new Date().toISOString()
    })
    .eq('id', 1);
  if (response.status && response.status >= 200 && response.status < 300) {
    logger.info('App is ready - Connected via postgrest correctly.');
    return true;
  }

  logger.error('App is not ready - Could not connect via postgrest correctly. Exiting.');
  logger.error(`Status: ${response.status}`);
  logger.error(`StatusText: ${response.statusText}`);
  logger.error(`Error: ${JSON.stringify(response.error)}`);
  if (response.error?.code === '42501') {
    logger.error('Insufficient privileges for role "formbackend" - ' +
      'Make sure the database migrations have been run correctly and postgrest is setup up correctly.'
    );
  }
  return false;
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
    logger.info('----------------------------------------');
    logger.info(`🚀 form-backend listening at localhost:${port}`);
    logger.info('📦 Environment variables loaded:');
    Object.keys(opts).forEach((key) => {
      logger.debug(`🌐 ${key}: ${opts[key as keyof Opts]}`);
    });
    logger.info('----------------------------------------');
  });
};

export default runapp;
