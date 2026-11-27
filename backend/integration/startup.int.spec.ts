import { checkConnection } from '../src/app';

import { startBackend, TestBackend } from './helpers/backend';
import { postgrest, request } from './helpers/http';

describe('startup', () => {
  let backend: TestBackend;

  beforeAll(async () => {
    backend = await startBackend();
  });

  afterAll(async () => {
    await backend.close();
  });

  it('checks the connection by updating the healthcheck table via postgrest', async () => {
    const before = await postgrest('/__form_backend_healthcheck?id=eq.1');
    expect(before.body[0].last_start).toBe('1970-01-01T00:00:00');

    expect(await checkConnection(backend.opts)).toBe(true);

    const after = await postgrest('/__form_backend_healthcheck?id=eq.1');
    expect(after.body[0].last_start).not.toBe('1970-01-01T00:00:00');
    expect(backend.tokenStub.requestCount()).toBe(1);
  });

  it('fails the connection check if the healthcheck table cannot be updated', async () => {
    // postgrest does not expose the public schema, so the update fails
    expect(await checkConnection({ ...backend.opts, POSTGREST_DEFAULT_SCHEMA: 'public' })).toBe(false);
  });

  it('serves the keycloak config for the app', async () => {
    const { status, body } = await request(backend.url, '/keycloak/config');
    expect(status).toBe(200);
    expect(body).toEqual({
      url: backend.opts.KC_PUBLIC_URL,
      realm: backend.opts.KC_REALM,
      clientId: backend.opts.KC_CLIENT_APP_ID
    });
  });
});
