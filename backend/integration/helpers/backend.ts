import { once } from 'events';
import { mkdtemp, rm } from 'fs/promises';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { tmpdir } from 'os';
import path from 'path';

import { createApp } from '../../src/app';
import { clearPostgrestJwtCache } from '../../src/keycloak/keycloak';
import { Opts } from '../../src/types/opts';

import {
  FORM_CONFIGS_DIR,
  getPostgrestUrl,
  KC_CLIENT_APP_ID,
  KC_PUBLIC_URL,
  KC_REALM,
  POSTGREST_JWT_CLIENT_ID
} from './env';
import { kcPublicKey } from './tokens';
import { startTokenStub } from './tokenStub';

/**
 * Starts the real form-backend app in-process against the test postgrest,
 * with the token stub instead of keycloak and a temporary upload dir.
 */
export const startBackend = async () => {
  clearPostgrestJwtCache();
  const tokenStub = await startTokenStub();
  const uploadDir = await mkdtemp(path.join(tmpdir(), 'fb-integration-uploads-'));

  const opts: Opts = {
    FORM_CONFIGS_DIR,
    FILE_UPLOAD_DIR: uploadDir,
    SIZE_LIMIT: '1mb',
    POSTGREST_URL: getPostgrestUrl(),
    POSTGREST_DEFAULT_SCHEMA: 'sampledata',
    POSTGREST_JWT_CLIENT_ID,
    POSTGREST_KEYCLOAK_CLIENT_SECRET: 'not-checked-by-the-stub',
    KC_REALM,
    KC_AUTH_SERVER_URL: tokenStub.url,
    KC_PUBLIC_URL,
    KC_PUBLIC_KEY: kcPublicKey,
    KC_CLIENT_APP_ID
  };

  const server: Server = createApp(opts).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    opts,
    uploadDir,
    tokenStub,
    close: async () => {
      await new Promise<void>(resolve => server.close(() => resolve()));
      await tokenStub.close();
      await rm(uploadDir, { recursive: true, force: true });
    }
  };
};

export type TestBackend = Awaited<ReturnType<typeof startBackend>>;
