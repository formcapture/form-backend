import { Opts } from '../types/opts';

import createKeycloakRouter from './keycloak';

describe('KeycloakApi', () => {
  describe('createKeycloakRouter', () => {
    it('creates the keycloak router', () => {
      const opts: Opts = {} as Opts;
      const router = createKeycloakRouter(opts);
      expect(router).toBeDefined();
    });
    it('provides an endpoint for getting a keycloak config', () => {
      const opts: Opts = {} as Opts;
      const router = createKeycloakRouter(opts);
      const route = router.stack.find((s) => s.route?.path === '/config' && s.route?.stack[0].method === 'get');
      expect(route).toBeDefined();
    });
  });
});
