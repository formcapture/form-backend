import { Opts } from '../types/opts';

import createApiRouter from './index';

describe('Api', () => {
  describe('createApiRouter', () => {
    it('creates the api router', () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo',
        POSTGREST_URL: 'baz',
      } as Opts;
      const router = createApiRouter(opts);
      expect(router).toBeDefined();
    });

    describe('apiRouter', () => {
      it.todo('provides an endpoint for the form api');
    });
  });
});
