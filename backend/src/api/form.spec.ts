import { Opts } from '../types/opts';

import createFormRouter from './form';

describe('FormApi', () => {
  describe('createFormRouter', () => {
    it('creates the form router', () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo',
        POSTGREST_URL: 'baz',
      } as Opts;
      const router = createFormRouter(opts);
      expect(router).toBeDefined();
    });

    describe('formRouter', () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo'
      } as Opts;
      it('provides an endpoint for getting a form', () => {
        const router = createFormRouter(opts);
        const route = router.stack.find((s) => s.route?.path === '/:formId' && s.route?.stack[0].method === 'get');
        expect(route).toBeDefined();
      });
      it('provides an endpoint for getting a form item', () => {
        const router = createFormRouter(opts);
        const route = router.stack.find(
          (s) => s.route?.path === '/:formId/item/:itemId' && s.route?.stack[0].method === 'get'
        );
        expect(route).toBeDefined();
      });
      it('provides an endpoint for getting an empty form', () => {
        const router = createFormRouter(opts);
        const route = router.stack.find(
          (s) => s.route?.path === '/:formId/new' && s.route?.stack[0].method === 'get'
        );
        expect(route).toBeDefined();
      });
      it('provides an endpoint for creating a form item', () => {
        const router = createFormRouter(opts);
        const route = router.stack.find(
          (s) => s.route?.path === '/:formId/item' && s.route?.stack[0].method === 'post'
        );
        expect(route).toBeDefined();
      });
      it('provides an endpoint for updating a form item', () => {
        const router = createFormRouter(opts);
        const route = router.stack.find(
          (s) => s.route?.path === '/:formId/item/:itemId' && s.route?.stack[0].method === 'patch'
        );
        expect(route).toBeDefined();
      });
      it('provides an endpoint for deleting a form item', () => {
        const router = createFormRouter(opts);
        const route = router.stack.find(
          (s) => s.route?.path === '/:formId/item/:itemId' && s.route?.stack[0].method === 'delete'
        );
        expect(route).toBeDefined();
      });
      it('provides an endpoint for getting a file of a form entry', () => {
        const router = createFormRouter(opts);
        const route = router.stack.find(
          (s) => s.route?.path === '/files/:formId/*' && s.route?.stack[0].method === 'get'
        );
        expect(route).toBeDefined();
      });
    });
  });
});
