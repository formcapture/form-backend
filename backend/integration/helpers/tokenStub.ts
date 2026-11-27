import { createServer } from 'http';
import { AddressInfo } from 'net';

import { KC_REALM } from './env';
import { postgrestToken } from './tokens';

/**
 * Minimal stand-in for the keycloak token endpoint (client credentials grant).
 * It hands out postgrest tokens signed with the test secret.
 */
export const startTokenStub = async () => {
  let requestCount = 0;
  const tokenPath = `/realms/${KC_REALM}/protocol/openid-connect/token`;

  const server = createServer((req, res) => {
    if (req.method === 'POST' && req.url === tokenPath) {
      requestCount++;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      // eslint-disable-next-line camelcase
      res.end(JSON.stringify({ access_token: postgrestToken(), expires_in: 300 }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    requestCount: () => requestCount,
    close: () => new Promise<void>(resolve => server.close(() => resolve()))
  };
};
