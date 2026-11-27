import { FormConfigRequest } from '../types/formConfigRequest';
import { Opts } from '../types/opts';

import {
  authorization as authorizationCreator,
  Permission,
  userRolesLoader as userRolesLoaderCreator
} from './authorization';

const getTokenFromHeaderMock = jest.fn();
const decodeTokenMock = jest.fn();
const getRolesFromTokenMock = jest.fn();
jest.mock('../keycloak/keycloak', () => {
  return {
    getTokenFromHeader: (header: any) => getTokenFromHeaderMock(header),
    decodeToken: () => decodeTokenMock(),
    getRolesFromToken: () => getRolesFromTokenMock(),
  };
});

describe('Authorization Middleware', () => {
  describe('userRolesLoader', () => {
    const userRolesLoader = userRolesLoaderCreator({ opts: {} as Opts });
    it('gets the user roles from the authorization token', () => {
      const req: FormConfigRequest = {
        headers: {
          authorization: 'Bearer bar'
        }
      } as FormConfigRequest;

      getTokenFromHeaderMock.mockReturnValue('bar');

      userRolesLoader(req, {} as any, () => undefined);

      expect(getTokenFromHeaderMock).toHaveBeenCalledWith('Bearer bar');
    });
    it('loads the user roles into the request object', () => {
      const req: FormConfigRequest = {
        headers: {
          authorization: 'Bearer bar'
        }
      } as FormConfigRequest;

      getTokenFromHeaderMock.mockReturnValue('bar');
      // eslint-disable-next-line camelcase
      decodeTokenMock.mockReturnValue({ resource_access: { foo: { roles: ['baz'] } } });
      getRolesFromTokenMock.mockReturnValue(['baz']);

      userRolesLoader(req, {} as any, () => undefined);

      expect(req.userRoles).toEqual(['baz']);
    });
  });
  describe('invalid or expired tokens', () => {
    // agreed behaviour: such users are treated as anonymous instead of being rejected,
    // so public forms stay readable and protected forms answer with 401
    const loadRolesForInvalidToken = () => {
      const req = { headers: { authorization: 'Bearer invalid' } } as FormConfigRequest;
      getTokenFromHeaderMock.mockReturnValue('invalid');
      decodeTokenMock.mockReturnValue(undefined);
      getRolesFromTokenMock.mockReturnValue([]);
      const next = jest.fn();
      userRolesLoaderCreator({ opts: {} as Opts })(req, {} as any, next);
      return { req, next };
    };

    it('are treated as anonymous', () => {
      const { req, next } = loadRolesForInvalidToken();
      expect(req.userRoles).toEqual([]);
      expect(next).toHaveBeenCalledWith();
    });

    it('can still read public forms', () => {
      const { req } = loadRolesForInvalidToken();
      req.formConfig = { access: { read: true } } as FormConfigRequest['formConfig'];
      const next = jest.fn();
      authorizationCreator({ opts: {} as Opts, requiredPermissions: ['readForm'] })(req, {} as any, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('cannot write protected forms', () => {
      const { req } = loadRolesForInvalidToken();
      req.formConfig = { access: { read: true, write: ['editor'] } } as FormConfigRequest['formConfig'];
      const next = jest.fn();
      authorizationCreator({ opts: {} as Opts, requiredPermissions: ['writeForm'] })(req, {} as any, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
    });
  });

  describe('authorization', () => {
    it('succeeds if the user has readForm permission', () => {
      const authorization = authorizationCreator({
        opts: {} as Opts,
        requiredPermissions: ['readForm']
      });
      const req: FormConfigRequest = {
        userRoles: ['foo'],
        formConfig: {
          access: {
            read: ['foo']
          }
        }
      } as FormConfigRequest;
      const nextMock = jest.fn();
      authorization(req, {} as any, nextMock);

      expect(nextMock).toHaveBeenCalled();
      expect(nextMock).toHaveBeenCalledWith();
    });
    it('fails if the user has not readForm permission', () => {
      const authorization = authorizationCreator({
        opts: {} as Opts,
        requiredPermissions: ['readForm']
      });
      const req: FormConfigRequest = {
        userRoles: ['foo'],
        formConfig: {
          access: {
            read: ['bar']
          }
        }
      } as FormConfigRequest;
      const nextMock = jest.fn();
      authorization(req, {} as any, nextMock);

      expect(nextMock).toHaveBeenCalled();
      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    });
    it('succeeds if the user has writeForm permission', () => {
      const authorization = authorizationCreator({
        opts: {} as Opts,
        requiredPermissions: ['writeForm']
      });
      const req: FormConfigRequest = {
        userRoles: ['foo'],
        formConfig: {
          access: {
            write: ['foo']
          }
        }
      } as FormConfigRequest;
      const nextMock = jest.fn();
      authorization(req, {} as any, nextMock);

      expect(nextMock).toHaveBeenCalled();
      expect(nextMock).toHaveBeenCalledWith();
    });
    it('fails if the user has not writeForm permission', () => {
      const authorization = authorizationCreator({
        opts: {} as Opts,
        requiredPermissions: ['writeForm']
      });
      const req: FormConfigRequest = {
        userRoles: ['foo'],
        formConfig: {
          access: {
            write: ['bar']
          }
        }
      } as FormConfigRequest;
      const nextMock = jest.fn();
      authorization(req, {} as any, nextMock);

      expect(nextMock).toHaveBeenCalled();
      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    });
    it('succeeds if the user has tableView permission', () => {
      const authorization = authorizationCreator({
        opts: {} as Opts,
        requiredPermissions: ['tableView']
      });
      const req: FormConfigRequest = {
        userRoles: ['foo'],
        formConfig: {
          views: {
            table: true
          }
        }
      } as FormConfigRequest;
      const nextMock = jest.fn();
      authorization(req, {} as any, nextMock);

      expect(nextMock).toHaveBeenCalled();
      expect(nextMock).toHaveBeenCalledWith();
    });
    it('fails if the user has not tableView permission', () => {
      const authorization = authorizationCreator({
        opts: {} as Opts,
        requiredPermissions: ['tableView']
      });
      const req: FormConfigRequest = {
        userRoles: ['foo'],
        formConfig: {
          views: {
            table: false
          }
        }
      } as FormConfigRequest;
      const nextMock = jest.fn();
      authorization(req, {} as any, nextMock);

      expect(nextMock).toHaveBeenCalled();
      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    });
    it('succeeds if the user has itemView permission', () => {
      const authorization = authorizationCreator({
        opts: {} as Opts,
        requiredPermissions: ['itemView']
      });
      const req: FormConfigRequest = {
        userRoles: ['foo'],
        formConfig: {
          views: {
            item: true
          }
        }
      } as FormConfigRequest;
      const nextMock = jest.fn();
      authorization(req, {} as any, nextMock);

      expect(nextMock).toHaveBeenCalled();
      expect(nextMock).toHaveBeenCalledWith();
    });
    it('fails if the user has not itemView permission', () => {
      const authorization = authorizationCreator({
        opts: {} as Opts,
        requiredPermissions: ['itemView']
      });
      const req: FormConfigRequest = {
        userRoles: ['foo'],
        formConfig: {
          views: {
            item: false
          }
        }
      } as FormConfigRequest;
      const nextMock = jest.fn();
      authorization(req, {} as any, nextMock);

      expect(nextMock).toHaveBeenCalled();
      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    });
    it('fails for unknown permissions', () => {
      const authorization = authorizationCreator({
        opts: {} as Opts,
        requiredPermissions: ['unknown' as Permission]
      });
      const req = { userRoles: ['foo'], formConfig: {}, params: { formId: 'bar' } } as unknown as FormConfigRequest;
      const nextMock = jest.fn();
      authorization(req, {} as any, nextMock);

      expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'AuthenticationError' }));
    });
  });
  describe('userRolesLoader errors', () => {
    it('passes an AuthenticationError to next if loading the roles fails', () => {
      const userRolesLoader = userRolesLoaderCreator({ opts: {} as Opts });
      getTokenFromHeaderMock.mockImplementationOnce(() => {
        throw new Error('foo');
      });
      const nextMock = jest.fn();
      userRolesLoader({ headers: {} } as FormConfigRequest, {} as any, nextMock);

      expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({
        name: 'AuthenticationError',
        message: 'Failed loading user roles'
      }));
    });
  });
});
