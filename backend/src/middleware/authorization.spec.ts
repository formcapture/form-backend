import { FormConfigRequest } from '../types/formConfigRequest';
import { Opts } from '../types/opts';

import { authorization as authorizationCreator, userRolesLoader as userRolesLoaderCreator } from './authorization';

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
  });
});
