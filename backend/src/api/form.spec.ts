import { authorization, userRolesLoader } from '../middleware/authorization';
import { Opts } from '../types/opts';

import createFormRouter from './form';

const authorizationCheckerMock = jest.fn();
const userRolesLoaderMock = jest.fn();
jest.mock('../middleware/authorization', () => ({
  authorization: jest.fn(() => authorizationCheckerMock),
  userRolesLoader: jest.fn(() => userRolesLoaderMock)
}));

const serviceMock: Record<string, jest.Mock> = {
  getForm: jest.fn(),
  getEmptyForm: jest.fn(),
  getFormItem: jest.fn(),
  createFormItem: jest.fn(),
  updateFormItem: jest.fn(),
  deleteFormItem: jest.fn(),
  getFile: jest.fn()
};
jest.mock('../service/form', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => serviceMock)
}));

describe('FormApi', () => {
  describe('route handlers', () => {
    const opts = { FORM_CONFIGS_DIR: 'foo' } as Opts;

    it.each([
      ['get', '/:formId', ['readForm', 'tableView'], 'getForm'],
      ['get', '/:formId/new', ['readForm', 'itemView'], 'getEmptyForm'],
      ['get', '/:formId/item/:itemId', ['readForm', 'itemView'], 'getFormItem'],
      ['post', '/:formId/item', ['writeForm'], 'createFormItem'],
      ['patch', '/:formId/item/:itemId', ['writeForm'], 'updateFormItem'],
      ['delete', '/:formId/item/:itemId', ['writeForm'], 'deleteFormItem'],
      ['get', '/files/:formId/*fileIdentifier', ['readForm', 'itemView'], 'getFile']
    ])('%s %s loads roles, checks %p and calls %s', (method, path, permissions, serviceMethod) => {
      jest.clearAllMocks();
      const router = createFormRouter(opts);
      const route = router.stack.find(
        (s) => s.route?.path === path && s.route?.stack[0].method === method
      )!.route!;
      const req = {} as any;
      const res = {} as any;
      const next = jest.fn();

      route.stack[1].handle(req, res, next);
      expect(userRolesLoaderMock).toHaveBeenCalledWith(req, res, next);

      route.stack[2].handle(req, res, next);
      expect(authorization).toHaveBeenCalledWith({ opts, requiredPermissions: permissions });
      expect(authorizationCheckerMock).toHaveBeenCalledWith(req, res, next);

      route.stack[3].handle(req, res, next);
      expect(serviceMock[serviceMethod]).toHaveBeenCalledWith(req, res, next);
    });

    it('creates the user roles loader with the opts', () => {
      createFormRouter(opts);
      expect(userRolesLoader).toHaveBeenCalledWith({ opts });
    });
  });


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
          (s) => s.route?.path === '/files/:formId/*fileIdentifier' && s.route?.stack[0].method === 'get'
        );
        expect(route).toBeDefined();
      });
    });
  });
});
